import { NoteTree } from "../components/NoteTree";
import * as Tree from "../lib/Tree";

export default function NoteTreeShowCase() {
  const sampleTree: Tree.SimpleTree<string, string> = {
    id: "root",
    content: "Root note",
    children: [
      {
        id: "child1",
        content: "Child note 1",
        children: [
          {
            id: "grandchild2",
            content: "Grandchild note 2",
            children: [],
          },
        ],
      },
      {
        id: "child2",
        content: "Child note 2",
        children: [
          {
            id: "grandchild1",
            content: "Grandchild note 1",
            children: [],
          },
        ],
      },
    ],
  };

  return <NoteTree tree={Tree.fromSimpleTree(sampleTree)} />;
}
