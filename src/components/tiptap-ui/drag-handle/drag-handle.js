/**
 * Drag Handle — Sprint 1.3
 * Wraps @tiptap/extension-drag-handle for use in SimpleEditor.
 */

import { DragHandle } from "@tiptap/extension-drag-handle";

/**
 * Creates the DOM element used as the drag handle affordance.
 * Called on every block hover by the extension — must return a fresh element.
 */
export function createDragHandleElement() {
  const el = document.createElement("div");
  el.className = "drag-handle";
  el.draggable = true;
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="5.5" cy="4" r="1.25"/>
    <circle cx="5.5" cy="8" r="1.25"/>
    <circle cx="5.5" cy="12" r="1.25"/>
    <circle cx="10.5" cy="4" r="1.25"/>
    <circle cx="10.5" cy="8" r="1.25"/>
    <circle cx="10.5" cy="12" r="1.25"/>
  </svg>`;
  return el;
}

/**
 * Returns the configured DragHandle Tiptap extension.
 */
export function buildDragHandleExtension() {
  return DragHandle.configure({
    render() {
      return createDragHandleElement();
    },
  });
}
