import { useState, MouseEvent, useRef } from "react";
import { Map } from "immutable";
import * as Vec2 from "./lib/Vec2";

interface Camera {
  position: Vec2.Vec2;
  scale: number;
}

interface CanvasItem {
  position: Vec2.Vec2;
  color: string;
}

type CanvasDragState =
  | { type: "idle" }
  | { type: "dragging"; lastPosition: Vec2.Vec2 };

function CanvasItemComponent({ item }: { item: CanvasItem }) {
  return (
    <div
      className={`w-32 h-32 absolute bg-${item.color}-500`}
      style={{
        left: item.position.x,
        top: item.position.y
      }}
    />
  );
}

const ZOOM_SPEED = 0.01;

function App() {
  const [transform, setTransform] = useState<Camera>({ position: { x: 0, y: 0 }, scale: 1 });
  const [items, setItems] = useState<Map<string, CanvasItem>>(Map({
    "1": { position: { x: 200, y: 200 }, color: "blue" },
    "2": { position: { x: 400, y: 300 }, color: "red" },
    "3": { position: { x: 600, y: 200 }, color: "green" },
  }));

  const dragState = useRef<CanvasDragState>({ type: "idle" });

  const handleMouseDown = (e: MouseEvent) => {
    dragState.current = {
      type: "dragging",
      lastPosition: Vec2.fromMouseEvent(e)
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragState.current.type !== "dragging") return;

    const currentPosition = Vec2.fromMouseEvent(e);
    const delta = Vec2.subtract(currentPosition, dragState.current.lastPosition);

    setTransform(prev => ({
      ...prev,
      position: Vec2.add(prev.position, delta)
    }));

    dragState.current = {
      type: "dragging",
      lastPosition: currentPosition
    };
  };

  const handleMouseUp = () => {
    dragState.current = { type: "idle" };
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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div
        style={{
          transform: `translate(${transform.position.x}px, ${transform.position.y}px) scale(${transform.scale})`,
          transformOrigin: "center",
          transition: "transform 0.1s ease-out"
        }}
      >
        {items.valueSeq().map((item, id) => (
          <CanvasItemComponent key={id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default App;
