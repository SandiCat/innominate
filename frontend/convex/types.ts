import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const canvasItem = v.object({
  noteId: v.id("notes"),
  position: v.object({
    x: v.number(),
    y: v.number(),
  }),
});

export const canvas = v.array(canvasItem);
