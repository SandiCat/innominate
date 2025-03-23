import { myQuery, myMutation } from "./wrapper";
import {
  internalMutation,
  internalQuery,
  MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { parseNoteBody } from "../src/types";
import { humanReadableID } from "./human_hash/human_hash";
import { Id } from "./_generated/dataModel";
import { buildSearchText } from "@/lib/note";
import { internal } from "./_generated/api";

export async function createEmptyNote(
  ctx: MutationCtx,
  userId: Id<"users">,
  parentId?: Id<"notes">
): Promise<Id<"notes">> {
  const humanReadableId = humanReadableID();
  return ctx.db.insert("notes", {
    title: "",
    content: "",
    metadata: "",
    parentId,
    userId,
    humanReadableId,
    searchText: "",
  });
}

export const get = myQuery({
  // TODO: Allowing this to be optional simplifies chaining a `useQuery` with a
  // `useState`. I wonder if there's a better way.
  args: { noteId: v.optional(v.id("notes")) },
  handler: async (ctx, { noteId }) => {
    if (!noteId) return null;
    return await ctx.db.get(noteId);
  },
});

export const getChildren = myQuery({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_parent", (q) => q.eq("parentId", noteId))
      .collect();
  },
});

// TODO: row level security
export const update = myMutation({
  args: {
    noteId: v.id("notes"),
    title: v.string(),
    content: v.string(),
    metadata: v.string(),
    // TODO: undefined could mean both "don't change parent" and "remove parent"
    parentId: v.optional(v.id("notes")),
  },
  handler: async (ctx, { noteId, title, content, metadata, parentId }) => {
    // First delete ALL existing mentions for this note
    await ctx.db
      .query("mentions")
      .withIndex("by_from", (q) => q.eq("from", noteId))
      .collect()
      .then((mentions) =>
        Promise.all(mentions.map((m) => ctx.db.delete(m._id)))
      );

    // Then add the new mentions from the current content
    const tokens = parseNoteBody(content);
    await Promise.all(
      tokens
        .filter((t) => t.type === "mention")
        .map((mention) =>
          ctx.db.insert("mentions", { from: noteId, to: mention.noteId })
        )
    );

    const searchText = buildSearchText(title, content, metadata);

    await ctx.db.patch(noteId, {
      title,
      content,
      metadata,
      searchText,
      parentId,
    });

    await ctx.scheduler.runAfter(0, internal.notesActions.generateEmbedding, {
      noteId,
    });
  },
});

export const deleteNote = myMutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    await ctx.db.delete(noteId);

    // Delete associated canvas items
    await ctx.db
      .query("canvasItems")
      .withIndex("by_rootNote", (q) => q.eq("rootNoteId", noteId))
      .collect()
      .then((canvasItems) =>
        Promise.all(canvasItems.map((ci) => ctx.db.delete(ci._id)))
      );

    // Delete associated mentions

    await ctx.db
      .query("mentions")
      .withIndex("by_from", (q) => q.eq("from", noteId))
      .collect()
      .then((mentions) =>
        Promise.all(mentions.map((m) => ctx.db.delete(m._id)))
      );

    await ctx.db
      .query("mentions")
      .withIndex("by_to", (q) => q.eq("to", noteId))
      .collect()
      .then((mentions) =>
        Promise.all(mentions.map((m) => ctx.db.delete(m._id)))
      );
  },
});

export const create = myMutation({
  args: {},
  handler: async (ctx) => {
    return await createEmptyNote(ctx, ctx.user._id);
  },
});

export const createChild = myMutation({
  args: {
    parentId: v.id("notes"),
  },
  handler: async (ctx, { parentId }) => {
    return await createEmptyNote(ctx, ctx.user._id, parentId);
  },
});

export const search = myQuery({
  args: {
    query: v.string(),
  },
  handler: async (ctx, { query }) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];
    return await ctx.db
      .query("notes")
      .withSearchIndex("search_searchText", (q) =>
        q.search("searchText", trimmedQuery).eq("userId", ctx.user._id)
      )
      .take(10);
  },
});

export const recent = myQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .order("desc")
      .take(20);
  },
});

export const searchOrRecent = myQuery({
  args: { query: v.string(), userId: v.id("users") },
  handler: async (ctx, { query, userId }) => {
    const trimmedQuery = query.trim();
    const numResults = 50;
    if (trimmedQuery) {
      return await ctx.db
        .query("notes")
        .withSearchIndex("search_searchText", (q) =>
          q.search("searchText", trimmedQuery).eq("userId", userId)
        )
        .take(numResults);
    } else {
      return await ctx.db
        .query("notes")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(numResults);
    }
  },
});

export const getMentionedBy = myQuery({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    const mentions = await ctx.db
      .query("mentions")
      .withIndex("by_to", (q) => q.eq("to", noteId))
      .collect();

    const uniqueMentionedNotes = new Set(mentions.map((m) => m.from));

    return await Promise.all(
      Array.from(uniqueMentionedNotes).map(async (noteId) => {
        const note = await ctx.db.get(noteId);
        if (!note) throw new Error("Mention of non-existent note");
        return note;
      })
    );
  },
});

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
          q.not(
            q.and(
              q.eq(q.field("title"), ""),
              q.eq(q.field("content"), ""),
              q.eq(q.field("metadata"), "")
            )
          )
        )
      )
      .take(100);
    return notes.map((note) => note._id);
  },
});

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
    return buildSearchText(note.title, note.content, note.metadata);
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

// export const vectorSearch = myQuery({
//   args: {
//     query: v.string(),
//     limit: v.optional(v.number()),
//   },
//   handler: async (ctx, { query, limit = 10 }) => {
//     // First, generate embedding for the search query
//     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
//     const model = genAI.getGenerativeModel({ model: "embedding-001" });

//     try {
//       const result = await model.embedContent(query);
//       const embedding = result.embedding.values;

//       // Perform vector search
//       return await ctx.db
//         .query("notes")
//         .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
//         .withVectorSearch("embedding", { vector: embedding, limit })
//         .collect();
//     } catch (error) {
//       console.error("Error in vector search:", error);
//       return [];
//     }
//   },
// });
