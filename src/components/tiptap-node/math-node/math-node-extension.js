/**
 * Math block extension — inline and block KaTeX equations.
 *
 * Block usage:  $$\sum_{i=0}^n i^2$$
 * Inline usage: $E = mc^2$
 */

import { Node, mergeAttributes } from "@tiptap/core";

export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  content: "text*",
  marks: "",
  code: true,
  defining: true,

  addAttributes() {
    return {
      latex: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="math-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "math-block", class: "math-block-wrapper" }), 0];
  },

  addCommands() {
    return {
      insertMathBlock: (attrs) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs,
          content: attrs?.latex ? [{ type: "text", text: attrs.latex }] : [],
        });
      },
    };
  },

  addInputRules() {
    return [];
  },
});
