import { Note } from "./Note";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface NoteTreeProps {
  rootNodeId: Id<"notes">;
  onDragStart?: (e: React.MouseEvent) => void;
}

export function NoteTree({ rootNodeId, onDragStart }: NoteTreeProps) {
  const node = useQuery(api.notes.get, { noteId: rootNodeId });
  const children = useQuery(api.notes.getChildren, { noteId: rootNodeId });

  if (node === null) throw new Error("Note not found");

  if (node === undefined || children === undefined) return null;

  return (
    <div className="flex flex-col gap-4">
      <Note noteId={rootNodeId} onDragStart={onDragStart} />
      {children.length > 0 && (
        <div className="ml-8 flex flex-col gap-4">
          {children.map((childNote) => (
            <NoteTree
              key={childNote._id}
              rootNodeId={childNote._id}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
}
