import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { myQuery } from "./wrapper";

export const upsertUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (user) return user._id;

    return await ctx.db.insert("users", { clerkId: identity.subject });
  },
});

export const userInfo = myQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.user;
  },
});

export const migrateUser = internalMutation({
  args: {
    oldId: v.id("users"),
    newId: v.id("users"),
  },
  handler: async (ctx, { oldId, newId }) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", oldId))
      .collect();

    for (const note of notes) {
      await ctx.db.patch(note._id, { userId: newId });
    }

    const canvases = await ctx.db
      .query("canvases")
      .withIndex("by_user", (q) => q.eq("userId", oldId))
      .collect();

    for (const canvas of canvases) {
      await ctx.db.patch(canvas._id, { userId: newId });
    }
  },
});
