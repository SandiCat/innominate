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

const getChildren = async (ctx: QueryCtx, noteId: Id<"notes">) => {
  return await ctx.db
    .query("notes")
    .withIndex("by_parent", (q) => q.eq("parentId", noteId))
    .collect();
};

const constructTree = async (
  ctx: QueryCtx,
  noteId: Id<"notes">
): Promise<NoteTree> => {
  const note = await ctx.db.get(noteId);
  if (!note) throw new Error("Note not found");
  const children = await getChildren(ctx, noteId);
  const childTrees: NoteTree[] = await Promise.all(
    children.map((child) => constructTree(ctx, child._id))
  );
  return {
    id: note._id,
    content: note.content,
    children: childTrees,
  };
};

export const getTree = query({
  args: { rootNodeId: v.id("notes") },
  handler: async (ctx, { rootNodeId }) => {
    return await constructTree(ctx, rootNodeId);
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
