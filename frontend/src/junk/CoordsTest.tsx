import { useState, useEffect } from "react";

export default function CoordsTest() {
    const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const MOVE_AMOUNT = 10;
            const SCALE_FACTOR = 0.1;

            setCamera(prev => {
                switch (e.key) {
                    case "ArrowLeft": return { ...prev, x: prev.x + MOVE_AMOUNT };
                    case "ArrowRight": return { ...prev, x: prev.x - MOVE_AMOUNT };
                    case "ArrowUp": return { ...prev, y: prev.y + MOVE_AMOUNT };
                    case "ArrowDown": return { ...prev, y: prev.y - MOVE_AMOUNT };
                    case "+": return { ...prev, scale: prev.scale + SCALE_FACTOR };
                    case "-": return { ...prev, scale: Math.max(0.1, prev.scale - SCALE_FACTOR) };
                    default: return prev;
                }
            });
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="w-screen h-screen bg-gray-100 overflow-hidden">
            <div className="fixed top-4 left-4 bg-white/80 p-2 rounded shadow">
                <pre>
                    camera: x:{camera.x.toFixed(0)}, y:{camera.y.toFixed(0)}, scale:{camera.scale.toFixed(2)}
                    {'\n'}mouse: x:{mousePos.x}, y:{mousePos.y}
                </pre>
            </div>
            <div
                style={{
                    transform: `scale(${camera.scale}) translate(${camera.x}px, ${camera.y}px)`,
                    transformOrigin: "top left",
                }}
            >
                <div className="absolute w-8 h-8 pointer-events-none" style={{
                    left: -4,
                    top: -4,
                    backgroundImage: 'radial-gradient(circle at center, black 1px, transparent 1px), linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)'
                }} />
                <div className="absolute w-32 h-32 bg-red-500" style={{ left: 100, top: 100 }} />
                <div className="absolute w-32 h-32 bg-blue-500" style={{ left: 300, top: 200 }} />
            </div>
        </div>
    );
}