import {
  customQuery,
  customMutation,
  customAction,
} from "convex-helpers/server/customFunctions";
import {
  mutation,
  MutationCtx,
  QueryCtx,
  query,
  action,
  ActionCtx,
} from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { api } from "./_generated/api";

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

export const myAction = customAction(action, {
  args: {},
  input: async (
    ctx,
    args
  ): Promise<{
    ctx: ActionCtx & { user: Doc<"users"> };
    args: Record<string, never>;
  }> => {
    const user = await ctx.runQuery(api.users.userInfo);
    const ctxWithUser = { ...ctx, user };
    return { ctx: ctxWithUser, args };
  },
});
