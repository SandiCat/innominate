import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCanvasForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const existingCanvas = await ctx.db
      .query("canvases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existingCanvas) return null;

    const canvasItems = await ctx.db
      .query("canvasItems")
      .withIndex("by_canvas", (q) => q.eq("canvasId", existingCanvas._id))
      .collect();

    return {
      id: existingCanvas._id,
      items: canvasItems.map((item) => ({
        id: item._id,
        position: item.position,
      })),
    };
  },
});

export const createCanvas = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const id = await ctx.db.insert("canvases", { userId });
    return { id, items: [] };
  },
});
