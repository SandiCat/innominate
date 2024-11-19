import { useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";
import * as Icons from "react-icons/fa";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { ReadOnlyNote } from "../components/Note";
import { addLink } from "@/utils";

type ModalState = "none" | "parent" | "link";

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
    return <EditNote note={note} onGoBack={onGoBack} onOpenNote={onOpenNote} />;
}

export function EditNote({
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
      <div className="flex flex-col h-[100dvh] p-8 gap-4">
        <Parent
          parentNote={parentNote}
          onRemove={handleRemoveParent}
          onSearch={handleSearchParent}
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
  } else if (modalState === "parent") {
    return (
      <SearchModal
        userId={note.userId}
        onSelect={handleSetParent}
        onClose={() => setModalState("none")}
      />
    );
  } else if (modalState === "link") {
    return (
      <SearchModal
        userId={note.userId}
        onSelect={handleAddLink}
        onClose={() => setModalState("none")}
      />
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

function SearchModal({
  userId,
  onSelect,
  onClose,
}: {
  userId: Id<"users">;
  onSelect: (noteId: Id<"notes">) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const notes = useQuery(api.notes.search, { userId, query });

  return (
    <div className="fixed inset-0 bg-white p-4 z-50">
      <div className="flex flex-col h-full gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Select Parent</h2>
          <Icons.FaTimes
            className="text-2xl hover:cursor-pointer"
            onClick={onClose}
          />
        </div>
        <input
          type="search"
          className="border-2 p-2"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="flex-1 overflow-auto">
          {notes?.map((note) => (
            <div
              key={note._id}
              className="p-4 border-b hover:bg-gray-100 cursor-pointer"
              onClick={() => onSelect(note._id)}
            >
              {note.content || "(empty)"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
