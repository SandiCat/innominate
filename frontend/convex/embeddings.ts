import {
  internalAction,
  ActionCtx,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import * as TextTree from "../src/lib/TextTree";
import { myAction } from "./wrapper";

export const removeAllEmbeddings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db
      .query("notes")
      .filter((q) => q.neq(q.field("embedding"), undefined))
      .collect();
    for (const note of notes) {
      await ctx.db.patch(note._id, { embedding: undefined });
    }
  },
});

export const notesNeedingEmbeddingBatch = internalQuery({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db
      .query("notes")
      .filter((q) =>
        q.and(
          q.eq(q.field("embedding"), undefined),
          q.not(q.and(q.eq(q.field("title"), ""), q.eq(q.field("content"), "")))
        )
      )
      .take(100);
    return notes.map((note) => note._id);
  },
});

function noteRepr(tag: string, note: Doc<"notes">): TextTree.TextTree[] {
  const body = [`<body>`, TextTree.indent(note.content.split("\n")), `</body>`];

  const fields: TextTree.TextTree[] = [
    note.title ? `<title>${note.title}</title>` : null,
    note.content ? TextTree.spread(body) : null,
    note.metadata ? `<metadata>${note.metadata}</metadata>` : null,
  ].filter((f) => f !== null);

  return [`<${tag}>`, TextTree.indent(fields), `</${tag}>`];
}

export function buildEmbeddingText(
  lineage: Doc<"notes">[],
  note: Doc<"notes">
): string {
  const context = [
    "<context>",
    TextTree.indent(
      lineage.map((note, ix) => {
        const tag = ix === 0 ? "root" : "reply";
        return TextTree.spread(noteRepr(tag, note));
      })
    ),
    "</context>",
  ];

  const optionalContext = lineage.length > 0 ? context : [];

  const tree: TextTree.TextTree = TextTree.spread([
    ...optionalContext,
    TextTree.spread(noteRepr("mainReply", note)),
  ]);

  return TextTree.render(tree);
}

export const getEmbeddingText = internalQuery({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, { noteId }) => {
    const note = await ctx.db.get(noteId);
    if (!note) {
      console.error("Note not found");
      return;
    }

    const lineage: Doc<"notes">[] = [];
    let currentNote = note;
    while (currentNote.parentId) {
      const parent = await ctx.db.get(currentNote.parentId);
      if (!parent) {
        break;
      }
      lineage.push(parent);
      currentNote = parent;
    }

    return buildEmbeddingText(lineage.reverse(), note);
  },
});

export const storeEmbedding = internalMutation({
  args: {
    noteId: v.id("notes"),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, { noteId, embedding }) => {
    await ctx.db.patch(noteId, { embedding });
  },
});

const MODEL = "text-embedding-3-large";
export const EMBEDDING_DIM = 3072;

async function callOpenAIEmbeddingsAPI(texts: string[]): Promise<number[][]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data.map((item: { embedding: number[] }) => item.embedding);
}

async function generateEmbeddings(ctx: ActionCtx, noteIds: Id<"notes">[]) {
  const embeddingTextsWithIds = await Promise.all(
    noteIds.map(async (noteId) => {
      const text = await ctx.runQuery(internal.embeddings.getEmbeddingText, {
        noteId,
      });
      return { noteId, text };
    })
  );

  const validNotes = embeddingTextsWithIds.filter(
    (item) => item.text !== null && item.text !== ""
  );

  if (validNotes.length === 0) {
    return;
  }

  const result = await callOpenAIEmbeddingsAPI(
    // TODO: why doesn't this typecheck?
    validNotes.map((item) => item.text!)
  );

  await Promise.all(
    validNotes.map(async (item, index) => {
      const embedding = result[index];
      await ctx.runMutation(internal.embeddings.storeEmbedding, {
        noteId: item.noteId,
        embedding,
      });
    })
  );
}

export const generateEmbedding = internalAction({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, { noteId }) => {
    await generateEmbeddings(ctx, [noteId]);
  },
});

export const embedAllNotes = internalAction({
  args: {},
  handler: async (ctx) => {
    const noteIds = await ctx.runQuery(
      internal.embeddings.notesNeedingEmbeddingBatch
    );
    if (noteIds.length === 0) {
      return;
    }
    await generateEmbeddings(ctx, noteIds);
    await ctx.scheduler.runAfter(0, internal.embeddings.embedAllNotes);
  },
});

type SearchResult = {
  _id: Id<"notes">;
  _score: number;
};

export const getSimilarNotes = myAction({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, { noteId }): Promise<SearchResult[]> => {
    const note = await ctx.runQuery(api.notes.get, {
      noteId,
    });
    if (!note) {
      console.error("Note not found");
      return [];
    }
    const embedding = note.embedding;
    if (!embedding) {
      return [];
    }
    const searchResults = await ctx.vectorSearch("notes", "by_embedding", {
      vector: embedding,
      limit: 20,
      filter: (q) => q.eq("userId", note.userId),
    });

    const filteredResults = searchResults.filter(
      (result) => result._id !== noteId
    );

    return filteredResults;
  },
});

export const search = myAction({
  args: {
    query: v.string(),
  },
  handler: async (ctx, { query }) => {
    if (query === "") {
      return [];
    }

    const [embedding] = await callOpenAIEmbeddingsAPI([query]);
    const searchResults = await ctx.vectorSearch("notes", "by_embedding", {
      vector: embedding,
      limit: 20,
      filter: (q) => q.eq("userId", ctx.user._id),
    });
    return searchResults;
  },
});
