import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { match } from "ts-pattern";
import { parseNoteBody } from "../types";
import { FiCheck, FiEdit2 } from "react-icons/fi";
import { BsReply } from "react-icons/bs";
import { FaReply, FaTrash } from "react-icons/fa";

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

function MentionSpan({ noteId }: { noteId: Id<"notes"> }) {
  const note = useQuery(api.notes.get, { noteId });
  if (!note) return null;
  return (
    <span
      className="bg-blue-100 px-1 rounded cursor-help"
      title={note?.content || "Loading..."}
    >
      @{note.humanReadableId}
    </span>
  );
}

function ViewMode({ content }: { content: string }) {
  if (!content) return <div className="text-gray-400">Empty...</div>;

  return (
    <div className="whitespace-pre-wrap select-none">
      {parseNoteBody(content).map((token, i) =>
        token.type === "text" ? (
          <span key={i}>{token.text}</span>
        ) : (
          <MentionSpan key={i} noteId={token.noteId} />
        )
      )}
    </div>
  );
}

function Backlinks({ noteId }: { noteId: Id<"notes"> }) {
  const mentionedBy = useQuery(api.notes.getMentionedBy, { noteId });

  if (mentionedBy === undefined || mentionedBy.length === 0) return null;

  return (
    <div className="border-t border-gray-200 p-2 text-xs text-gray-500">
      Mentioned by:{" "}
      {mentionedBy.map((note, i) => (
        <span key={note._id}>
          {i > 0 && ", "}
          <span className="hover:underline cursor-help" title={note.content}>
            @{note.humanReadableId}
          </span>
        </span>
      ))}
    </div>
  );
}

export function Note({ noteId, onDragStart }: NoteProps) {
  const [state, setState] = useState<NoteState>({ mode: "viewing" });
  const [isHovered, setIsHovered] = useState(false);
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <NoteButtons
          noteId={noteId}
          userId={note.userId}
          isEditing={state.mode === "editing"}
          toggleMode={toggleMode}
        />
      )}
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
      <Backlinks noteId={noteId} />
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
  const deleteNote = useMutation(api.notes.deleteNote);

  const handleCreateChild = async () => {
    await createChild({ parentId: noteId, userId, content: "" });
  };

  const handleToggleMode = async () => {
    await toggleMode();
  };

  const handleDelete = async () => {
    await deleteNote({ noteId });
  };

  return (
    <div className="absolute top-2 right-2 flex gap-1">
      <ButtonIcon icon={<FaTrash />} onClick={handleDelete} />
      <ButtonIcon icon={<FaReply />} onClick={handleCreateChild} />
      <ButtonIcon
        icon={isEditing ? <FiCheck /> : <FiEdit2 />}
        onClick={handleToggleMode}
      />
    </div>
  );
}

function ButtonIcon({
  icon,
  onClick,
}: {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => Promise<void>;
}) {
  return (
    <div
      className="p-1 rounded hover:bg-gray-100"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={async (e) => {
        e.stopPropagation();
        await onClick(e);
      }}
    >
      {icon}
    </div>
  );
}
