import { Node, mergeAttributes } from "@tiptap/core";

const DEFAULT_BOARD = JSON.stringify({
  columns: [
    { id: "todo", title: "Por hacer", cards: [{ id: "c1", title: "Nueva tarea", color: "" }] },
    { id: "doing", title: "En progreso", cards: [] },
    { id: "done", title: "Hecho", cards: [] },
  ],
});

export const KanbanBlock = Node.create({
  name: "kanbanBlock",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return { board: { default: DEFAULT_BOARD } };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="kanban"]', getAttrs: (el) => ({ board: el.getAttribute("data-board") || DEFAULT_BOARD }) }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "kanban", "data-board": node.attrs.board })];
  },

  addCommands() {
    return {
      insertKanban: () => ({ commands }) => commands.insertContent({ type: this.name, attrs: { board: DEFAULT_BOARD } }),
    };
  },
});
