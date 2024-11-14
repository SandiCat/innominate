import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { parseNoteBody } from "../src/types";
import { humanReadableID } from "./human_hash/human_hash";
import { Id } from "./_generated/dataModel";

export async function createEmptyNote(
  ctx: MutationCtx,
  userId: Id<"users">,
  parentId?: Id<"notes">
): Promise<Id<"notes">> {
  const humanReadableId = humanReadableID();
  return ctx.db.insert("notes", {
    content: "",
    metadata: "",
    parentId,
    userId,
    humanReadableId,
    searchText: "",
  });
}

export function buildSearchText(content: string, metadata: string) {
  return `${content}\n${metadata}`;
}

export const get = query({
  // TODO: Allowing this to be optional simplifies chaining a `useQuery` with a
  // `useState`. I wonder if there's a better way.
  args: { noteId: v.optional(v.id("notes")) },
  handler: async (ctx, { noteId }) => {
    if (!noteId) return null;
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
    metadata: v.string(),
    parentId: v.optional(v.id("notes")),
  },
  handler: async (ctx, { noteId, content, metadata, parentId }) => {
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

    const searchText = buildSearchText(content, metadata);

    await ctx.db.patch(noteId, { content, metadata, searchText, parentId });
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

export const createChild = mutation({
  args: {
    parentId: v.id("notes"),
    userId: v.id("users"),
  },
  handler: async (ctx, { parentId, userId }) => {
    await createEmptyNote(ctx, userId, parentId);
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
      .withSearchIndex("search_searchText", (q) =>
        q.search("searchText", query).eq("userId", userId)
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
