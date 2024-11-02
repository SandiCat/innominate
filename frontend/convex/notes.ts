import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const get = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    return await ctx.db.get(noteId);
  },
});

// TODO: row level security
export const update = mutation({
  args: {
    noteId: v.id("notes"),
    content: v.string(),
  },
  handler: async (ctx, { noteId, content }) => {
    await ctx.db.patch(noteId, { content });
  },
});

export const create = mutation({
  args: { userId: v.id("users"), content: v.string() },
  handler: async (ctx, { userId, content }) => {
    return await ctx.db.insert("notes", {
      content,
      userId,
    });
  },
});
