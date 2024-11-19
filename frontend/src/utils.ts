import { Id } from "convex/_generated/dataModel";
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
