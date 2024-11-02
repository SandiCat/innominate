import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("counters") },
  handler: async (ctx, { id }) => {
    const counter = await ctx.db.get(id);
    return counter?.value;
  },
});

export const update = mutation({
  args: { id: v.id("counters"), value: v.number() },
  handler: async (ctx, { id, value }) => {
    await ctx.db.patch(id, { value });
  },
});
