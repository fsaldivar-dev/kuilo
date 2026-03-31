/**
 * Toggle Node — Sprint 1.4
 *
 * ToggleListNode  → bloque contenedor colapsable
 * ToggleSummaryNode → primera línea (título) del toggle, siempre visible
 *
 * Renderiza como:
 *   <div data-type="toggle-list" data-open="true">
 *     <div data-type="toggle-summary">...</div>
 *     <div data-type="toggle-content">
 *       <p>...</p>
 *     </div>
 *   </div>
 */

import { Node, mergeAttributes } from "@tiptap/core";

// ─── ToggleSummaryNode ────────────────────────────────────────────────────────

export const ToggleSummaryNode = Node.create({
  name: "toggleSummary",
  group: "toggleSummaryGroup",
  content: "inline*",
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="toggle-summary"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "toggle-summary" }), 0];
  },
});

// ─── ToggleListNode ───────────────────────────────────────────────────────────

export const ToggleListNode = Node.create({
  name: "toggleList",
  group: "block",
  content: "toggleSummary block+",
  defining: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (el) => el.getAttribute("data-open") === "true",
        renderHTML: (attrs) => ({ "data-open": attrs.open ? "true" : "false" }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="toggle-list"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "toggle-list" }),
      0,
    ];
  },

  // ── Commands ────────────────────────────────────────────────────────────────

  addCommands() {
    return {
      insertToggleList:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: "toggleList",
            attrs: { open: true },
            content: [
              { type: "toggleSummary", content: [] },
              { type: "paragraph", content: [] },
            ],
          });
        },

      toggleOpen:
        () =>
        ({ editor, commands, tr, dispatch }) => {
          const { selection } = editor.state;
          const { $from } = selection;

          // Walk up to find the toggleList node
          for (let depth = $from.depth; depth >= 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === "toggleList") {
              if (dispatch) {
                const pos = $from.before(depth);
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  open: !node.attrs.open,
                });
                dispatch(tr);
              }
              return true;
            }
          }
          return false;
        },
    };
  },

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────

  addKeyboardShortcuts() {
    return {
      // Mod+Enter en summary colapsa/expande
      "Mod-Enter": () => {
        if (this.editor.isActive("toggleList")) {
          return this.editor.commands.toggleOpen();
        }
        return false;
      },
    };
  },
});
