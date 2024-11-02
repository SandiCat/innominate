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
    items: types.canvas,
    userId: v.id("users"),
  }).index("by_user", ["userId"]),
  // just for testing:
  counters: defineTable({
    value: v.number(),
    name: v.string(),
  }).index("by_name", ["name"]),
});
