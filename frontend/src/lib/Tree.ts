export interface Tree<id, content> {
  root: id;
  nodes: Map<id, TreeNode<id, content>>;
}

export interface TreeNode<id, content> {
  content: content;
  children: id[];
}

export interface SimpleTree<id, content> {
  id: id;
  content: content;
  children: SimpleTree<id, content>[];
}

export function fromSimpleTree<id, content>(
  simpleTree: SimpleTree<id, content>
): Tree<id, content> {
  function traverse(
    tree: SimpleTree<id, content>,
    acc: Map<id, TreeNode<id, content>>
  ): Map<id, TreeNode<id, content>> {
    const newAcc = acc.set(tree.id, {
      content: tree.content,
      children: tree.children.map((child) => child.id),
    });

    return tree.children.reduce((map, child) => traverse(child, map), newAcc);
  }

  return {
    root: simpleTree.id,
    nodes: traverse(simpleTree, new Map()),
  };
}

export function map<A, B, id>(tree: Tree<id, A>, f: (a: A) => B): Tree<id, B> {
  return {
    root: tree.root,
    nodes: new Map(
      Array.from(tree.nodes.entries()).map(([id, node]) => [
        id,
        {
          content: f(node.content),
          children: node.children,
        },
      ])
    ),
  };
}

export function singleton<id, content>(
  id: id,
  content: content
): Tree<id, content> {
  return {
    root: id,
    nodes: new Map([[id, { content, children: [] }]]),
  };
}
