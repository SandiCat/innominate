import { useQuery } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { parseNoteBody } from "../../types";
import { shortDisplay } from "@/lib/note";

interface NoteBodyProps {
  content: string;
}

export function NoteBody({ content }: NoteBodyProps) {
  if (!content) return <div className="text-gray-400">Empty...</div>;

  return (
    <div className="whitespace-pre-wrap">
      {parseNoteBody(content).map((token, i) =>
        token.type === "text" ? (
          <span key={i}>{token.text}</span>
        ) : (
          <MentionSpan key={i} noteId={token.noteId} />
        )
      )}
    </div>
  );
}

function MentionSpan({ noteId }: { noteId: Id<"notes"> }) {
  const note = useQuery(api.notes.get, { noteId });

  if (note === null) {
    return <span className="bg-gray-200 px-1 rounded">broken link</span>;
  } else {
    return (
      <span
        className="bg-blue-100 px-1 rounded cursor-help"
        title={note === undefined ? "Loading..." : note.content}
      >
        @{note === undefined ? "Loading..." : shortDisplay(note)}
      </span>
    );
  }
}
