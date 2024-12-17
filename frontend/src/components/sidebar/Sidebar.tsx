import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { ReadOnlyNote } from "../Note";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Tabs, Tab } from "./Tabs";
import { match } from "ts-pattern";

interface NoteSearchResult {
  _id: Id<"notes">;
}

function splitIntoTwoColumns<T>(arr: T[]): [T[], T[]] {
  return [arr.filter((_, i) => i % 2 === 0), arr.filter((_, i) => i % 2 === 1)];
}

function Column({
  notes,
  onDragStart,
}: {
  notes: NoteSearchResult[];
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
}) {
  return (
    <div className="flex-1 flex flex-col gap-2">
      {notes.map((note) => (
        <div key={note._id} onMouseDown={(e) => onDragStart(e, note._id)}>
          <ReadOnlyNote noteId={note._id} />
        </div>
      ))}
    </div>
  );
}

function Drawer({
  notes,
  onDragStart,
}: {
  notes: NoteSearchResult[] | undefined;
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
}) {
  return (
    <div className="mt-2 bg-white/35 backdrop-blur-sm rounded-lg shadow-lg overflow-y-auto">
      {match(notes)
        .with(undefined, () => null)
        .with([], () => (
          <div className="flex items-center justify-center h-24 text-gray-500 italic text-sm">
            Empty...
          </div>
        ))
        .otherwise((notes) => {
          const [leftColumn, rightColumn] = splitIntoTwoColumns(notes);
          return (
            <div className="flex flex-row gap-2 p-2">
              <Column notes={leftColumn} onDragStart={onDragStart} />
              <Column notes={rightColumn} onDragStart={onDragStart} />
            </div>
          );
        })}
    </div>
  );
}

function SearchResults({
  query,
  onDragStart,
}: {
  query: string;
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
}) {
  const searchResults = useQuery(api.notes.search, {
    query,
  });

  return <Drawer notes={searchResults} onDragStart={onDragStart} />;
}

function RecentNotes({
  onDragStart,
}: {
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
}) {
  const recentNotes = useQuery(api.notes.recent);

  return <Drawer notes={recentNotes} onDragStart={onDragStart} />;
}

function RecommendedNotes({
  onDragStart,
}: {
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
}) {
  return <Drawer notes={[]} onDragStart={onDragStart} />;
}

interface SidebarProps {
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
}

export function Sidebar({ onDragStart }: SidebarProps) {
  const [selectedTab, setSelectedTab] = useState<Tab>({ type: "collapsed" });

  return (
    <div className="fixed top-4 right-4 w-80 z-10 flex flex-col">
      <Tabs selectedTab={selectedTab} onTabChange={setSelectedTab} />
      {match(selectedTab)
        .with({ type: "search" }, (tab) => (
          <SearchResults query={tab.query} onDragStart={onDragStart} />
        ))
        .with({ type: "recent" }, () => (
          <RecentNotes onDragStart={onDragStart} />
        ))
        .with({ type: "recommended" }, () => (
          <RecommendedNotes onDragStart={onDragStart} />
        ))
        .with({ type: "collapsed" }, () => null)
        .exhaustive()}
    </div>
  );
}
