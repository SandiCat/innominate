import { Doc, Id } from "convex/_generated/dataModel";
import { insertAt } from "./utils/string";

export function addLink(
  content: string,
  linkNoteId: Id<"notes">,
  insertPosition: number | undefined
) {
  const linkText = `[[${linkNoteId}]]`;

  if (insertPosition === undefined) {
    return content + linkText;
  }
  return insertAt(content, linkText, insertPosition);
}

export function buildSearchText(
  title: string,
  content: string,
  metadata: string
) {
  return `${title}\n${content}\n${metadata}`;
}

export function shortDisplay(note: Doc<"notes">) {
  return note.title || `@${note.humanReadableId}`;
}
