import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface NoteProps {
  noteId: Id<"notes">;
  onDragStart?: (e: React.MouseEvent) => void;
}

export function Note({ noteId, onDragStart }: NoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const note = useQuery(api.notes.get, { noteId });
  const updateNote = useMutation(api.notes.update);

  if (!note) return null;

  return (
    <div
      className="w-[200px] min-h-[120px] 
                 bg-white rounded-lg shadow-lg cursor-grab relative"
      onMouseDown={onDragStart}
    >
      <button
        className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(!isEditing);
        }}
      >
        {isEditing ? "✓" : "✎"}
      </button>
      <div className="p-4">
        {isEditing ? (
          <textarea
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full resize-none outline-none select-text"
            value={note.content}
            onChange={(e) => updateNote({ noteId, content: e.target.value })}
            autoFocus
            rows={1}
            style={{ height: "auto", minHeight: "1em" }}
            ref={(textArea) => {
              if (textArea) {
                textArea.style.height = "auto";
                textArea.style.height = `${textArea.scrollHeight}px`;
              }
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
        ) : (
          <div
            className={`whitespace-pre-wrap select-none ${
              !note.content ? "text-gray-400" : ""
            }`}
          >
            {note.content || "Empty..."}
          </div>
        )}
      </div>
    </div>
  );
}
