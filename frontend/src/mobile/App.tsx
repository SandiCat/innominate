import { WithNoteId } from "@/components/FullscreenEditor";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { NoteList } from "./NoteList";
import { match } from "ts-pattern";

type State = { type: "list" } | { type: "edit"; noteId: Id<"notes"> };

export function App({ userId }: { userId: Id<"users"> }) {
  const [state, setState] = useState<State>({ type: "list" });
  const createNote = useMutation(api.notes.create);

  const handleCreateNote = async () => {
    const noteId = await createNote();
    setState({ type: "edit", noteId });
  };

  const handleSelectNote = (noteId: Id<"notes">) => {
    setState({ type: "edit", noteId });
  };

  const handleGoBack = () => {
    setState({ type: "list" });
  };

  return (
    <div className="flex h-[100dvh] w-[100dvw]">
      {match(state)
        .with({ type: "list" }, () => (
          <NoteList
            userId={userId}
            onSelect={handleSelectNote}
            onCreate={handleCreateNote}
          />
        ))
        .with({ type: "edit" }, ({ noteId }) => (
          <WithNoteId
            noteId={noteId}
            onGoBack={handleGoBack}
            onOpenNote={handleSelectNote}
          />
        ))
        .exhaustive()}
    </div>
  );
}
