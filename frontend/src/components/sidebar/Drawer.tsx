import { Id } from "../../../convex/_generated/dataModel";
import { ReadOnlyNote } from "../Note";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UncollapsedTab } from "./Tabs";
import { match } from "ts-pattern";

interface NoteSearchResult {
  _id: Id<"notes">;
}

function splitIntoTwoColumns<T>(arr: T[]): [T[], T[]] {
  return [arr.filter((_, i) => i % 2 === 0), arr.filter((_, i) => i % 2 === 1)];
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
  return (
    <div
      onMouseDown={(e) => {
        if (e.button !== 0) return; // only handle left clicks

        const onMouseMove = () => {
          onDragStart(e, noteId);
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };

        const onMouseUp = () => {
          onSelect(noteId);
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      }}
    >
      <ReadOnlyNote noteId={noteId} />
    </div>
  );
}

function Column({
  notes,
  onDragStart,
  onSelect,
}: {
  notes: NoteSearchResult[];
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
  onSelect: (noteId: Id<"notes">) => void;
}) {
  return (
    <div className="flex-1 flex flex-col gap-2">
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
            const [leftColumn, rightColumn] = splitIntoTwoColumns(notes);
            return (
              <div className="flex flex-1 flex-row gap-2 p-2">
                <Column
                  notes={leftColumn}
                  onDragStart={onDragStart}
                  onSelect={onSelect}
                />
                <Column
                  notes={rightColumn}
                  onDragStart={onDragStart}
                  onSelect={onSelect}
                />
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
