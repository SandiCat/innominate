import { useRef, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { match, P } from "ts-pattern";
import { parseNoteBody } from "../types";
import { FiCheck, FiEdit2, FiX } from "react-icons/fi";
import { MdRemoveCircleOutline } from "react-icons/md";
import {
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaEdit,
  FaLevelUpAlt,
  FaLink,
  FaReply,
  FaTrash,
} from "react-icons/fa";
import { insertAt } from "../utils/string";

function EditContents({
  content,
  onChange,
  outerRef,
}: {
  content: string;
  onChange: (content: string) => void;
  outerRef: React.MutableRefObject<HTMLTextAreaElement | undefined>;
}) {
  return (
    <textarea
      onMouseDown={(e) => e.stopPropagation()}
      className="w-full resize-none outline-none select-text border-b-2"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      autoFocus
      rows={3}
      style={{ height: "auto", minHeight: "1em" }}
      ref={(ref) => {
        autoResizeRef(ref);
        if (ref) outerRef.current = ref;
      }}
      onInput={autoResizeOnInput}
    />
  );
}

function fitHeightToContents(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

function autoResizeRef(element: HTMLTextAreaElement | null) {
  if (element) fitHeightToContents(element);
}

function autoResizeOnInput(e: React.FormEvent<HTMLTextAreaElement>) {
  fitHeightToContents(e.target as HTMLTextAreaElement);
}

function EditMetadata({
  metadata,
  onChange,
}: {
  metadata: string;
  onChange: (metadata: string) => void;
}) {
  return (
    <input
      value={metadata}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value)}
      placeholder="metadata..."
      className="w-full resize-none outline-none select-text"
    />
  );
}

function MentionSpan({ noteId }: { noteId: Id<"notes"> }) {
  const note = useQuery(api.notes.get, { noteId });

  if (note === null) {
    return <span className="bg-gray-200 px-1 rounded">broken link</span>;
  } else {
    return (
      <span
        className="bg-blue-100 px-1 rounded cursor-help"
        title={note === undefined ? "Loading..." : note.content}
      >
        @{note === undefined ? "Loading..." : note.humanReadableId}
      </span>
    );
  }
}

