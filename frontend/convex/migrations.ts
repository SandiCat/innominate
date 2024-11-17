import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { buildSearchText } from "./notes";

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

export const addSearchText = internalMutation({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db.query("notes").collect();
    for (const note of notes) {
      const searchText = buildSearchText(note.content, note.metadata);
      await ctx.db.patch(note._id, { searchText });
    }
  },
});
