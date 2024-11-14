import { EditNote } from "./EditNote";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ViewNote } from "./ViewNote";
import { useState } from "react";

const TEST_NOTE_ID = "k570jgndphxpdhksjdx54zbnxh74h1q2" as Id<"notes">;

export function App() {
  const note = useQuery(api.notes.get, { noteId: TEST_NOTE_ID });
  const [state, setState] = useState<"view" | "edit">("view");
  if (note === undefined) return <div>Loading...</div>;
  if (note === null) return <div>Note not found</div>;
  return state === "view" ? (
    <ViewNote note={note} onEdit={() => setState("edit")} />
  ) : (
    <EditNote note={note} onSave={() => setState("view")} />
  );
}
