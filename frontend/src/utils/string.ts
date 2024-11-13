export function insertAt(outer: string, inner: string, position: number) {
  return outer.slice(0, position) + inner + outer.slice(position);
}
