import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { NoteTree } from "../src/types";

export const get = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    return await ctx.db.get(noteId);
  },
});

export const getChildren = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_parent", (q) => q.eq("parentId", noteId))
      .collect();
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

export const createChild = mutation({
  args: {
    parentId: v.id("notes"),
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, { parentId, userId, content }) => {
    return await ctx.db.insert("notes", {
      content,
      userId,
      parentId,
    });
  },
});

export const search = query({
  args: {
    query: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, { query, userId }) => {
    if (!query.trim()) return [];
    return await ctx.db
      .query("notes")
      .withSearchIndex("search_content", (q) =>
        q.search("content", query).eq("userId", userId)
      )
      .take(10);
  },
});
