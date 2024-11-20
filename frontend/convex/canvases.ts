import { myQuery, myMutation } from "./wrapper";
import { v } from "convex/values";
import { vec2 } from "./types";
import { QueryCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

async function canvasWithItems(ctx: QueryCtx, canvas: Doc<"canvases">) {
  const canvasItems = await ctx.db
    .query("canvasItems")
    .withIndex("by_canvas", (q) => q.eq("canvasId", canvas._id))
    .collect();

  return {
    id: canvas._id,
    origin: canvas.origin,
    items: canvasItems.map((item) => ({
      id: item._id,
      position: item.position,
    })),
  };
}

export const getCanvas = myQuery({
  args: { canvasId: v.id("canvases") },
  handler: async (ctx, { canvasId }) => {
    const canvas = await ctx.db.get(canvasId);
    if (!canvas) throw new Error("Canvas not found");
    return await canvasWithItems(ctx, canvas);
  },
});

export const getCanvasForUser = myQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const existingCanvas = await ctx.db
      .query("canvases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existingCanvas) return null;

    return await canvasWithItems(ctx, existingCanvas);
  },
});

export const setCanvasOrigin = myMutation({
  args: { canvasId: v.id("canvases"), origin: vec2 },
  handler: async (ctx, { canvasId, origin }) => {
    await ctx.db.patch(canvasId, { origin });
  },
});

export const createCanvas = myMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const id = await ctx.db.insert("canvases", {
      userId,
      origin: { x: 0, y: 0 },
    });
    return { id, items: [] };
  },
});
