import { Note } from "./Note";
import * as Tree from "../lib/Tree";
import { Id } from "../../convex/_generated/dataModel";

interface NoteTreeProps {
  rootNodeId: Id<"notes">;
  onDragStart;
}

export function RenderTree(root: NoteId, tree: Tree.Tree<NoteId, NoteContent>) {
  const { content, children } = tree.nodes.get(root)!;
  return (
    <div className="flex flex-col gap-4">
      <Note content={content} onChange={() => {}} />
      {children.length > 0 && (
        <div className="ml-8 flex flex-col gap-4">
          {children.map((childId) => RenderTree(childId, tree))}
        </div>
      )}
    </div>
  );
}

export function NoteTree({ tree, onContentChange }: NoteTreeProps) {
  return RenderTree(tree.root, tree);
}
