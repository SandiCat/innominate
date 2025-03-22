import { Id } from "../../../convex/_generated/dataModel";
import { ReadOnlyNote } from "../Note";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UncollapsedTab } from "./Tabs";
import { match } from "ts-pattern";
import { mouseClickVsDrag } from "@/lib/utils";
import { useState } from "react";
import { FaEdit, FaReply, FaTrash, FaCheck } from "react-icons/fa";
import { ButtonIcon, ButtonContainer } from "../note/Buttons";

interface NoteSearchResult {
  _id: Id<"notes">;
}

function Note({
  noteId,
  onDragStart,
  onSelect,
}: {
  noteId: Id<"notes">;
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
  onSelect: (noteId: Id<"notes">) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const createChild = useMutation(api.notes.createChild);
  const deleteNote = useMutation(api.notes.deleteNote);

  const handleCreateChild = async () => {
    const childId = await createChild({ parentId: noteId });
    onSelect(childId);
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      await deleteNote({ noteId });
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onMouseDown={(e) => {
          mouseClickVsDrag(
            e,
            () => onDragStart(e, noteId),
            () => onSelect(noteId)
          );
        }}
      >
        <ReadOnlyNote noteId={noteId} />
      </div>
      {isHovered && (
        <div className="absolute bottom-2 right-2">
          <ButtonContainer>
            <ButtonIcon icon={<FaReply />} onClick={handleCreateChild} />
            <ButtonIcon
              icon={<FaEdit />}
              onClick={async () => onSelect(noteId)}
            />
            <ButtonIcon
              icon={confirmDelete ? <FaCheck /> : <FaTrash />}
              onClick={handleDelete}
            />
          </ButtonContainer>
        </div>
      )}
    </div>
  );
}

function Drawer({
  notes,
  onDragStart,
  onSelect,
}: {
  notes: NoteSearchResult[] | undefined | null;
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
  onSelect: (noteId: Id<"notes">) => void;
}) {
  return (
    <div className="w-80  flex flex-col overflow-y-auto pointer-events-auto bg-white/35 backdrop-blur-sm rounded-lg shadow-lg">
      <div className="flex-1 min-h-0">
        {match(notes)
          .with(undefined, () => null)
          .with(null, () => null)
          .with([], () => (
            <div className="flex items-center justify-center h-24 text-gray-500 italic text-sm">
              Empty...
            </div>
          ))
          .otherwise((notes) => {
            return (
              <div className="flex-1 flex flex-col gap-2 p-2">
                {notes.map((note) => (
                  <Note
                    key={note._id}
                    noteId={note._id}
                    onDragStart={onDragStart}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function SearchResults({
  query,
  onDragStart,
  onSelect,
}: {
  query: string;
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
  onSelect: (noteId: Id<"notes">) => void;
}) {
  const searchResults = useQuery(api.notes.search, {
    query,
  });

  const notes = query === "" ? null : searchResults;

  return <Drawer notes={notes} onDragStart={onDragStart} onSelect={onSelect} />;
}

function RecentNotes({
  onDragStart,
  onSelect,
}: {
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
  onSelect: (noteId: Id<"notes">) => void;
}) {
  const recentNotes = useQuery(api.notes.recent);

  return (
    <Drawer notes={recentNotes} onDragStart={onDragStart} onSelect={onSelect} />
  );
}

function RecommendedNotes({
  onDragStart,
  onSelect,
}: {
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
  onSelect: (noteId: Id<"notes">) => void;
}) {
  return <Drawer notes={[]} onDragStart={onDragStart} onSelect={onSelect} />;
}

interface SidebarProps {
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
  onSelect: (noteId: Id<"notes">) => void;
  selectedTab: UncollapsedTab;
}

export function SidebarDrawer({
  onDragStart,
  onSelect,
  selectedTab,
}: SidebarProps) {
  return match(selectedTab)
    .with({ type: "search" }, (tab) => (
      <SearchResults
        query={tab.query}
        onDragStart={onDragStart}
        onSelect={onSelect}
      />
    ))
    .with({ type: "recent" }, () => (
      <RecentNotes onDragStart={onDragStart} onSelect={onSelect} />
    ))
    .with({ type: "recommended" }, () => (
      <RecommendedNotes onDragStart={onDragStart} onSelect={onSelect} />
    ))
    .exhaustive();
}
