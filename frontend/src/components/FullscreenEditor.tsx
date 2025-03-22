import { useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";
import * as Icons from "react-icons/fa";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { ReadOnlyNote } from "./Note";
import { addLink } from "@/lib/note";
import { SearchModal, ModalState } from "@/components/SearchModal";
import { match } from "ts-pattern";

export function WithNoteId({
  noteId,
  onGoBack,
  onOpenNote,
}: {
  noteId: Id<"notes">;
  onGoBack: () => void;
  onOpenNote: (noteId: Id<"notes">) => void;
}) {
  const note = useQuery(api.notes.get, { noteId });
  if (note === undefined) return <div>Loading...</div>;
  else if (note === null) throw new Error("Note not found");
  else
    return (
      <FullscreenEditor
        note={note}
        onGoBack={onGoBack}
        onOpenNote={onOpenNote}
      />
    );
}

export function FullscreenEditor({
  note,
  onGoBack,
  onOpenNote,
}: {
  note: Doc<"notes">;
  onGoBack: () => void;
  onOpenNote: (noteId: Id<"notes">) => void;
}) {
  const updateNote = useMutation(api.notes.update);
  const deleteNote = useMutation(api.notes.deleteNote);
  const createChild = useMutation(api.notes.createChild);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [metadata, setMetadata] = useState(note.metadata);
  const [modalState, setModalState] = useState<ModalState>("none");
  const [parentId, setParentId] = useState<Id<"notes"> | undefined>(
    note.parentId
  );
  const parentNote = useQuery(api.notes.get, { noteId: parentId });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const contentTextArea = useRef<HTMLTextAreaElement>(null);
  const cursorPosition = useRef<number | undefined>(undefined);

  const handleSave = async () => {
    await updateNote({
      noteId: note._id,
      title,
      content,
      metadata,
      parentId,
    });
    onGoBack();
  };

  const handleDelete = async () => {
    await deleteNote({ noteId: note._id });
    onGoBack();
  };

  const handleSetParent = async (parentId: Id<"notes">) => {
    setParentId(parentId);
    setModalState("none");
  };

  const handleRemoveParent = async () => {
    setParentId(undefined);
  };

  const handleSearchParent = () => {
    setModalState("parent");
  };

  const handleSearchLink = () => {
    cursorPosition.current = contentTextArea.current?.selectionStart;
    setModalState("link");
  };

  const handleAddLink = (noteId: Id<"notes">) => {
    const newContent = addLink(content, noteId, cursorPosition.current);
    setContent(newContent);
    setModalState("none");
  };

  const handleReply = async () => {
    const newNoteId = await createChild({
      parentId: note._id,
      userId: note.userId,
    });
    onOpenNote(newNoteId);
  };

  if (modalState === "none") {
    return (
      <div className="flex flex-col flex-grow p-8 gap-4">
        <Parent
          parentNote={parentNote}
          onRemove={handleRemoveParent}
          onSearch={handleSearchParent}
        />
        <input
          type="text"
          className="w-full border-2 text-lg font-semibold"
          placeholder="title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full h-full flex-1 border-2"
          ref={contentTextArea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <input
          type="text"
          className="w-full border-2"
          placeholder="metadata..."
          value={metadata}
          onChange={(e) => setMetadata(e.target.value)}
        />

        <div className="flex flex-row justify-center gap-8 p-4">
          <Icons.FaSave
            className="text-2xl hover:cursor-pointer"
            onClick={handleSave}
          />
          {/* TODO: duplicate code */}
          {confirmDelete ? (
            <Icons.FaCheck
              className="text-2xl hover:cursor-pointer"
              onClick={handleDelete}
            />
          ) : (
            <Icons.FaTrash
              className="text-2xl hover:cursor-pointer"
              onClick={() => setConfirmDelete(true)}
            />
          )}
          <Icons.FaLink
            className="text-2xl hover:cursor-pointer"
            onClick={handleSearchLink}
          />
          <Icons.FaReply
            className="text-2xl hover:cursor-pointer"
            onClick={handleReply}
          />
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex-grow flex p-8">
        <SearchModal
          userId={note.userId}
          onSelectNote={match(modalState)
            .with("parent", () => handleSetParent)
            .with("link", () => handleAddLink)
            .exhaustive()}
          onClose={() => setModalState("none")}
        />
      </div>
    );
  }
}

function Parent({
  parentNote,
  onRemove,
  onSearch,
}: {
  parentNote: Doc<"notes"> | null | undefined;
  onRemove: () => void;
  onSearch: () => void;
}) {
  if (parentNote === undefined) return <div>Loading...</div>;
  else if (parentNote === null) {
    return (
      <div className="flex flex-row justify-between items-center">
        <span className="text-gray-600">No parent</span>
        <Icons.FaPlus
          className="text-2xl text-gray-600 hover:cursor-pointer"
          onClick={onSearch}
        />
      </div>
    );
  } else {
    return (
      <div className="flex flex-row gap-4 items-center">
        <span className="text-sm text-gray-600">Parent:</span>
        <div className="flex-1">
          <ReadOnlyNote noteId={parentNote._id} />
        </div>
        <div className="flex flex-row justify-self-end gap-2 ml-2">
          <Icons.FaEdit
            className="text-2xl text-gray-600 hover:cursor-pointer"
            onClick={onSearch}
          />
          <Icons.FaTimes
            className="text-2xl text-gray-600 hover:cursor-pointer"
            onClick={onRemove}
          />
        </div>
      </div>
    );
  }
}
