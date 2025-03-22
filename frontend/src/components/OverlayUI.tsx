import { Id } from "convex/_generated/dataModel";
import { SidebarDrawer } from "./sidebar/Drawer";
import { useState } from "react";
import { Tab, Tabs } from "./sidebar/Tabs";
import { WithNoteId } from "./FullscreenEditor";
import { RoundedButton } from "./RoundedButton";
import * as Icons from "react-icons/fa";
import { api } from "../../convex/_generated/api";
import { useMutation } from "convex/react";

export function OverlayUI({
  onDragStart,
}: {
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
}) {
  const [selectedTab, setSelectedTab] = useState<Tab>({ type: "collapsed" });
  const [editingNote, setEditingNote] = useState<Id<"notes"> | null>(null);
  const createNote = useMutation(api.notes.create);

  const handleTabChange = (newTab: Tab) => {
    if (newTab === selectedTab) {
      setSelectedTab({ type: "collapsed" });
    } else {
      setSelectedTab(newTab);
    }
  };

  const handleNewNote = async () => {
    const newNoteId = await createNote();
    setEditingNote(newNoteId);
  };

  return (
    <div className="w-screen h-screen absolute z-10 pointer-events-none p-8 gap-4 flex flex-col">
      <div className="flex justify-end">
        <Tabs selectedTab={selectedTab} onTabChange={handleTabChange} />
      </div>
      <div className="flex-1 flex flex-row min-h-0 ">
        <div className="flex flex-1 justify-center items-center">
          {editingNote && (
            <div className="flex flex-col bg-blue-200 w-[500px] h-[500px] pointer-events-auto">
              <WithNoteId
                noteId={editingNote}
                onGoBack={() => setEditingNote(null)}
                onOpenNote={(noteId) => setEditingNote(noteId)}
              />
            </div>
          )}
        </div>
        {selectedTab.type !== "collapsed" && (
          <SidebarDrawer
            onDragStart={onDragStart}
            selectedTab={selectedTab}
            onSelect={setEditingNote}
          />
        )}
      </div>
      <div className="flex flex-row justify-end">
        <div className="pointer-events-auto">
          <RoundedButton onClick={handleNewNote}>
            <Icons.FaEdit className="text-2xl" />
          </RoundedButton>
        </div>
      </div>
    </div>
  );
}
