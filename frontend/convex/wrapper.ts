import { customQuery, customMutation } from "convex-helpers/server/customFunctions";
import { mutation, query } from "./_generated/server";

export const myQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    console.log("identity", identity);
    return { ctx, args };
  },
});

export const myMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    console.log("identity", identity);
    return { ctx, args };
  },
});
