import { useState } from "react";

interface NoteProps {
  content: string;
  onChange: (content: string) => void;
}

export function Note({ content, onChange }: NoteProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      className="w-[200px] min-h-[120px] 
                 bg-white rounded-lg shadow-lg cursor-grab relative"
    >
      <button
        className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(!isEditing);
        }}
      >
        {isEditing ? "✓" : "✎"}
      </button>
      <div className="p-4">
        {isEditing ? (
          <textarea
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full resize-none outline-none select-text"
            value={content}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
            rows={1}
            style={{ height: "auto", minHeight: "1em" }}
            ref={(textArea) => {
              if (textArea) {
                textArea.style.height = "auto";
                textArea.style.height = `${textArea.scrollHeight}px`;
              }
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
        ) : (
          <div
            className={`whitespace-pre-wrap select-none ${
              !content ? "text-gray-400" : ""
            }`}
          >
            {content || "Empty..."}
          </div>
        )}
      </div>
    </div>
  );
}
