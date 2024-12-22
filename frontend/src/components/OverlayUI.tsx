import { Id } from "convex/_generated/dataModel";
import { SidebarDrawer } from "./sidebar/Drawer";
import { useState } from "react";
import { Tab, Tabs } from "./sidebar/Tabs";

export function OverlayUI({
  onDragStart,
}: {
  onDragStart: (e: React.MouseEvent, noteId: Id<"notes">) => void;
}) {
  const [selectedTab, setSelectedTab] = useState<Tab>({ type: "collapsed" });
  const [editingNote, setEditingNote] = useState<Id<"notes"> | null>(null);

  const handleTabChange = (newTab: Tab) => {
    if (newTab === selectedTab) {
      setSelectedTab({ type: "collapsed" });
    } else {
      setSelectedTab(newTab);
    }
  };

  return (
    <div className="w-screen h-screen absolute z-10 pointer-events-none p-8 gap-4 flex flex-col">
      <div className="flex justify-end">
        <Tabs selectedTab={selectedTab} onTabChange={handleTabChange} />
      </div>
      <div className="flex-1 flex flex-row min-h-0 ">
        <div className="flex flex-1 justify-center items-center">
          <div className="bg-blue-200 w-[500px] h-[500px] pointer-events-auto" />
        </div>
        {selectedTab.type !== "collapsed" && (
          <SidebarDrawer onDragStart={onDragStart} selectedTab={selectedTab} />
        )}
      </div>
    </div>
  );
}
