import { cn } from "@/lib/utils";

interface IconButtonProps {
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}

export function IconButton({ icon, selected, onClick }: IconButtonProps) {
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
