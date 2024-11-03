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

function useAutoResizingTextArea() {
  const adjustHeight = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  return {
    ref: (textArea: HTMLTextAreaElement | null) => {
      if (textArea) adjustHeight(textArea);
    },
    onInput: (e: React.FormEvent<HTMLTextAreaElement>) => {
      adjustHeight(e.target as HTMLTextAreaElement);
    },
  };
}

function EditMode({
  content,
  onChange,
}: {
  content: string;
  onChange: (content: string) => void;
}) {
  const textArea = useAutoResizingTextArea();

  return (
    <textarea
      onMouseDown={(e) => e.stopPropagation()}
      className="w-full resize-none outline-none select-text"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      autoFocus
      rows={1}
      style={{ height: "auto", minHeight: "1em" }}
      ref={textArea.ref}
      onInput={textArea.onInput}
    />
  );
}

function ViewMode({ content }: { content: string }) {
  return (
    <div
      className={`whitespace-pre-wrap select-none ${!content ? "text-gray-400" : ""}`}
    >
      {content || "Empty..."}
    </div>
  );
}

export function Note({ noteId, onDragStart }: NoteProps) {
  const [state, setState] = useState<NoteState>({ mode: "viewing" });
  const note = useQuery(api.notes.get, { noteId });
  const updateNote = useMutation(api.notes.update);

  if (!note) return null;

  const toggleMode = async () => {
    await match(state)
      .with({ mode: "editing" }, async ({ draftContent }) => {
        await updateNote({ noteId, content: draftContent });
        setState({ mode: "viewing" });
      })
      .with({ mode: "viewing" }, async () => {
        setState({ mode: "editing", draftContent: note.content });
      })
      .exhaustive();
  };

  const handleContentChange = (content: string) =>
    setState({ mode: "editing", draftContent: content });

  return (
    <div
      className="w-[200px] min-h-[120px] bg-white rounded-lg shadow-lg cursor-grab relative"
      onMouseDown={onDragStart}
    >
      <NoteButtons
        noteId={noteId}
        userId={note.userId}
        isEditing={state.mode === "editing"}
        toggleMode={toggleMode}
      />
      <div className="p-4">
        {state.mode === "editing" ? (
          <EditMode
            content={state.draftContent}
            onChange={handleContentChange}
          />
        ) : (
          <ViewMode content={note.content} />
        )}
      </div>
    </div>
  );
}

function NoteButtons({
  noteId,
  userId,
  isEditing,
  toggleMode,
}: {
  noteId: Id<"notes">;
  userId: Id<"users">;
  isEditing: boolean;
  toggleMode: () => Promise<void>;
}) {
  const createChild = useMutation(api.notes.createChild);

  const handleCreateChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await createChild({ parentId: noteId, userId, content: "" });
  };

  const handleToggleMode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleMode();
  };

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="absolute top-2 right-2 flex gap-1">
      <button
        className="p-1 rounded hover:bg-gray-100"
        onMouseDown={stopPropagation}
        onClick={handleCreateChild}
      >
        ↩️
      </button>
      <button
        className="p-1 rounded hover:bg-gray-100"
        onMouseDown={stopPropagation}
        onClick={handleToggleMode}
      >
        {isEditing ? "✓" : "✎"}
      </button>
    </div>
  );
}
