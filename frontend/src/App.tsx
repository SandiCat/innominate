import { useState, MouseEvent, useEffect } from "react";
import * as Vec2 from "./lib/Vec2";
import { match } from "ts-pattern";
import { Id } from "../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ReadOnlyNote } from "./components/Note";
import { CanvasItem } from "./types";
import { NoteTree } from "./components/NoteTree";
import { MiniMap } from "./components/MiniMap";
import { isDirectClick, useWindowDimensions } from "./lib/utils";
import { Map } from "immutable";

type ItemDragged =
  | { type: "canvas-item"; canvasItemId: Id<"canvasItems"> }
  | { type: "search-item"; noteId: Id<"notes"> };

type DragState =
  | { type: "idle" }
  | {
      type: "dragging-canvas";
      startMousePos: Vec2.Vec2;
      startOrigin: Vec2.Vec2;
      tempOrigin: Vec2.Vec2;
    }
  | {
      type: "dragging-item";
      item: ItemDragged;
      position: Vec2.Vec2;
      offset: Vec2.Vec2;
    };

interface PositionedProps {
  position: Vec2.Vec2;
  children: React.ReactNode;
}

function Positioned({ position, children }: PositionedProps) {
  return (
    <div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {children}
    </div>
  );
}

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
    <Positioned position={position}>
      <NoteTree
        rootNodeId={noteId}
        canvasItemId={id}
        onDragStart={onDragStart}
      />
    </Positioned>
  );
}

function screenToCanvas(
  screenPos: Vec2.Vec2,
  origin: Vec2.Vec2,
  zoom: number,
  zoomCenter: Vec2.Vec2
): Vec2.Vec2 {
  const K = Vec2.add(origin, Vec2.scale(zoomCenter, 1 - zoom));
  return Vec2.scale(Vec2.subtract(screenPos, K), 1 / zoom);
}

function canvasToScreen(
  canvasPos: Vec2.Vec2,
  origin: Vec2.Vec2,
  zoom: number,
  zoomCenter: Vec2.Vec2
): Vec2.Vec2 {
  const K = Vec2.add(origin, Vec2.scale(zoomCenter, 1 - zoom));
  return Vec2.add(Vec2.scale(canvasPos, zoom), K);
}

function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  return (
    <input
      type="search"
      placeholder="Search notes..."
      className="w-full px-4 py-2 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
      onChange={(e) => onSearch(e.target.value)}
    />
  );
}

interface NoteSearchResult {
  _id: Id<"notes">;
}

function SearchDrawer({
  searchResults,
  onDragStart,
}: {
  searchResults: NoteSearchResult[] | undefined;
  onDragStart: (e: MouseEvent, noteId: Id<"notes">) => void;
}) {
  return (
    <div className="mt-2 bg-white/35 backdrop-blur-sm rounded-lg shadow-lg p-4 overflow-y-auto">
      <div className="space-y-4">
        {searchResults?.map((note) => (
          <div key={note._id} onMouseDown={(e) => onDragStart(e, note._id)}>
            <ReadOnlyNote noteId={note._id} />
          </div>
        ))}
      </div>
    </div>
  );
}

const SEARCH_DRAG_OFFSET: Vec2.Vec2 = { x: -50, y: 0 };

