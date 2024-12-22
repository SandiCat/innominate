import { cn } from "@/lib/utils";
import * as Icons from "react-icons/fa";
import {
  TbLayoutSidebarRight,
  TbLayoutSidebarRightFilled,
} from "react-icons/tb";
import { FaWandMagicSparkles } from "react-icons/fa6";

interface IconButtonProps {
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}

function IconButton({ icon, selected, onClick }: IconButtonProps) {
  return (
    <div
      className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
        "hover:bg-slate-200/80 active:scale-95",
        selected ? "bg-white shadow-lg text-slate-700" : "text-slate-600"
      )}
      onClick={onClick}
    >
      <div className="text-[18px]">{icon}</div>
    </div>
  );
}

export type UncollapsedTab =
  | { type: "search"; query: string }
  | { type: "recent" }
  | { type: "recommended" };

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
              onTabChange({ type: "search", query: "" });
            }}
          />
          {selectedTab.type === "search" && (
            <input
              type="text"
              className="bg-transparent border-none outline-none text-slate-700 w-32 px-2 placeholder:text-slate-400"
              placeholder="Search..."
              value={selectedTab.query}
              onChange={(e) =>
                onTabChange({ type: "search", query: e.target.value })
              }
              autoFocus
            />
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
          selected={selectedTab.type === "recommended"}
          onClick={() => {
            onTabChange({ type: "recommended" });
          }}
        />
      </div>
    </div>
  );
}
