import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import * as types from "./types";

export default defineSchema({
  users: defineTable({}), // just the ID
  notes: defineTable({
    content: v.string(),
    parentId: v.optional(v.id("notes")),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),
  canvases: defineTable({
    userId: v.id("users"),
  }).index("by_user", ["userId"]),
  canvasItems: defineTable({
    canvasId: v.id("canvases"),
    rootNoteId: v.id("notes"),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
  }).index("by_canvas", ["canvasId"]),
  // noteUIStates: defineTable({
  //   noteId: v.id("notes"),
  //   // can have different state in different trees
  //   canvasItemId: v.id("canvasItems"),
  //   collapsed: v.boolean(),
  // })
  //   .index("by_canvas", ["canvasId"])
  //   .index("by_note", ["noteId"]),
  // just for testing:
  counters: defineTable({
    value: v.number(),
    name: v.string(),
  }).index("by_name", ["name"]),
});
