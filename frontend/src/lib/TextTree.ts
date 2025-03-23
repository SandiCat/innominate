import { P, match } from "ts-pattern";

export type TextTree = string | { shouldIndent: boolean; children: TextTree[] };

export function indent(children: TextTree[]): TextTree {
  return { shouldIndent: true, children };
}

export function spread(children: TextTree[]): TextTree {
  return { shouldIndent: false, children };
}

export function render(tree: TextTree): string {
  function rec(tree: TextTree, indent: number): string {
    return match(tree)
      .with(P.string, (s) => " ".repeat(indent) + s)
      .with(
        { shouldIndent: P.boolean, children: P.array() },
        ({ children, shouldIndent }) => {
          const nextIndent = shouldIndent ? indent + 1 : indent;
          return children.map((c) => rec(c, nextIndent)).join("\n");
        }
      )
      .exhaustive();
  }
  return rec(tree, 0);
}
