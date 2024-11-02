import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import * as types from "./types";

export const canvasForUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    return await ctx.db
      .query("canvases")
      .filter((q) => q.eq(q.field("userId"), id))
      .first();
  },
});

export const persistUserCanvas = mutation({
  args: { id: v.id("users"), value:  },
  handler: async (ctx, { id, value: canvas }) => {
    const existingCanvas = await canvasForUser(ctx, { id });
    if (existingCanvas) {
      await ctx.db.patch(existingCanvas._id, { items: canvas });
    } else {
      await ctx.db.insert("canvases", { items: canvas, userId: id });
    }
  },
});
