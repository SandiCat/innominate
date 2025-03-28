import { clsx, type ClassValue } from "clsx";
import React, { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isDirectClick(e: React.MouseEvent) {
  return e.target === e.currentTarget;
}

export const useWindowDimensions = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return dimensions;
};
export function mouseClickVsDrag(
  e: React.MouseEvent,
  onDragStart: () => void,
  onClick: () => void
) {
  if (e.button !== 0) return; // only handle left clicks

  const onMouseMove = () => {
    onDragStart();
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  const onMouseUp = () => {
    onClick();
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

export function passLog<T>(toLog: T): T {
  console.log(toLog);
  return toLog;
}
