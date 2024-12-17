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
        "w-10 h-10 hover:bg-gray-500 rounded-lg flex items-center justify-center",
        selected && "bg-gray-500"
      )}
      onClick={onClick}
    >
      {icon}
    </div>
  );
}

type Tab =
  | { type: "search"; query: string }
  | { type: "recent" }
  | { type: "recommended" }
  | { type: "collapsed" };

interface TabsProps {
  selectedTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Tabs({ selectedTab, onTabChange }: TabsProps) {
  return (
    <div className="flex flex-row space-x-5">
      <IconButton
        icon={
          selectedTab.type === "collapsed" ? (
            <TbLayoutSidebarRightFilled />
          ) : (
            <TbLayoutSidebarRight />
          )
        }
        selected={selectedTab.type === "collapsed"}
        onClick={() => onTabChange({ type: "collapsed" })}
      />

      <div className="flex flex-row bg-gray-700 rounded-lg space-x-2 p-1">
        <div className="flex items-center">
          <IconButton
            icon={<Icons.FaSearch />}
            selected={selectedTab.type === "search"}
            onClick={() => {
              onTabChange({ type: "search", query: "" });
            }}
          />
          {selectedTab.type === "search" && (
            <input
              type="text"
              className="bg-transparent border-none outline-none text-white px-2"
              value={selectedTab.query}
              onChange={(e) =>
                onTabChange({ type: "search", query: e.target.value })
              }
              autoFocus
            />
          )}
        </div>
        <IconButton
          icon={<Icons.FaClock />}
          selected={selectedTab.type === "recent"}
          onClick={() => {
            onTabChange({ type: "recent" });
          }}
        />
        <IconButton
          icon={<FaWandMagicSparkles />}
          selected={selectedTab.type === "recommended"}
          onClick={() => {
            onTabChange({ type: "recommended" });
          }}
        />
      </div>
    </div>
  );
}
