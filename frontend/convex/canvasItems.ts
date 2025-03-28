import { myQuery, myMutation } from "./wrapper";
import { v } from "convex/values";
import { createEmptyNote } from "./notes";

export const get = myQuery({
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

export const setPosition = myMutation({
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

export const createNoteOnCanvas = myMutation({
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

    const noteId = await createEmptyNote(ctx, canvas.userId);

    await ctx.db.insert("canvasItems", {
      canvasId,
      rootNoteId: noteId,
      position,
    });
  },
});

export const addNoteToCanvas = myMutation({
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

export const removeFromCanvas = myMutation({
  args: { id: v.id("canvasItems") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
