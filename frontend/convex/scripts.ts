import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

export const testEmbeddings = internalAction({
  args: {
    noteId: v.optional(v.id("notes")),
  },
  handler: async (ctx, { noteId }) => {
    const noteIdWithDefault =
      noteId ?? ("k57b2va9k8g3pphesgbbwb26b97cmksm" as Id<"notes">);

    const result = await ctx.runQuery(internal.embeddings.getEmbeddingText, {
      noteId: noteIdWithDefault,
    });

    console.log(result);
  },
});
