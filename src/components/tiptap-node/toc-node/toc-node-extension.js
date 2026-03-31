/**
 * Table of Contents node — auto-generates from document headings.
 * Rendered as a React NodeView that reads the editor's content.
 */

import { Node, mergeAttributes } from "@tiptap/core";

export const TableOfContents = Node.create({
  name: "tableOfContents",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="toc"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "toc" })];
  },

  addCommands() {
    return {
      insertTableOfContents: () => ({ commands }) => {
        return commands.insertContent({ type: this.name });
      },
    };
  },
});
