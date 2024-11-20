import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import * as Vec2 from "@/lib/Vec2";

const ITEM_SIZE = 100;
const MAX_DIM = 150;

export function MiniMap({
  canvasId,
  origin,
}: {
  canvasId: Id<"canvases">;
  origin: Vec2.Vec2;
}) {
  const canvas = useQuery(api.canvases.getCanvas, { canvasId });
  if (!canvas) {
    return null;
  }

  const maxX = Math.max(...canvas.items.map((item) => item.position.x));
  const minX = Math.min(...canvas.items.map((item) => item.position.x));
  const maxY = Math.max(...canvas.items.map((item) => item.position.y));
  const minY = Math.min(...canvas.items.map((item) => item.position.y));

  const topLeft: Vec2.Vec2 = { x: minX, y: minY };

  const width = maxX - minX + ITEM_SIZE;
  const height = maxY - minY + ITEM_SIZE;

  const dim = Math.max(width, height);
  const scale = Math.min(MAX_DIM / dim, 1);

  const toAbsolutePosition = (pos: Vec2.Vec2) => {
    return Vec2.subtract(pos, topLeft);
  };

  const miniMapOrigin = Vec2.add(topLeft, origin);

  return (
    <div
      style={{
        width,
        height,
        transform: `scale(${scale})`,
        transformOrigin: "bottom right",
        borderWidth: 32,
      }}
      className=" fixed bottom-10 right-10 z-50  bg-white overflow-hidden"
    >
      <div
        className="absolute bg-gray-200"
        style={{
          left: -miniMapOrigin.x,
          top: -miniMapOrigin.y,
          width: 1600,
          height: 900,
        }}
      ></div>
      {canvas.items.map((item) => {
        const { x, y } = toAbsolutePosition(item.position);

        return (
          <div
            key={item.id}
            style={{
              left: x,
              top: y,
            }}
            className="absolute"
          >
            <WithNoteId canvasItemId={item.id} />
          </div>
        );
      })}
    </div>
  );
}

function WithNoteId({ canvasItemId }: { canvasItemId: Id<"canvasItems"> }) {
  const canvasItem = useQuery(api.canvasItems.get, { id: canvasItemId });
  if (!canvasItem) return null;
  return <ItemTree noteId={canvasItem.noteId} canvasItemId={canvasItemId} />;
}

function ItemTree({
  noteId,
  canvasItemId,
}: {
  noteId: Id<"notes">;
  canvasItemId: Id<"canvasItems">;
}) {
  const note = useQuery(api.notes.get, { noteId });
  const noteUIState = useQuery(api.noteUIStates.get, { noteId, canvasItemId });
  const children = useQuery(api.notes.getChildren, { noteId });

  if (!note || !children) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="w-[300px] h-[100px] border-4 bg-gray-800" />
      <div className="pl-8">
        {noteUIState?.collapsed
          ? null
          : children.map((child) => (
              <ItemTree
                key={child._id}
                noteId={child._id}
                canvasItemId={canvasItemId}
              />
            ))}
      </div>
    </div>
  );
}
