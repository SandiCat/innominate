type TextTree = string | TextTree[];

export function split(text: string): TextTree {
  return text.split("\n");
}

export function render(tree: TextTree): string {
  function rec(tree: TextTree, indent: number): string {
    if (typeof tree === "string") {
      return " ".repeat(indent) + tree;
    }
    return tree.map((t) => rec(t, indent + 1)).join("\n");
  }
  return rec(tree, 0);
}
