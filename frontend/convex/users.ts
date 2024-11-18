import { myMutation } from "./wrapper";

export const upsertUser = myMutation({
  args: {},
  handler: async (ctx) => {
    const identity = ctx.identity;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (user) return user._id;

    return await ctx.db.insert("users", { clerkId: identity.subject });
  },
});
