import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({}), // just the ID
  notes: defineTable({
    content: v.string(),
    parentId: v.optional(v.id("notes")),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),
  canvases: defineTable({
    name: v.string(),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),
  canvasItems: defineTable({
    canvasId: v.id("canvases"),
    noteId: v.id("notes"),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
  })
    .index("by_canvas", ["canvasId"])
    .index("by_note", ["noteId"]),
});
