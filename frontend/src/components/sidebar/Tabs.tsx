import * as Icons from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import {
  TbLayoutSidebarRight,
  TbLayoutSidebarRightFilled,
} from "react-icons/tb";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { Id } from "convex/_generated/dataModel";
import { IconButton } from "../IconButton";

export type UncollapsedTab =
  | { type: "search"; query: string; useEmbeddings: boolean }
  | { type: "recent" }
  | { type: "similar"; noteId?: Id<"notes"> };

export type Tab = UncollapsedTab | { type: "collapsed" };

interface TabsProps {
  selectedTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Tabs({ selectedTab, onTabChange }: TabsProps) {
  return (
    <div className="flex flex-row items-center gap-2 pointer-events-auto">
      <IconButton
        icon={
          selectedTab.type === "collapsed" ? (
            <TbLayoutSidebarRightFilled className="w-[18px] h-[18px]" />
          ) : (
            <TbLayoutSidebarRight className="w-[18px] h-[18px]" />
          )
        }
        selected={selectedTab.type !== "collapsed"}
        onClick={() => onTabChange({ type: "collapsed" })}
      />

      <div className="flex flex-row bg-white/70 backdrop-blur-xl rounded-lg p-1.5 gap-1 shadow-lg">
        <div className="flex items-center">
          <IconButton
            icon={<Icons.FaSearch className="w-[16px] h-[16px]" />}
            selected={selectedTab.type === "search"}
            onClick={() => {
              onTabChange({ type: "search", query: "", useEmbeddings: false });
            }}
          />
          {selectedTab.type === "search" && (
            <div className="flex flex-row items-center gap-1">
              <input
                type="text"
                className="bg-transparent border-none outline-none text-slate-700 w-32 px-2 placeholder:text-slate-400"
                placeholder="Search..."
                value={selectedTab.query}
                onChange={(e) =>
                  onTabChange({
                    ...selectedTab,
                    query: e.target.value,
                  })
                }
                autoFocus
              />
              <IconButton
                icon={<BsStars className="w-[12px] h-[12px]" />}
                selected={selectedTab.useEmbeddings}
                onClick={() => {
                  onTabChange({
                    ...selectedTab,
                    useEmbeddings: !selectedTab.useEmbeddings,
                  });
                }}
              />
            </div>
          )}
        </div>
        <IconButton
          icon={<Icons.FaClock className="w-[16px] h-[16px]" />}
          selected={selectedTab.type === "recent"}
          onClick={() => {
            onTabChange({ type: "recent" });
          }}
        />
        <IconButton
          icon={<FaWandMagicSparkles className="w-[16px] h-[16px]" />}
          selected={selectedTab.type === "similar"}
          onClick={() => {
            onTabChange({ type: "similar", noteId: undefined });
          }}
        />
      </div>
    </div>
  );
}
