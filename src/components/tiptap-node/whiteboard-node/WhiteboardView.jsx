/**
 * Whiteboard block — Excalidraw embedded.
 * Click opens fullscreen editor. Preview shows static SVG.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NodeViewWrapper } from "@tiptap/react";
import DOMPurify from "dompurify";
import { X } from "lucide-react";
import "./whiteboard-node.scss";

function safeParse(val) {
  try { return typeof val === "string" ? JSON.parse(val) : val; }
  catch { return { elements: [], appState: {} }; }
}

export function WhiteboardView({ node, updateAttributes }) {
  const data = safeParse(node.attrs.data);
  const [editorOpen, setEditorOpen] = useState(false);
  const [Excalidraw, setExcalidraw] = useState(null);
  const [exportToSvg, setExportToSvg] = useState(null);
  const [svgPreview, setSvgPreview] = useState(null);
  const excalidrawRef = useRef(null);

  // Lazy-load Excalidraw (heavy module) + configure asset path
  useEffect(() => {
    // Excalidraw needs assets (fonts, icons) — use CDN for Electron compatibility
    window.EXCALIDRAW_ASSET_PATH = "https://unpkg.com/@excalidraw/excalidraw/dist/excalidraw-assets/";

    import("@excalidraw/excalidraw").then((mod) => {
      setExcalidraw(() => mod.Excalidraw);
      setExportToSvg(() => mod.exportToSvg);
    });
  }, []);

  // Generate SVG preview when data changes
  useEffect(() => {
    if (!exportToSvg || !data.elements?.length) { setSvgPreview(null); return; }
    exportToSvg({
      elements: data.elements,
      appState: { ...data.appState, exportWithDarkMode: document.documentElement.classList.contains("dark") },
      files: null,
    }).then((svg) => {
      setSvgPreview(svg.outerHTML);
    }).catch(() => setSvgPreview(null));
  }, [data, exportToSvg]);

  const handleSave = useCallback(() => {
    if (excalidrawRef.current) {
      const elements = excalidrawRef.current.getSceneElements();
      const appState = excalidrawRef.current.getAppState();
      updateAttributes({
        data: JSON.stringify({
          elements,
          appState: { viewBackgroundColor: appState.viewBackgroundColor },
        }),
      });
    }
    setEditorOpen(false);
  }, [updateAttributes]);

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <NodeViewWrapper className="whiteboard-block" contentEditable={false}>
      {/* Preview */}
      <div className="whiteboard-preview" onClick={() => setEditorOpen(true)}>
        {svgPreview ? (
          <div className="whiteboard-svg" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(svgPreview, { USE_PROFILES: { svg: true } }) }} />
        ) : (
          <div className="whiteboard-empty">
            <span>Click para abrir whiteboard</span>
          </div>
        )}
      </div>

      {/* Fullscreen editor */}
      {editorOpen && Excalidraw && createPortal(
        <div className="whiteboard-overlay">
          <div className="whiteboard-editor" data-theme={isDark ? "dark" : "light"}>
            <div className="whiteboard-topbar">
              <span className="whiteboard-title">Whiteboard</span>
              <div className="whiteboard-actions">
                <button className="wb-btn primary" onClick={handleSave}>Guardar</button>
                <button className="wb-btn" onClick={() => setEditorOpen(false)}><X size={16} /></button>
              </div>
            </div>
            <div className="whiteboard-canvas">
              <Excalidraw
                ref={excalidrawRef}
                initialData={{ elements: data.elements || [], appState: data.appState || {} }}
                theme={isDark ? "dark" : "light"}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </NodeViewWrapper>
  );
}
