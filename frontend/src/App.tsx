import { useState, MouseEvent } from "react";
import * as Vec2 from "./lib/Vec2";

interface Camera {
  position: Vec2.Vec2;
  scale: number;
}

type DragState =
  | { type: "idle" }
  | { type: "dragging"; lastPosition: Vec2.Vec2 };

const ZOOM_SPEED = 0.01;

function App() {
  const [transform, setTransform] = useState<Camera>({ position: { x: 0, y: 0 }, scale: 1 });
  const [dragState, setDragState] = useState<DragState>({ type: "idle" });

  const handleMouseDown = (e: MouseEvent) => {
    setDragState({
      type: "dragging",
      lastPosition: Vec2.fromMouseEvent(e)
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragState.type !== "dragging") return;

    const currentPosition = Vec2.fromMouseEvent(e);
    const delta = Vec2.subtract(currentPosition, dragState.lastPosition);

    setTransform(prev => ({
      ...prev,
      position: Vec2.add(prev.position, delta)
    }));

    setDragState({
      type: "dragging",
      lastPosition: currentPosition
    });
  };

  const handleMouseUp = () => {
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
        <div className="w-32 h-32 bg-blue-500 absolute left-[200px] top-[200px]" />
        <div className="w-32 h-32 bg-red-500 absolute left-[400px] top-[300px]" />
        <div className="w-32 h-32 bg-green-500 absolute left-[600px] top-[200px]" />
      </div>
    </div>
  );
}

export default App;
