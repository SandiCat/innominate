import React from 'react';

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return {
    x: a.x + b.x,
    y: a.y + b.y
  };
}

export function subtract(a: Vec2, b: Vec2): Vec2 {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}

export function scale(a: Vec2, scalar: number): Vec2 {
  return {
    x: a.x * scalar,
    y: a.y * scalar
  };
} 

export function fromMouseEvent(e: React.MouseEvent): Vec2 {
  return {
    x: e.clientX,
    y: e.clientY
  };
}
