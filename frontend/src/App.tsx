import { useState, MouseEvent, useRef, useEffect } from "react";
import * as Vec2 from "./lib/Vec2";
import { match } from "ts-pattern";
import { Id } from "../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Note } from "./components/Note";
import { CanvasItem } from "./types";
import { NoteTree } from "./components/NoteTree";
const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID as Id<"users">;

type DragState =
  | { type: "idle" }
  | { type: "dragging-canvas"; lastPosition: Vec2.Vec2 }
  | {
      type: "dragging-item";
      canvasItem: CanvasItem;
      offset: Vec2.Vec2;
    };

interface CanvasItemProps {
  id: Id<"canvasItems">;
  position: Vec2.Vec2;
  onDragStart: (e: MouseEvent) => void;
}

function CanvasItemComponent({ id, position, onDragStart }: CanvasItemProps) {
  const canvasItem = useQuery(api.canvasItems.get, { id });

  if (!canvasItem) return null;
  const { noteId } = canvasItem;

  return (
    <div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <NoteTree rootNodeId={noteId} onDragStart={onDragStart} />
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
  const [dragState, setDragState] = useState<DragState>({ type: "idle" });

  const createNoteOnCanvas = useMutation(api.canvasItems.createNoteOnCanvas);
  const setPosition = useMutation(api.canvasItems.setPosition);
  const createCanvas = useMutation(api.canvases.createCanvas);
  const canvas = useQuery(api.canvases.getCanvasForUser, {
    userId: DEV_USER_ID,
  });

  // create the canvas if it does not exist
  useEffect(() => {
    async function createCanvasIfNeeded() {
      if (canvas === null) {
        await createCanvas({ userId: DEV_USER_ID });
      }
    }

    createCanvasIfNeeded();
  }, [canvas, createCanvas]);

  if (canvas === undefined) {
    return <div className="p-4">Loading canvas...</div>;
  }
  if (canvas === null) {
    return <div className="p-4">Creating canvas...</div>;
  }

  const handleCanvasMouseDown = (e: MouseEvent) => {
    setDragState({
      type: "dragging-canvas",
      lastPosition: Vec2.fromMouseEvent(e),
    });
  };

  const handleItemMouseDown = async (e: MouseEvent, canvasItem: CanvasItem) => {
    e.stopPropagation();
    if (dragState.type !== "idle") throw new Error("Must be in idle state");

    const mousePos = Vec2.fromMouseEvent(e);
    const offset = Vec2.subtract(
      canvasToScreen(canvasItem.position, origin),
      mousePos
    );

    setDragState({
      type: "dragging-item",
      canvasItem,
      offset,
    });
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
          canvasItem: { ...state.canvasItem, position: newPosition },
        });
      })
      .exhaustive();
  };

  const handleMouseUp = async () => {
    if (dragState.type === "dragging-item") {
      await setPosition(dragState.canvasItem);
    }

    setDragState({ type: "idle" });
  };

  const handleDoubleClick = async (e: MouseEvent) => {
    const mousePos = Vec2.fromMouseEvent(e);
    const canvasPos = screenToCanvas(mousePos, origin);

    await createNoteOnCanvas({ canvasId: canvas.id, position: canvasPos });
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
        {canvas.items.map((canvasItem) => {
          if (
            dragState.type === "dragging-item" &&
            dragState.canvasItem.id === canvasItem.id
          ) {
            return null;
          }

          return (
            <CanvasItemComponent
              key={canvasItem.id}
              id={canvasItem.id}
              position={canvasItem.position}
              onDragStart={(e) => handleItemMouseDown(e, canvasItem)}
            />
          );
        })}
        {dragState.type === "dragging-item" && (
          <CanvasItemComponent
            id={dragState.canvasItem.id}
            position={dragState.canvasItem.position}
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
