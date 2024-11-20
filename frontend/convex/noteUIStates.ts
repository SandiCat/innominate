import { myQuery, myMutation } from "./wrapper";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_NOTE_UI_STATE = {
  collapsed: true,
};

async function getByCompoundID(
  ctx: QueryCtx,
  noteId: Id<"notes">,
  canvasItemId: Id<"canvasItems">
): Promise<Doc<"noteUIStates"> | null> {
  return ctx.db
    .query("noteUIStates")
    .withIndex("by_canvasItem_note", (q) =>
      q.eq("canvasItemId", canvasItemId).eq("noteId", noteId)
    )
    .first();
}

export const get = myQuery({
  args: { noteId: v.id("notes"), canvasItemId: v.id("canvasItems") },
  handler: async (ctx, { noteId, canvasItemId }) => {
    const noteUIState = await getByCompoundID(ctx, noteId, canvasItemId);
    return noteUIState ?? DEFAULT_NOTE_UI_STATE;
  },
});

export const update = myMutation({
  args: {
    noteId: v.id("notes"),
    canvasItemId: v.id("canvasItems"),
    collapsed: v.boolean(),
  },
  handler: async (ctx, { noteId, canvasItemId, collapsed }) => {
    const noteUIState = await getByCompoundID(ctx, noteId, canvasItemId);

    if (!noteUIState) {
      await ctx.db.insert("noteUIStates", { noteId, canvasItemId, collapsed });
    } else {
      await ctx.db.patch(noteUIState._id, { collapsed });
    }
  },
});
