/**
 * MetadataCard — structured key-value block with typed fields.
 * Field types: text, select, date
 */

import { Node, mergeAttributes } from "@tiptap/core";

export const MetadataCard = Node.create({
  name: "metadataCard",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      fields: { default: "[]" },
    };
  },

  parseHTML() {
    return [{
      tag: 'div[data-type="metadata-card"]',
      getAttrs: (el) => {
        try {
          const raw = el.getAttribute("data-fields") || "[]";
          JSON.parse(raw); // validate
          return { fields: raw };
        }
        catch { return { fields: [] }; }
      },
    }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, {
      "data-type": "metadata-card",
      "data-fields": typeof node.attrs.fields === "string" ? node.attrs.fields : JSON.stringify(node.attrs.fields),
    })];
  },

  addCommands() {
    return {
      insertMetadataCard: (fields) => ({ commands }) => {
        return commands.insertContent({ type: this.name, attrs: { fields } });
      },
    };
  },
});
