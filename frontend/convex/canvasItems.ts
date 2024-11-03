import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("canvasItems") },
  handler: async (ctx, { id }) => {
    const canvasItem = await ctx.db.get(id);
    if (!canvasItem) return null;

    return {
      position: canvasItem.position,
      noteId: canvasItem.rootNoteId,
    };
  },
});

export const setPosition = mutation({
  args: {
    id: v.id("canvasItems"),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
  },
  handler: async (ctx, { id, position }) => {
    await ctx.db.patch(id, { position });
  },
});

export const createNoteOnCanvas = mutation({
  args: {
    canvasId: v.id("canvases"),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
  },
  handler: async (ctx, { canvasId, position }) => {
    // Get the canvas to get the user ID
    const canvas = await ctx.db.get(canvasId);
    if (!canvas) throw new Error("Canvas not found");

    const noteId = await ctx.db.insert("notes", {
      content: "",
      userId: canvas.userId,
    });

    await ctx.db.insert("canvasItems", {
      canvasId,
      rootNoteId: noteId,
      position,
    });
  },
});

export const addNoteToCanvas = mutation({
  args: {
    canvasId: v.id("canvases"),
    noteId: v.id("notes"),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
  },
  handler: async (ctx, { canvasId, noteId, position }) => {
    await ctx.db.insert("canvasItems", {
      canvasId,
      rootNoteId: noteId,
      position,
    });
  },
});
