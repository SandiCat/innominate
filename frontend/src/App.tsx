import { useState, MouseEvent, useRef } from "react";
import { Map } from "immutable";
import * as Vec2 from "./lib/Vec2";
import { match } from "ts-pattern";
import { Id } from "../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Note } from "./components/Note";
import { useLocalValue } from "./utils/convex";

const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID as Id<"users">;

type DragState =
  | { type: "idle" }
  | { type: "dragging-canvas"; lastPosition: Vec2.Vec2 }
  | {
      type: "dragging-item";
      position: Vec2.Vec2;
      noteId: Id<"notes">;
      offset: Vec2.Vec2;
    };

interface CanvasItemProps {
  position: Vec2.Vec2;
  noteId: Id<"notes">;
  onDragStart: (e: MouseEvent) => void;
}

function CanvasItem({ position, noteId, onDragStart }: CanvasItemProps) {
  return (
    <div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <Note noteId={noteId} onDragStart={onDragStart} />
    </div>
  );
}

function screenToCanvas(screenPos: Vec2.Vec2, origin: Vec2.Vec2): Vec2.Vec2 {
  return Vec2.subtract(screenPos, origin);
}

function canvasToScreen(canvasPos: Vec2.Vec2, origin: Vec2.Vec2): Vec2.Vec2 {
  return Vec2.add(canvasPos, origin);
}

function App() {
  const [origin, setOrigin] = useState<Vec2.Vec2>({ x: 0, y: 0 });
  const [positions, setPositions] = useLocalValue(
    api.canvases.canvasForUser,
    DEV_USER_ID,
    api.canvases.persistUserCanvas,
    1000
  );
  const [dragState, setDragState] = useState<DragState>({ type: "idle" });

  const createNote = useMutation(api.notes.create);

  if (positions === undefined) {
    return <div className="p-4">Loading canvas...</div>;
  }

  const handleCanvasMouseDown = (e: MouseEvent) => {
    setDragState({
      type: "dragging-canvas",
      lastPosition: Vec2.fromMouseEvent(e),
    });
  };

  const handleItemMouseDown = (e: MouseEvent, noteId: Id<"notes">) => {
    e.stopPropagation();
    const position = positions.get(noteId);
    if (!position) throw new Error(`Position for note ${noteId} not found`);
    if (dragState.type !== "idle") throw new Error("Must be in idle state");

    const mousePos = Vec2.fromMouseEvent(e);
    const offset = Vec2.subtract(canvasToScreen(position, origin), mousePos);

    setDragState({
      type: "dragging-item",
      noteId,
      position,
      offset,
    });
    setPositions(positions.remove(noteId));
  };

  const handleMouseMove = (e: MouseEvent) => {
    const mousePos = Vec2.fromMouseEvent(e);

    match(dragState)
      .with({ type: "idle" }, () => {})
      .with({ type: "dragging-canvas" }, (state) => {
        const delta = Vec2.subtract(mousePos, state.lastPosition);
        setOrigin(Vec2.add(origin, delta));
        setDragState({ ...state, lastPosition: mousePos });
      })
      .with({ type: "dragging-item" }, (state) => {
        const newPosition = screenToCanvas(
          Vec2.add(mousePos, state.offset),
          origin
        );
        setDragState({
          ...state,
          position: newPosition,
        });
      })
      .exhaustive();
  };

  const handleMouseUp = () => {
    match(dragState)
      .with({ type: "dragging-item" }, (state) => {
        setPositions(positions.set(state.noteId, state.position));
      })
      .otherwise(() => {});

    setDragState({ type: "idle" });
  };

  const handleDoubleClick = async (e: MouseEvent) => {
    const mousePos = Vec2.fromMouseEvent(e);
    const canvasPos = screenToCanvas(mousePos, origin);

    const newNoteId = await createNote({ content: "", userId: DEV_USER_ID });
    setPositions(positions.set(newNoteId, canvasPos));
  };

  return (
    <div
      className="w-screen h-screen overflow-hidden bg-blue-50"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <div
        style={{
          transform: `translate(${origin.x}px, ${origin.y}px)`,
        }}
      >
        {positions.entrySeq().map(([noteId, position]) => (
          <CanvasItem
            key={noteId}
            noteId={noteId}
            position={position}
            onDragStart={(e) => handleItemMouseDown(e, noteId)}
          />
        ))}
        {dragState.type === "dragging-item" && (
          <CanvasItem
            noteId={dragState.noteId}
            position={dragState.position}
            onDragStart={() => {
              throw new Error("Start drag on already dragging item");
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
