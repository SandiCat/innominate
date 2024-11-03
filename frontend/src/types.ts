import { Id } from "../convex/_generated/dataModel";
import * as Vec2 from "./lib/Vec2";

export interface CanvasItem {
  id: Id<"canvasItems">;
  position: Vec2.Vec2;
}

export interface NoteTree {
  id: Id<"notes">;
  content: string;
  children: NoteTree[];
}
