import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { match } from "ts-pattern";

interface NoteProps {
  noteId: Id<"notes">;
  onDragStart?: (e: React.MouseEvent) => void;
}

type NoteState =
  | { mode: "viewing" }
  | { mode: "editing"; draftContent: string };

export function Note({ noteId, onDragStart }: NoteProps) {
  const [state, setState] = useState<NoteState>({ mode: "viewing" });
  const note = useQuery(api.notes.get, { noteId });
  const updateNote = useMutation(api.notes.update);
  const createChild = useMutation(api.notes.createChild);

  if (!note) return null;

  return (
    <div
      className="w-[200px] min-h-[120px] 
                 bg-white rounded-lg shadow-lg cursor-grab relative"
      onMouseDown={onDragStart}
    >
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          className="p-1 rounded hover:bg-gray-100"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={async (e) => {
            console.log("creating child");
            e.stopPropagation();
            await createChild({
              parentId: noteId,
              userId: note.userId,
              content: "",
            });
          }}
        >
          ↩️
        </button>
        <button
          className="p-1 rounded hover:bg-gray-100"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={async (e) => {
            e.stopPropagation();
            match(state)
              .with({ mode: "editing" }, async ({ draftContent }) => {
                await updateNote({ noteId, content: draftContent });
                setState({ mode: "viewing" });
              })
              .with({ mode: "viewing" }, () => {
                setState({ mode: "editing", draftContent: note.content });
              })
              .exhaustive();
          }}
        >
          {state.mode === "editing" ? "✓" : "✎"}
        </button>
      </div>
      <div className="p-4">
        {state.mode === "editing" ? (
          <textarea
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full resize-none outline-none select-text"
            value={state.draftContent}
            onChange={(e) =>
              setState({
                mode: "editing",
                draftContent: e.target.value,
              })
            }
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
