import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const getSimilarNotes = action({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, { noteId }) => {
    const note = await ctx.runQuery(api.notes.get, { noteId });
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

    return searchResults;
  },
});
