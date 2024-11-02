import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const canvasItem = v.object({
  noteId: v.id("notes"),
  position: v.object({
    x: v.number(),
    y: v.number(),
  }),
});

export default defineSchema({
  users: defineTable({}), // just the ID
  notes: defineTable({
    content: v.string(),
    parentId: v.optional(v.id("notes")),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),
  canvases: defineTable({
    items: v.array(canvasItem),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),
  // just for testing:
  counters: defineTable({
    value: v.number(),
    name: v.string(),
  }).index("by_name", ["name"]),
});
