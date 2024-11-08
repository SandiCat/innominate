import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { parseNoteBody } from "../src/types";
import { humanReadableID } from "./human_hash/human_hash";

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

    await ctx.db.patch(noteId, { content });
  },
});

export const deleteNote = mutation({
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
  },
});

// TODO: abstract human readable ID generation
export const create = mutation({
  args: { userId: v.id("users"), content: v.string() },
  handler: async (ctx, { userId, content }) => {
    const humanReadableId = humanReadableID();
    return await ctx.db.insert("notes", {
      content,
      userId,
      humanReadableId,
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
    const humanReadableId = humanReadableID();
    return await ctx.db.insert("notes", {
      content,
      userId,
      parentId,
      humanReadableId,
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

export const getMentionedBy = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    const mentions = await ctx.db
      .query("mentions")
      .withIndex("by_to", (q) => q.eq("to", noteId))
      .collect();

    return await Promise.all(
      mentions.map(async (mention) => {
        const note = await ctx.db.get(mention.from);
        if (!note) throw new Error("Mention of non-existent note");
        return note;
      })
    );
  },
});
