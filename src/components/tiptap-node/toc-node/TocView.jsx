/**
 * React NodeView for Table of Contents.
 * Reads all headings from the editor and renders a clickable index.
 */

import { useEffect, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import "./toc-node.scss";

export function TocView({ editor }) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    if (!editor) return;

    const extractHeadings = () => {
      const items = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          items.push({
            level: node.attrs.level,
            text: node.textContent,
            pos,
          });
        }
      });
      setHeadings(items);
    };

    extractHeadings();
    const currentEditor = editor;
    currentEditor.on("update", extractHeadings);
    return () => currentEditor.off("update", extractHeadings);
  }, [editor]);

  const scrollTo = (pos) => {
    if (!editor) return;
    const domNode = editor.view.domAtPos(pos + 1);
    const el = domNode.node instanceof HTMLElement ? domNode.node : domNode.node.parentElement;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    editor.chain().focus().setTextSelection(pos + 1).run();
  };

  return (
    <NodeViewWrapper className="toc-wrapper" contentEditable={false}>
      <div className="toc-title">Table of Contents</div>
      {headings.length === 0 ? (
        <div className="toc-empty">Sin headings en el documento</div>
      ) : (
        <ul className="toc-list">
          {headings.map((h, i) => (
            <li key={i} className={`toc-item toc-level-${h.level}`}>
              <button className="toc-link" onClick={() => scrollTo(h.pos)}>
                {h.text || "(vacío)"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </NodeViewWrapper>
  );
}