export function App({ userId }: { userId: Id<"users"> }) {
  const [dragState, setDragState] = useState<DragState>({ type: "idle" });
  const [posCache, setPosCache] =
    useState<Map<Id<"canvasItems">, Vec2.Vec2>>(Map());
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = useQuery(api.notes.search, {
    query: searchQuery,
    userId,
  });
  const { width, height } = useWindowDimensions();

  const createNoteOnCanvas = useMutation(api.canvasItems.createNoteOnCanvas);
  const addNoteToCanvas = useMutation(api.canvasItems.addNoteToCanvas);
  const setPosition = useMutation(api.canvasItems.setPosition);
  const setCanvasOrigin = useMutation(api.canvases.setCanvasOrigin);
  const createCanvas = useMutation(api.canvases.createCanvas);
  const canvas = useQuery(api.canvases.getCanvasForUser, {
    userId,
  });

  const [originCache, setOriginCache] = useState<Vec2.Vec2 | null>(null);

  // create the canvas if it does not exist
  useEffect(() => {
    async function createCanvasIfNeeded() {
      if (canvas === null) {
        await createCanvas({ userId });
      }
    }

    createCanvasIfNeeded();
  }, [canvas, createCanvas, userId]);

  if (canvas === undefined) {
    return <div className="p-4">Loading canvas...</div>;
  }
  if (canvas === null) {
    return <div className="p-4">Creating canvas...</div>;
  }

  const canvasOrigin =
    dragState.type === "dragging-canvas"
      ? dragState.tempOrigin
      : originCache ?? canvas.origin;

  const zoomScale = `scale(${zoom})`;
  const originTranslate = `translate(${canvasOrigin.x}px, ${canvasOrigin.y}px)`;
  const cameraTransform = `${originTranslate} ${zoomScale}`;
  const screenVector = { x: width / 2, y: height / 2 };
  const zoomCenter = Vec2.subtract(screenVector, canvasOrigin);
  const transformOrigin = `${zoomCenter.x}px ${zoomCenter.y}px`;

  const canvasItemPos = (canvasItem: CanvasItem): Vec2.Vec2 => {
    if (
      dragState.type === "dragging-item" &&
      dragState.item.type === "canvas-item" &&
      dragState.item.canvasItemId === canvasItem.id
    ) {
      return dragState.position;
    }

    const cachedPos = posCache.get(canvasItem.id);
    if (cachedPos) return cachedPos;

    return canvasItem.position;
  };

  const handleCanvasMouseDown = (e: MouseEvent) => {
    if (!isDirectClick(e)) return;

    setDragState({
      type: "dragging-canvas",
      startMousePos: Vec2.fromMouseEvent(e),
      startOrigin: canvasOrigin,
      tempOrigin: canvasOrigin,
    });
  };

  const handleItemMouseDown = async (e: MouseEvent, canvasItem: CanvasItem) => {
    if (dragState.type !== "idle") throw new Error("Must be in idle state");

    const mousePos = Vec2.fromMouseEvent(e);
    const offset = Vec2.subtract(
      canvasToScreen(canvasItem.position, canvasOrigin, zoom, zoomCenter),
      mousePos
    );

    setDragState({
      type: "dragging-item",
      item: { type: "canvas-item", canvasItemId: canvasItem.id },
      position: canvasItem.position,
      offset,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    const mousePos = Vec2.fromMouseEvent(e);

    match(dragState)
      .with({ type: "idle" }, () => {})
      .with({ type: "dragging-canvas" }, (state) => {
        const delta = Vec2.scale(
          Vec2.subtract(mousePos, state.startMousePos),
          1 / zoom
        );

        const newOrigin = Vec2.add(state.startOrigin, delta);
        setDragState({
          ...state,
          tempOrigin: newOrigin,
        });
      })
      .with({ type: "dragging-item" }, (state) => {
        const newPosition = screenToCanvas(
          Vec2.add(mousePos, state.offset),
          canvasOrigin,
          zoom,
          zoomCenter
        );
        setDragState({
          ...state,
          position: newPosition,
        });
      })
      .exhaustive();
  };

  const handleMouseUp = async (e: MouseEvent) => {
    if (dragState.type === "dragging-item") {
      await match(dragState.item)
        .with({ type: "canvas-item" }, async (item) => {
          setPosCache(posCache.set(item.canvasItemId, dragState.position));

          setPosition({
            id: item.canvasItemId,
            position: dragState.position,
          }).then(() => {
            setPosCache(posCache.delete(item.canvasItemId));
          });
        })
        .with({ type: "search-item" }, async (item) => {
          await addNoteToCanvas({
            canvasId: canvas.id,
            position: dragState.position,
            noteId: item.noteId,
          });
        })
        .exhaustive();
    } else if (dragState.type === "dragging-canvas") {
      if (!isDirectClick(e))
        throw new Error("Canvas drag not finished on canvas");

      setOriginCache(dragState.tempOrigin);
      setCanvasOrigin({
        canvasId: canvas.id,
        origin: dragState.tempOrigin,
      }).then(() => {
        setOriginCache(null);
      });
    }

    setDragState({ type: "idle" });
  };

  const handleDoubleClick = async (e: MouseEvent) => {
    if (!isDirectClick(e)) return;

    const mousePos = Vec2.fromMouseEvent(e);
    const canvasPos = screenToCanvas(mousePos, canvasOrigin, zoom, zoomCenter);

    await createNoteOnCanvas({ canvasId: canvas.id, position: canvasPos });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleDrawerDragStart = (e: MouseEvent, noteId: Id<"notes">) => {
    const mousePos = Vec2.fromMouseEvent(e);
    const canvasPos = screenToCanvas(mousePos, canvasOrigin, zoom, zoomCenter);

    setDragState({
      type: "dragging-item",
      item: { type: "search-item", noteId },
      position: canvasPos,
      offset: SEARCH_DRAG_OFFSET,
    });
  };

  const handleZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(zoom * zoomFactor);
  };

  return (
    <div
      className="w-screen h-screen overflow-hidden bg-blue-50 relative"
      onWheel={handleZoom}
    >
      {/* <div
        className="bg-red-400 w-5 h-5 absolute z-50"
        style={{ top: screenVector.y, left: screenVector.x }}
      ></div> */}
      <MiniMap canvasId={canvas.id} origin={canvasOrigin} />
      <div className="fixed top-4 right-4 w-80 z-10 flex flex-col">
        <SearchBar onSearch={handleSearch} />
        {searchQuery !== "" && (
          <SearchDrawer
            searchResults={searchResults}
            onDragStart={handleDrawerDragStart}
          />
        )}
      </div>
      <div
        className="w-screen h-screen overflow-hidden"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        <div
          style={{
            transform: cameraTransform,
            transformOrigin: transformOrigin,
          }}
        >
          {canvas.items.map((canvasItem) => (
            <CanvasItemComponent
              key={canvasItem.id}
              id={canvasItem.id}
              position={canvasItemPos(canvasItem)}
              onDragStart={(e) => handleItemMouseDown(e, canvasItem)}
            />
          ))}
          {dragState.type === "dragging-item" &&
            dragState.item.type === "search-item" && (
              <Positioned position={dragState.position}>
                <ReadOnlyNote noteId={dragState.item.noteId} />
              </Positioned>
            )}
        </div>
      </div>
    </div>
  );
}
