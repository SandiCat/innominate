import { useRef, useState } from "react";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { match } from "ts-pattern";
import { MdRemoveCircleOutline } from "react-icons/md";
import {
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaEdit,
  FaLevelUpAlt,
  FaLink,
  FaReply,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import { NoteBody } from "./note/NoteBody";
import { addLink, shortDisplay } from "@/lib/note";
import { SearchModal, ModalState } from "./SearchModal";
import { isDirectClick } from "@/lib/utils";
import { ButtonIcon, ButtonContainer } from "./note/Buttons";
import { FaWandMagic } from "react-icons/fa6";
import { useSetAtom } from "jotai";
import { selectedTabAtom } from "@/jotaiAtoms";

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
      className="w-full resize-none outline-none overflow-hidden select-text border-b-2"
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

function ParentSpan({ parentId }: { parentId: Id<"notes"> }) {
  const parentNote = useQuery(api.notes.get, { noteId: parentId });
  if (!parentNote) return null;
  const display = shortDisplay(parentNote);
  return (
    <span className="bg-gray-200 rounded-xl px-1 text-sm flex items-center">
      {display}
    </span>
  );
}

function EditParent({
  parentId,
  onSearchParent,
  onRemoveParent,
}: {
  parentId: Id<"notes"> | undefined;
  onSearchParent: () => void;
  onRemoveParent: () => void;
}) {
  return (
    <div className="flex flex-row gap-2">
      {parentId === undefined ? (
        <span className="text-gray-500">no parent</span>
      ) : (
        <ParentSpan parentId={parentId} />
      )}
      <ButtonIcon icon={<FaSearch />} onClick={async () => onSearchParent()} />
      <ButtonIcon
        icon={<MdRemoveCircleOutline />}
        onClick={async () => onRemoveParent()}
      />
    </div>
  );
}

function EditTitle({
  title,
  onChange,
}: {
  title: string;
  onChange: (title: string) => void;
}) {
  return (
    <input
      value={title}
      onChange={(e) => onChange(e.target.value)}
      placeholder="title..."
      className="w-full resize-none outline-none select-text text-lg font-semibold"
    />
  );
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
      onChange={(e) => onChange(e.target.value)}
      placeholder="metadata..."
      className="w-full resize-none outline-none select-text"
    />
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
            {shortDisplay(note)}
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
  isRoot: boolean;
}

type NoteState =
  | { mode: "viewing" }
  | {
      mode: "editing";
      draftParentId: Id<"notes"> | undefined;
      draftTitle: string;
      draftContent: string;
      draftMetadata: string;
      searchModalState: ModalState;
    };

export function Note({ noteId, canvasItemId, onDragStart, isRoot }: NoteProps) {
  const [state, setState] = useState<NoteState>({ mode: "viewing" });
  const textArea = useRef<HTMLTextAreaElement>();
  const [isHovered, setIsHovered] = useState(false);
  const note = useQuery(api.notes.get, { noteId });
  const updateNote = useMutation(api.notes.update);

  if (!note) return null;

  const showingSearchModal =
    state.mode === "editing" && state.searchModalState !== "none";

  const toggleMode = async () => {
    await match(state)
      .with(
        { mode: "editing" },
        async ({ draftParentId, draftTitle, draftContent, draftMetadata }) => {
          await updateNote({
            noteId,
            parentId: draftParentId,
            title: draftTitle,
            content: draftContent,
            metadata: draftMetadata,
          });
          setState({ mode: "viewing" });
        }
      )
      .with({ mode: "viewing" }, async () => {
        setState({
          mode: "editing",
          draftParentId: note.parentId,
          draftTitle: note.title,
          draftContent: note.content,
          draftMetadata: note.metadata,
          searchModalState: "none",
        });
      })
      .exhaustive();
  };

  const handleTitleChange = (title: string) => {
    if (state.mode === "editing") {
      setState({ ...state, draftTitle: title });
    } else {
      throw new Error("Cannot change title in non-editing mode");
    }
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

    if (state.searchModalState === "link") {
      setState({
        ...state,
        searchModalState: "none",
      });
    } else {
      setState({
        ...state,
        searchModalState: "link",
      });
    }
  };

  const handleModalSelectNote = (noteId: Id<"notes">) => {
    if (state.mode !== "editing" || state.searchModalState === "none") {
      throw new Error("Adding link in invalid state");
    }

    if (state.searchModalState === "link") {
      const insertPosition = textArea.current?.selectionStart;

      const newContent = addLink(state.draftContent, noteId, insertPosition);
      setState({
        ...state,
        searchModalState: "none",
        draftContent: newContent,
      });
    } else if (state.searchModalState === "parent") {
      setState({
        ...state,
        searchModalState: "none",
        draftParentId: noteId,
      });
    }
  };

  const handleCloseSearchModal = () => {
    if (state.mode !== "editing") {
      throw new Error("Cannot close search modal in non-editing mode");
    }

    setState({ ...state, searchModalState: "none" });
  };

  const handleSearchParent = () => {
    if (state.mode !== "editing") {
      throw new Error("Cannot search parent in non-editing mode");
    }

    setState({ ...state, searchModalState: "parent" });
  };

  const handleRemoveParent = () => {
    if (state.mode !== "editing") {
      throw new Error("Cannot remove parent in non-editing mode");
    }

    setState({ ...state, draftParentId: undefined });
  };

  const noteUI = (
    <div
      className="w-[350px] bg-white rounded-lg shadow-lg cursor-grab relative select-none flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="p-4 flex-1 flex flex-col gap-2"
        onMouseDown={(e) => {
          if (isDirectClick(e)) {
            onDragStart?.(e);
          }
        }}
      >
        {state.mode === "editing" ? (
          <>
            <EditParent
              parentId={state.draftParentId}
              onSearchParent={handleSearchParent}
              onRemoveParent={handleRemoveParent}
            />
            <EditTitle title={state.draftTitle} onChange={handleTitleChange} />
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
          </>
        ) : (
          <>
            <ViewNote
              showParent={isRoot}
              note={note}
              onDragStart={onDragStart}
            />
            {isHovered && (
              <div className="absolute bottom-2 right-2 ">
                <ViewNoteButtons
                  noteId={noteId}
                  isRootNote={isRoot}
                  parentId={note.parentId}
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
      {showingSearchModal && (
        <div className="absolute left-full pl-4 top-0 z-20">
          <CanvasSearchModal
            onSelectNote={handleModalSelectNote}
            onClose={handleCloseSearchModal}
          />
        </div>
      )}
    </div>
  );
}

export function ViewNote({
  showParent,
  note,
  onDragStart,
}: {
  showParent: boolean;
  note: Doc<"notes">;
  onDragStart?: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex flex-col" onMouseDown={onDragStart}>
      <div className="flex flex-row gap-2">
        {showParent && note.parentId && <ParentSpan parentId={note.parentId} />}
        {note.title && (
          <div className="text-lg font-semibold mb-2 text-wrap">
            {note.title}
          </div>
        )}
      </div>
      {note.content ? (
        <NoteBody content={note.content} />
      ) : (
        !note.title && <div className="text-gray-400">Empty...</div>
      )}
    </div>
  );
}

function CanvasSearchModal({
  onSelectNote,
  onClose,
}: {
  onSelectNote: (noteId: Id<"notes">) => void;
  onClose: () => void;
}) {
  return (
    <div className="w-[300px] max-h-[300px] flex">
      <SearchModal onSelectNote={onSelectNote} onClose={onClose} />
    </div>
  );
}

export function ReadOnlyNote({ noteId }: { noteId: Id<"notes"> }) {
  const note = useQuery(api.notes.get, { noteId });
  if (!note) return null;
  return (
    <div className=" max-w-[350px] max-h-[120px] truncate bg-white rounded-lg shadow-lg cursor-grab relative select-none">
      <div className=" p-4">
        <ViewNote showParent={true} note={note} />
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
    <ButtonContainer>
      <ButtonIcon icon={<FaLink />} onClick={async () => onToggleLinkModal()} />
      <ButtonIcon icon={<FaCheck />} onClick={toggleMode} />
    </ButtonContainer>
  );
}

function ViewNoteButtons({
  noteId,
  isRootNote,
  parentId,
  canvasItemId,
  toggleMode,
}: {
  noteId: Id<"notes">;
  isRootNote: boolean;
  parentId: Id<"notes"> | undefined;
  canvasItemId: Id<"canvasItems">;
  toggleMode: () => Promise<void>;
}) {
  const UIState = useQuery(api.noteUIStates.get, { noteId, canvasItemId });
  const updateUIState = useMutation(api.noteUIStates.update);
  const createChild = useMutation(api.notes.createChild);
  const deleteNote = useMutation(api.notes.deleteNote);
  const removeFromCanvas = useMutation(api.canvasItems.removeFromCanvas);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const setSelectedTab = useSetAtom(selectedTabAtom);

  if (UIState === undefined) return null;

  const handleCreateChild = async () => {
    await createChild({ parentId: noteId });
  };

  const handleCreateSibling = async () => {
    // TODO: can we make this type check?
    await createChild({ parentId: parentId! });
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

  const handleShowSimilar = async () => {
    setSelectedTab({ type: "similar", noteId });
  };

  return (
    <ButtonContainer>
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
      {!isRootNote && (
        <ButtonIcon icon={<FaLevelUpAlt />} onClick={handleCreateSibling} />
      )}
      <ButtonIcon icon={<FaEdit />} onClick={handleToggleMode} />
      <ButtonIcon icon={<FaWandMagic />} onClick={handleShowSimilar} />
    </ButtonContainer>
  );
}
