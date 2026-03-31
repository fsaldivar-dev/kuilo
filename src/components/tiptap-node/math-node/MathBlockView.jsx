/**
 * React NodeView for KaTeX math blocks.
 * Selected → editable LaTeX. Unselected → rendered math.
 */

import { useEffect, useRef, useState } from "react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import katex from "katex";
import "katex/dist/katex.min.css";
import "./math-node.scss";

export function MathBlockView({ node, selected }) {
  const latex = node.textContent || "";
  const previewRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!previewRef.current || !latex.trim()) return;
    try {
      previewRef.current.innerHTML = "";
      katex.render(latex, previewRef.current, {
        displayMode: true,
        throwOnError: true,
        output: "htmlAndMathml",
      });
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [latex]);

  return (
    <NodeViewWrapper className="math-block-wrapper">
      {/* LaTeX source — visible when selected */}
      <pre className={`math-source ${selected ? "" : "hidden"}`}>
        <NodeViewContent as="code" />
      </pre>

      {/* Rendered preview — visible when not selected or always below source */}
      <div
        ref={previewRef}
        className={`math-preview ${!latex.trim() ? "empty" : ""}`}
        contentEditable={false}
      >
        {!latex.trim() && (
          <span className="math-placeholder">Escribe una ecuación LaTeX…</span>
        )}
      </div>

      {error && (
        <div className="math-error" contentEditable={false}>
          {error}
        </div>
      )}
    </NodeViewWrapper>
  );
}
