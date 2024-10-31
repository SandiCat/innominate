import { useState, MouseEvent, useRef } from "react";
import { Map } from "immutable";
import * as Vec2 from "./lib/Vec2";
import { match } from "ts-pattern";

interface Camera {
  position: Vec2.Vec2;
  scale: number;
}

interface CanvasItem {
  position: Vec2.Vec2;
  color: string;
}

type DragState =
  | { type: "idle" }
  | { type: "dragging-canvas"; lastPosition: Vec2.Vec2 }
  | { type: "dragging-item"; item: CanvasItem; id: string; lastPosition: Vec2.Vec2 };

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

const ZOOM_SPEED = 0.01;

function App() {
  const [transform, setTransform] = useState<Camera>({ position: { x: 0, y: 0 }, scale: 1 });
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

    setDragState({
      type: "dragging-item",
      item,
      id,
      lastPosition: Vec2.fromMouseEvent(e)
    });
    setItems(items.remove(id));
  };

  const handleMouseMove = (e: MouseEvent) => {
    const currentPosition = Vec2.fromMouseEvent(e);

    match(dragState)
      .with({ type: "idle" }, () => { })
      .with({ type: "dragging-canvas" }, (state) => {
        const delta = Vec2.subtract(currentPosition, state.lastPosition);
        setTransform(prev => ({
          ...prev,
          position: Vec2.add(prev.position, delta)
        }));
        setDragState({ ...state, lastPosition: currentPosition });
      })
      .with({ type: "dragging-item" }, (state) => {
        const delta = Vec2.subtract(currentPosition, state.lastPosition);
        setDragState({
          ...state,
          item: {
            ...state.item,
            position: Vec2.add(state.item.position, Vec2.scale(delta, 1 / transform.scale))
          },
          lastPosition: currentPosition
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

  const handleWheel = (e: React.WheelEvent) => {
    const scaleFactor = 1 - Math.sign(e.deltaY) * ZOOM_SPEED;
    setTransform(prev => ({
      ...prev,
      scale: prev.scale * scaleFactor
    }));
  };

  return (
    <div
      className="w-screen h-screen overflow-hidden bg-gray-900"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div style={{
        transform: `translate(${transform.position.x}px, ${transform.position.y}px) scale(${transform.scale})`,
        transformOrigin: "center",
      }}>
        {items.entrySeq().map(([id, item]) => (
          <div key={id} onMouseDown={e => handleItemMouseDown(e, id)}>
            <CanvasItemComponent item={item} />
          </div>
        ))}
        {dragState.type === "dragging-item" && (
          <CanvasItemComponent item={dragState.item} />
        )}
      </div>
    </div>
  );
}

export default App;
