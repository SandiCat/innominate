import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import * as Icons from "react-icons/fa";
import { ViewNote } from "@/components/Note";
import { RoundedButton } from "@/components/RoundedButton";

export function NoteList({
  userId,
  onSelect,
  onCreate,
}: {
  userId: Id<"users">;
  onSelect: (noteId: Id<"notes">) => void;
  onCreate: () => void;
}) {
  const [query, setQuery] = useState("");
  const notes = useQuery(api.notes.searchOrRecent, { query, userId });

  const notesOrEmpty = notes ?? [];

  return (
    <div className="flex flex-col flex-grow">
      <div className="p-4 border-b">
        <input
          type="search"
          className="w-full p-2 border rounded-lg"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {notesOrEmpty.map((note) => (
          <NoteItem note={note} onSelect={onSelect} />
        ))}
      </div>

      <div className="fixed bottom-6 right-6">
        <RoundedButton onClick={onCreate}>
          <Icons.FaEdit className="text-2xl" />
        </RoundedButton>
      </div>
    </div>
  );
}

function NoteItem({
  note,
  onSelect,
}: {
  note: Doc<"notes">;
  onSelect: (noteId: Id<"notes">) => void;
}) {
  const createChild = useMutation(api.notes.createChild);

  const handleReply = async () => {
    const newNoteId = await createChild({
      parentId: note._id,
      userId: note.userId,
    });
    onSelect(newNoteId);
  };

  return (
    <div
      key={note._id}
      className="p-4 border-b hover:bg-gray-50 active:bg-gray-100 relative"
    >
      <div onClick={() => onSelect(note._id)}>
        <ViewNote showParent={true} note={note} />
      </div>
      <button
        onClick={handleReply}
        className="absolute bottom-4 right-4 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
      >
        <Icons.FaReply className="text-gray-600" />
      </button>
    </div>
  );
}
