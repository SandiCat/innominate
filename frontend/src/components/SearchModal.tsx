import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import * as Icons from "react-icons/fa";

export type ModalState = "none" | "parent" | "link";

export function SearchModal({
  userId,
  onSelectNote,
  onClose,
}: {
  userId: Id<"users">;
  onSelectNote: (noteId: Id<"notes">) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const notes = useQuery(api.notes.search, { query });
  const createNote = useMutation(api.notes.create);
  const updateNote = useMutation(api.notes.update);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && notes && notes.length > 0) {
      onSelectNote(notes[0]._id);
    }
  };

  const handleCreateNote = async () => {
    const noteId = await createNote({ userId });
    await updateNote({
      noteId,
      title: query,
      content: "",
      metadata: "",
    });
    onSelectNote(noteId);
  };

  return (
    <div className="flex-grow bg-gray-200 rounded-lg shadow-lg flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        <input
          type="text"
          autoFocus
          value={query}
          onKeyDown={handleKeyDown}
          onChange={(e) => setQuery(e.target.value)}
          className="p-2 flex-1"
        />
        <Icons.FaPlus
          className="text-2xl text-gray-600"
          onClick={handleCreateNote}
        />
        <Icons.FaTimes className="text-2xl text-gray-600" onClick={onClose} />
      </div>
      <div className="flex flex-col flex-grow overflow-y-auto">
        {notes?.map((note) => (
          <div
            key={note._id}
            className="p-2 hover:bg-gray-100 rounded-md cursor-pointer"
            onClick={() => onSelectNote(note._id)}
            title={note.content}
          >
            {note.title || note.content}
          </div>
        ))}
      </div>
    </div>
  );
}
