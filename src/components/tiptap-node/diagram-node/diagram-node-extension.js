/**
 * Diagram block — visual flowchart editor with React Flow.
 * Stores diagram as Mermaid string. Edits via React Flow, exports as Mermaid.
 */

import { Node, mergeAttributes } from "@tiptap/core";

export const DiagramBlock = Node.create({
  name: "diagramBlock",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      mermaid:   { default: 'flowchart TD\n    A["Inicio"] --> B{"Decisión"}\n    B -->|"Sí"| C["Resultado"]\n    B -->|"No"| D["Fin"]' },
      direction: { default: "TD" },
    };
  },

  parseHTML() {
    return [{
      tag: 'div[data-type="diagram-block"]',
      getAttrs: (el) => ({
        mermaid: el.getAttribute("data-mermaid") || "",
        direction: el.getAttribute("data-direction") || "TD",
      }),
    }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, {
      "data-type": "diagram-block",
      "data-mermaid": node.attrs.mermaid,
      "data-direction": node.attrs.direction,
    })];
  },

  addCommands() {
    return {
      insertDiagram: (attrs = {}) => ({ commands }) => {
        return commands.insertContent({ type: this.name, attrs });
      },
    };
  },
});
