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

export type NoteBody = NoteToken[];

export type NoteToken =
  | { type: "text"; text: string }
  | { type: "mention"; noteId: Id<"notes"> };

export function parseNoteBody(content: string): NoteBody {
  const mentionRegex = /\[\[([a-z0-9]+)\]\]/g;
  const tokens: NoteToken[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(mentionRegex)) {
    const [fullMatch, noteId] = match;
    const matchIndex = match.index!;

    // Add text before the mention if any
    if (matchIndex > lastIndex) {
      tokens.push({ type: "text", text: content.slice(lastIndex, matchIndex) });
    }

    tokens.push({ type: "mention", noteId: noteId as Id<"notes"> });
    lastIndex = matchIndex + fullMatch.length;
  }

  // Add remaining text after last mention if any
  if (lastIndex < content.length) {
    tokens.push({ type: "text", text: content.slice(lastIndex) });
  }

  return tokens;
}
