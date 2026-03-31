import { Node, mergeAttributes } from "@tiptap/core";

const DEFAULT_DATA = JSON.stringify({ elements: [], appState: {} });

export const WhiteboardBlock = Node.create({
  name: "whiteboardBlock",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return { data: { default: DEFAULT_DATA } };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="whiteboard"]', getAttrs: (el) => ({ data: el.getAttribute("data-whiteboard") || DEFAULT_DATA }) }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "whiteboard", "data-whiteboard": node.attrs.data })];
  },

  addCommands() {
    return {
      insertWhiteboard: () => ({ commands }) => commands.insertContent({ type: this.name }),
    };
  },
});
