import { useState, MouseEvent, useRef } from "react";
import { Map } from "immutable";
import * as Vec2 from "./lib/Vec2";
import { match } from "ts-pattern";
import { NoteTree } from "./components/NoteTree";
import * as Tree from "./lib/Tree";

type NoteId = string;
type CanvasItemId = string;

interface CanvasItem {
  position: Vec2.Vec2;
  noteTree: Tree.Tree<NoteId, void>;
}

type DragState =
  | { type: "idle" }
  | { type: "dragging-canvas"; lastPosition: Vec2.Vec2 }
  | { type: "dragging-item"; item: CanvasItem; id: string; offset: Vec2.Vec2 };

function CanvasItemComponent({
  position,
  tree,
  onContentChange,
  onDragStart,
}: {
  position: Vec2.Vec2;
  tree: Tree.Tree<NoteId, string>;
  onContentChange?: (noteId: NoteId, content: string) => void;
  onDragStart?: (e: MouseEvent) => void;
}) {
  return (
    <div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={onDragStart}
    >
      <NoteTree tree={tree} onContentChange={onContentChange} />
    </div>
  );
}

function screenToCanvas(screenPos: Vec2.Vec2, origin: Vec2.Vec2): Vec2.Vec2 {
  return Vec2.subtract(screenPos, origin);
}

function canvasToScreen(canvasPos: Vec2.Vec2, origin: Vec2.Vec2): Vec2.Vec2 {
  return Vec2.add(canvasPos, origin);
}

const SAMPLE_NOTES = Map({
  "1": { position: { x: 200, y: 200 }, content: "First note" },
  "2": { position: { x: 400, y: 300 }, content: "Second note" },
  "3": { position: { x: 600, y: 200 }, content: "Third note" },
});

function App() {
  const [origin, setOrigin] = useState<Vec2.Vec2>({ x: 0, y: 0 });
  const [notes, setNotes] = useState<Map<NoteId, string>>(Map());
  const [items, setItems] = useState<Map<CanvasItemId, CanvasItem>>(Map());
  const [dragState, setDragState] = useState<DragState>({ type: "idle" });

  const handleCanvasMouseDown = (e: MouseEvent) => {
    setDragState({
      type: "dragging-canvas",
      lastPosition: Vec2.fromMouseEvent(e),
    });
  };

  const handleItemMouseDown = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    const item = items.get(id);
    if (!item) throw new Error(`Item with id ${id} not found`);
    if (dragState.type !== "idle") throw new Error("Must be in idle state");

    const mousePos = Vec2.fromMouseEvent(e);
    const offset = Vec2.subtract(
      canvasToScreen(item.position, origin),
      mousePos
    );

    setDragState({ type: "dragging-item", item, id, offset });
    setItems(items.remove(id));
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
          item: {
            ...state.item,
            position: newPosition,
          },
        });
      })
      .exhaustive();
  };

  const handleMouseUp = () => {
    match(dragState)
      .with({ type: "dragging-item" }, (state) => {
        setItems(items.set(state.id, state.item));
      })
      .otherwise(() => {});

    setDragState({ type: "idle" });
  };

  const handleContentChange = (noteId: NoteId, content: string) => {
    setNotes(notes.set(noteId, content));
  };

  const handleDoubleClick = (e: MouseEvent) => {
    const mousePos = Vec2.fromMouseEvent(e);
    const canvasPos = screenToCanvas(mousePos, origin);
    const newItemId = crypto.randomUUID();
    const newNoteId = crypto.randomUUID();

    setNotes(notes.set(newNoteId, ""));
    setItems(
      items.set(newItemId, {
        position: canvasPos,
        noteTree: Tree.singleton(newNoteId, undefined),
      })
    );
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
        {items.entrySeq().map(([id, item]) => (
          <CanvasItemComponent
            key={id}
            item={item}
            notes={notes}
            onContentChange={handleContentChange}
            onDragStart={(e) => handleItemMouseDown(e, id)}
          />
        ))}
        {dragState.type === "dragging-item" && (
          <CanvasItemComponent item={dragState.item} notes={notes} />
        )}
      </div>
    </div>
  );
}

export default App;
