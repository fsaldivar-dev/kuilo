/**
 * Callout / Admonition block — NOTE, TIP, WARNING, CAUTION, IMPORTANT
 * Compatible with GitHub-flavored markdown: > [!NOTE]
 */

import { Node, mergeAttributes } from "@tiptap/core";

export const CALLOUT_TYPES = [
  { id: "note",      label: "Note",      icon: "ℹ️", color: "#0071e3" },
  { id: "tip",       label: "Tip",       icon: "💡", color: "#34c759" },
  { id: "important", label: "Important", icon: "❗", color: "#af52de" },
  { id: "warning",   label: "Warning",   icon: "⚠️", color: "#ff9500" },
  { id: "caution",   label: "Caution",   icon: "🔴", color: "#ff3b30" },
];

export const CalloutNode = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      type: { default: "note" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "callout",
        "data-callout": node.attrs.type,
        class: `callout callout-${node.attrs.type}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertCallout: (type = "note") => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { type },
          content: [{ type: "paragraph", content: [] }],
        });
      },
      toggleCalloutType: (type) => ({ commands, state }) => {
        const { from } = state.selection;
        const node = state.doc.resolve(from).node(1);
        if (node?.type.name !== "callout") return false;
        return commands.updateAttributes("callout", { type });
      },
    };
  },
});
