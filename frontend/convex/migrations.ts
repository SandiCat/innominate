import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addMetadata = internalMutation({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db.query("notes").collect();
    for (const note of notes) {
      if (!note.metadata) {
        await ctx.db.patch(note._id, { metadata: "" });
      }
    }
  },
});
