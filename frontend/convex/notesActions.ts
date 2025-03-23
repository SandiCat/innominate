import { internalAction, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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
      const text = await ctx.runQuery(internal.notes.getEmbeddingText, {
        noteId,
      });
      return { noteId, text };
    })
  );

  const validNotes = embeddingTextsWithIds.filter((item) => item.text !== null);

  if (validNotes.length === 0) {
    return;
  }

  const result = await callOpenAIEmbeddingsAPI(
    validNotes.map((item) => item.text)
  );

  await Promise.all(
    validNotes.map(async (item, index) => {
      const embedding = result[index];
      await ctx.runMutation(internal.notes.storeEmbedding, {
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
      internal.notes.notesNeedingEmbeddingBatch
    );
    if (noteIds.length === 0) {
      return;
    }
    await generateEmbeddings(ctx, noteIds);
    await ctx.scheduler.runAfter(0, internal.notesActions.embedAllNotes);
  },
});
