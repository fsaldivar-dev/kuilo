/**
 * Columns layout extension — 2 or 3 side-by-side columns.
 *
 * Structure: columns > column > (block content)
 */

import { Node, mergeAttributes } from "@tiptap/core";

export const Columns = Node.create({
  name: "columns",
  group: "block",
  content: "column{2,3}",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      count: { default: 2 },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="columns"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, {
      "data-type": "columns",
      class: `columns-layout cols-${HTMLAttributes["data-columns"] || 2}`,
    }), 0];
  },

  addCommands() {
    return {
      insertColumns: (count = 2) => ({ commands }) => {
        const cols = Array.from({ length: count }, () => ({
          type: "column",
          content: [{ type: "paragraph" }],
        }));
        return commands.insertContent({ type: this.name, attrs: { count }, content: cols });
      },
    };
  },
});

export const Column = Node.create({
  name: "column",
  group: "",
  content: "block+",
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "column", class: "column-item" }), 0];
  },
});
