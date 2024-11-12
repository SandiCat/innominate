import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { twitterTables } from "./twitter/schema";
import { vec2 } from "./types";
export default defineSchema({
  users: defineTable({}), // just the ID
  notes: defineTable({
    content: v.string(),
    parentId: v.optional(v.id("notes")),
    userId: v.id("users"),
    humanReadableId: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_parent", ["parentId"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["userId"],
    }),
  mentions: defineTable({
    from: v.id("notes"),
    to: v.id("notes"),
  })
    .index("by_from", ["from"])
    .index("by_to", ["to"]),
  canvases: defineTable({
    userId: v.id("users"),
    origin: vec2,
  }).index("by_user", ["userId"]),
  canvasItems: defineTable({
    canvasId: v.id("canvases"),
    rootNoteId: v.id("notes"),
    position: vec2,
  })
    .index("by_canvas", ["canvasId"])
    .index("by_rootNote", ["rootNoteId"]),
  noteUIStates: defineTable({
    noteId: v.id("notes"),
    // can have different state in different trees
    canvasItemId: v.id("canvasItems"),
    collapsed: v.boolean(),
  }).index("by_canvasItem_note", ["canvasItemId", "noteId"]),
  ...twitterTables,
});