function ViewMode({ content }: { content: string }) {
  if (!content) return <div className="text-gray-400">Empty...</div>;

  return (
    <div className="whitespace-pre-wrap">
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

interface NoteProps {
  noteId: Id<"notes">;
  canvasItemId: Id<"canvasItems">;
  onDragStart?: (e: React.MouseEvent) => void;
}

type NoteState =
  | { mode: "viewing" }
  | {
      mode: "editing";
      draftContent: string;
      draftMetadata: string;
      linkModalState: LinkModalState;
    };

type LinkModalState =
  | { mode: "closed" }
  | { mode: "open"; insertPosition: number };

export function Note({ noteId, canvasItemId, onDragStart }: NoteProps) {
  const [state, setState] = useState<NoteState>({ mode: "viewing" });
  const textArea = useRef<HTMLTextAreaElement>();
  const [isHovered, setIsHovered] = useState(false);
  const note = useQuery(api.notes.get, { noteId });
  const updateNote = useMutation(api.notes.update);

  if (!note) return null;

  const showingLinkModal =
    state.mode === "editing" && state.linkModalState.mode === "open";

  const toggleMode = async () => {
    await match(state)
      .with({ mode: "editing" }, async ({ draftContent, draftMetadata }) => {
        await updateNote({
          noteId,
          content: draftContent,
          metadata: draftMetadata,
          parentId: note.parentId,
        });
        setState({ mode: "viewing" });
      })
      .with({ mode: "viewing" }, async () => {
        setState({
          mode: "editing",
          draftContent: note.content,
          draftMetadata: note.metadata,
          linkModalState: { mode: "closed" },
        });
      })
      .exhaustive();
  };

  const handleContentChange = (content: string) => {
    if (state.mode === "editing") {
      setState({ ...state, draftContent: content });
    } else {
      throw new Error("Cannot change content in non-editing mode");
    }
  };

  const handleMetadataChange = (metadata: string) => {
    if (state.mode === "editing") {
      setState({ ...state, draftMetadata: metadata });
    } else {
      throw new Error("Cannot change metadata in non-editing mode");
    }
  };

  const handleToggleLinkModal = () => {
    if (state.mode !== "editing") {
      throw new Error("Cannot show link modal in non-editing mode");
    }

    if (textArea.current === undefined) {
      throw new Error("Missing text area when inserting a link");
    }

    if (state.linkModalState.mode === "open") {
      setState({
        ...state,
        linkModalState: { mode: "closed" },
      });
    } else {
      const insertPosition = textArea.current.selectionStart;

      setState({
        ...state,
        linkModalState: { mode: "open", insertPosition },
      });
    }
  };

  const handleAddLink = (linkNoteId: Id<"notes">) => {
    if (state.mode !== "editing" || state.linkModalState.mode !== "open") {
      throw new Error("Adding link in invalid state");
    }

    const linkText = `[[${linkNoteId}]]`;

    const newContent =
      state.linkModalState.insertPosition === undefined
        ? state.draftContent + linkText
        : insertAt(
            state.draftContent,
            linkText,
            state.linkModalState.insertPosition
          );

    setState({
      ...state,
      linkModalState: { mode: "closed" },
      draftContent: newContent,
    });
  };

  const noteUI = (
    <div
      className="w-[350px] min-h-[120px] bg-white rounded-lg shadow-lg cursor-grab relative select-none flex flex-col"
      onMouseDown={onDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 flex-1 flex">
        {state.mode === "editing" ? (
          <>
            <div className="flex-1 flex flex-col gap-2">
              <EditContents
                content={state.draftContent}
                onChange={handleContentChange}
                outerRef={textArea}
              />

              <div className="flex flex-row gap-2">
                <EditMetadata
                  metadata={state.draftMetadata}
                  onChange={handleMetadataChange}
                />
                <div className="self-end justify-self-end">
                  <EditNoteButtons
                    toggleMode={toggleMode}
                    onToggleLinkModal={handleToggleLinkModal}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <ViewMode content={note.content} />
            {isHovered && (
              <div className="absolute bottom-2 right-2 ">
                <ViewNoteButtons
                  noteId={noteId}
                  parentId={note.parentId}
                  userId={note.userId}
                  canvasItemId={canvasItemId}
                  toggleMode={toggleMode}
                />
              </div>
            )}
          </>
        )}
      </div>
      <Backlinks noteId={noteId} />
    </div>
  );

  return (
    <div className="relative">
      {noteUI}
      {showingLinkModal && (
        <div className="absolute left-full pl-4 top-0 z-20">
          <LinkModal
            userId={note.userId}
            onAddLink={handleAddLink}
            onClose={handleToggleLinkModal}
          />
        </div>
      )}
    </div>
  );
}

function LinkModal({
  userId,
  onAddLink,
  onClose,
}: {
  userId: Id<"users">;
  onAddLink: (noteId: Id<"notes">) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const notes = useQuery(api.notes.search, { userId, query });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && notes && notes.length > 0) {
      onAddLink(notes[0]._id);
    }
  };

  return (
    <div className="w-[300px] bg-gray-200 rounded-lg shadow-lg flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        <input
          type="text"
          autoFocus
          value={query}
          onKeyDown={handleKeyDown}
          onChange={(e) => setQuery(e.target.value)}
          className="p-2 flex-1"
        />
        <ButtonIcon icon={<FiX />} onClick={async () => onClose()} />
      </div>
      {notes?.map((note) => (
        <div
          key={note._id}
          className="p-2 hover:bg-gray-100 rounded-md cursor-pointer truncate"
          onClick={() => onAddLink(note._id)}
          title={note.content}
        >
          {note.content}
        </div>
      ))}
    </div>
  );
}

export function ReadOnlyNote({ noteId }: { noteId: Id<"notes"> }) {
  const note = useQuery(api.notes.get, { noteId });
  if (!note) return null;
  return (
    <div className="w-full max-w-[350px] max-h-[120px] truncate bg-white rounded-lg shadow-lg cursor-grab relative select-none">
      <div className="p-4">
        <ViewMode content={note.content} />
      </div>
      <Backlinks noteId={noteId} />
    </div>
  );
}

function EditNoteButtons({
  toggleMode,
  onToggleLinkModal,
}: {
  toggleMode: () => Promise<void>;
  onToggleLinkModal: () => void;
}) {
  return (
    <div className="flex gap-1 cursor-pointer">
      <ButtonIcon icon={<FaLink />} onClick={async () => onToggleLinkModal()} />
      <ButtonIcon icon={<FaCheck />} onClick={toggleMode} />
    </div>
  );
}

function ViewNoteButtons({
  noteId,
  parentId,
  canvasItemId,
  userId,
  toggleMode,
}: {
  noteId: Id<"notes">;
  parentId: Id<"notes"> | undefined;
  canvasItemId: Id<"canvasItems">;
  userId: Id<"users">;
  toggleMode: () => Promise<void>;
}) {
  const UIState = useQuery(api.noteUIStates.get, { noteId, canvasItemId });
  const updateUIState = useMutation(api.noteUIStates.update);
  const createChild = useMutation(api.notes.createChild);
  const deleteNote = useMutation(api.notes.deleteNote);
  const removeFromCanvas = useMutation(api.canvasItems.removeFromCanvas);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (UIState === undefined) return null;

  const handleCreateChild = async () => {
    await createChild({ parentId: noteId, userId });
  };

  const handleCreateSibling = async () => {
    // TODO: can we make this type check?
    await createChild({ parentId: parentId!, userId });
  };

  const handleToggleMode = async () => {
    await toggleMode();
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      await deleteNote({ noteId });
    } else {
      setConfirmDelete(true);
    }
  };

  const handleToggleCollapse = async () => {
    await updateUIState({
      noteId,
      canvasItemId,
      collapsed: !UIState.collapsed,
    });
  };

  const handleRemoveFromCanvas = async () => {
    await removeFromCanvas({ id: canvasItemId });
  };

  return (
    <div className="flex gap-1 cursor-pointer">
      <ButtonIcon
        icon={UIState.collapsed ? <FaChevronRight /> : <FaChevronDown />}
        onClick={handleToggleCollapse}
      />
      <ButtonIcon
        icon={<MdRemoveCircleOutline />}
        onClick={handleRemoveFromCanvas}
      />
      <ButtonIcon
        icon={confirmDelete ? <FaCheck /> : <FaTrash />}
        onClick={handleDelete}
      />
      <ButtonIcon icon={<FaReply />} onClick={handleCreateChild} />
      {parentId && (
        <ButtonIcon icon={<FaLevelUpAlt />} onClick={handleCreateSibling} />
      )}
      <ButtonIcon icon={<FaEdit />} onClick={handleToggleMode} />
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
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={async (e) => {
        e.stopPropagation();
        await onClick(e);
      }}
    >
      {icon}
    </div>
  );
}
