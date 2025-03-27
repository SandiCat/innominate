import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

// export const userFromClerkId = query({
//   args: {
//     clerkId: v.string(),
//   },
//   handler: async (ctx, { clerkId }) => {
//     return await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId)).unique();
//   },
// });
