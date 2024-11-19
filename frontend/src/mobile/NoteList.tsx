import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useState } from "react";
import * as Icons from "react-icons/fa";

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
    <div className="flex flex-col h-[100dvh]">
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
          <div
            key={note._id}
            className="p-4 border-b hover:bg-gray-50 active:bg-gray-100"
            onClick={() => onSelect(note._id)}
          >
            <div className="font-medium">{note.content || "(empty)"}</div>
          </div>
        ))}
      </div>

      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white"
        onClick={onCreate}
      >
        <Icons.FaEdit className="text-2xl" />
      </button>
    </div>
  );
}
