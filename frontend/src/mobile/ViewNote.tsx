import { Doc } from "../../convex/_generated/dataModel";
import * as Icons from "react-icons/fa";

export function ViewNote({
  note,
  onEdit,
}: {
  note: Doc<"notes">;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-col h-[100dvh] p-8 gap-4">
      <pre className="flex-1 overflow-y-auto text-wrap">{note.content}</pre>
      <Icons.FaEdit
        className="text-2xl hover:cursor-pointer justify-self-end self-center"
        onClick={onEdit}
      />
    </div>
  );
}
