import { useState, MouseEvent, useRef } from "react";
import { Map } from "immutable";
import * as Vec2 from "./lib/Vec2";
import { match } from "ts-pattern";
import { LiftedWrapper } from "./components/LiftedWrapper";

interface CanvasItem {
  position: Vec2.Vec2;
  color: string;
}

type DragState =
  | { type: "idle" }
  | { type: "dragging-canvas"; lastPosition: Vec2.Vec2 }
  | { type: "dragging-item"; item: CanvasItem; id: string; };

function CanvasItemComponent({ item }: { item: CanvasItem }) {
  return (
    <div
      className="w-32 h-32 absolute cursor-pointer"
      style={{
        left: item.position.x,
        top: item.position.y,
        backgroundColor: item.color
      }}
    />
  );
}

function App() {
  const [origin, setOrigin] = useState<Vec2.Vec2>({ x: 0, y: 0 });
  const [items, setItems] = useState<Map<string, CanvasItem>>(Map({
    "1": { position: { x: 200, y: 200 }, color: "#3B82F6" },
    "2": { position: { x: 400, y: 300 }, color: "#EF4444" },
    "3": { position: { x: 600, y: 200 }, color: "#10B981" },
  }));
  const [dragState, setDragState] = useState<DragState>({ type: "idle" });

  const handleCanvasMouseDown = (e: MouseEvent) => {
    setDragState({
      type: "dragging-canvas",
      lastPosition: Vec2.fromMouseEvent(e)
    });
  };

  const handleItemMouseDown = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    const item = items.get(id);
    if (!item) throw new Error(`Item with id ${id} not found`);
    if (dragState.type !== "idle") throw new Error("Must be in ");

    setDragState({ type: "dragging-item", item, id });
    setItems(items.remove(id));
  };

  const handleMouseMove = (e: MouseEvent) => {
    const mousePos = Vec2.fromMouseEvent(e);

    match(dragState)
      .with({ type: "idle" }, () => { })
      .with({ type: "dragging-canvas" }, (state) => {
        const delta = Vec2.subtract(mousePos, state.lastPosition);
        setOrigin(Vec2.add(origin, delta));
        setDragState({ ...state, lastPosition: mousePos });
      })
      .with({ type: "dragging-item" }, (state) => {
        const worldPos = Vec2.subtract(mousePos, origin);
        setDragState({
          ...state,
          item: {
            ...state.item,
            position: worldPos
          }
        });
      })
      .exhaustive();
  };

  const handleMouseUp = () => {
    match(dragState)
      .with({ type: "dragging-item" }, (state) => {
        setItems(items.set(state.id, state.item));
      })
      .otherwise(() => { });

    setDragState({ type: "idle" });
  };

  return (
    <div
      className="w-screen h-screen overflow-hidden bg-blue-50"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div style={{
        transform: `translate(${origin.x}px, ${origin.y}px)`,
      }}>
        {items.entrySeq().map(([id, item]) => (
          <div key={id} onMouseDown={e => handleItemMouseDown(e, id)}>
            <CanvasItemComponent item={item} />
          </div>
        ))}
      </div>
      {dragState.type === "dragging-item" && (
        <CanvasItemComponent item={dragState.item} />
      )}
    </div >
  );
}

export default App;
