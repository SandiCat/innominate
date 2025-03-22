import {
  customQuery,
  customMutation,
} from "convex-helpers/server/customFunctions";
import { mutation, MutationCtx, QueryCtx, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

async function validateAndAddAuth<Ctx extends MutationCtx | QueryCtx>(
  ctx: Ctx,
  args: Record<string, never>
): Promise<{
  ctx: Ctx & { user: Doc<"users"> };
  args: Record<string, never>;
}> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Not authenticated");
  }
  const clerkId = identity.subject;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
  if (!user) throw new Error("User not found");
  const ctxWithUser = { ...ctx, user };
  return { ctx: ctxWithUser, args };
}

export const myQuery = customQuery(query, {
  args: {},
  input: validateAndAddAuth,
});

export const myMutation = customMutation(mutation, {
  args: {},
  input: validateAndAddAuth,
});
