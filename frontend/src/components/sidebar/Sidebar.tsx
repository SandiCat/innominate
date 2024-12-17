import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { ReadOnlyNote } from "../Note";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Tabs, Tab } from "./Tabs";

function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  return (
    <input
      type="search"
      placeholder="Search notes..."
      className="w-full px-4 py-2 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
      onChange={(e) => onSearch(e.target.value)}
    />
  );
}

interface NoteSearchResult {
  _id: Id<"notes">;
}

function SearchDrawer({
  searchResults,
  onDragStart,
}: {
  searchResults: NoteSearchResult[] | undefined;
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
}) {
  return (
    <div className="mt-2 bg-white/35 backdrop-blur-sm rounded-lg shadow-lg p-4 overflow-y-auto">
      <div className="space-y-4">
        {searchResults?.map((note) => (
          <div key={note._id} onMouseDown={(e) => onDragStart(e, note._id)}>
            <ReadOnlyNote noteId={note._id} />
          </div>
        ))}
      </div>
    </div>
  );
}
interface SidebarProps {
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
}

export function Sidebar({ onDragStart }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<Tab>({ type: "collapsed" });

  const searchResults = useQuery(api.notes.search, {
    query: searchQuery,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="fixed top-4 right-4 w-80 z-10 flex flex-col">
      <Tabs selectedTab={selectedTab} onTabChange={setSelectedTab} />
      <SearchBar onSearch={handleSearch} />
      {searchQuery !== "" && (
        <SearchDrawer searchResults={searchResults} onDragStart={onDragStart} />
      )}
    </div>
  );
}
