import { Note } from "./Note";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface NoteTreeProps {
  rootNodeId: Id<"notes">;
  canvasItemId: Id<"canvasItems">;
  onDragStart?: (e: React.MouseEvent) => void;
}

export function NoteTree({
  rootNodeId,
  canvasItemId,
  onDragStart,
}: NoteTreeProps) {
  return (
    <NoteTreeRec
      rootNodeId={rootNodeId}
      canvasItemId={canvasItemId}
      onDragStart={onDragStart}
      isRoot={true}
    />
  );
}

interface NoteTreeRecProps {
  rootNodeId: Id<"notes">;
  canvasItemId: Id<"canvasItems">;
  onDragStart?: (e: React.MouseEvent) => void;
  isRoot: boolean;
}

function NoteTreeRec({
  rootNodeId,
  canvasItemId,
  onDragStart,
  isRoot,
}: NoteTreeRecProps) {
  const node = useQuery(api.notes.get, { noteId: rootNodeId });
  const children = useQuery(api.notes.getChildren, { noteId: rootNodeId });
  const noteUIState = useQuery(api.noteUIStates.get, {
    noteId: rootNodeId,
    canvasItemId: canvasItemId,
  });

  if (node === null) throw new Error("Note not found");

  if (node === undefined || children === undefined || noteUIState == undefined)
    return null;

  return (
    <div className="flex flex-col gap-4">
      <Note
        isRoot={isRoot}
        noteId={rootNodeId}
        canvasItemId={canvasItemId}
        onDragStart={onDragStart}
      />
      {children.length === 0 ? null : noteUIState.collapsed ? (
        <div className="text-sm text-gray-500 bg-gray-300 text-center rounded-3xl px-2 py-1 inline-block select-none">
          Hiding {children.length}{" "}
          {children.length === 1 ? "child" : "children"}
        </div>
      ) : (
        <div className="ml-8 flex flex-col gap-4">
          {children.map((childNote) => (
            <NoteTreeRec
              isRoot={false}
              key={childNote._id}
              rootNodeId={childNote._id}
              canvasItemId={canvasItemId}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
}
