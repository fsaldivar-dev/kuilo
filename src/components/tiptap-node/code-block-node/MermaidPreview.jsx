import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DOMPurify from "dompurify";
import mermaid from "mermaid";
import { sanitizeMermaidCode } from "@/lib/mermaid-utils";
import "./mermaid-preview.scss";

let mermaidReady = false;
let seq = 0;

function initMermaid(isDark) {
  if (mermaidReady) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? "dark" : "default",
    securityLevel: "loose",
    fontFamily: "Inter, system-ui, sans-serif",
  });
  mermaidReady = true;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  zoomIn:   "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm7-7h-5m-3 0v-3m0 3v3M21 21l-4.35-4.35",
  zoomOut:  "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm7-7H8M21 21l-4.35-4.35",
  reset:    "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8m0-5v5h5",
  expand:   "M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3",
  collapse: "M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3",
};

// ─── DiagramCanvas ────────────────────────────────────────────────────────────

function DiagramCanvas({ code, isDark, fullscreen = false, onExpand }) {
  const [svg,   setSvg]   = useState("");
  const [error, setError] = useState(null);
  const [zoom,  setZoom]  = useState(1);
  const [pan,   setPan]   = useState({ x: 0, y: 0 });

  const drag = useRef(null); // { startX, startY, panX, panY }

  // ── Render ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!code?.trim()) return;
    initMermaid(isDark);
    let cancelled = false;
    const id = `mm-${++seq}`;
    mermaid.render(id, sanitizeMermaidCode(code))
      .then(({ svg: out }) => {
        if (cancelled) return;
        setSvg(out);
        setError(null);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      })
      .catch((err) => {
        if (!cancelled) { setError(err?.message || "Syntax error"); setSvg(""); }
      });
    return () => { cancelled = true; };
  }, [code, isDark]);

  // ── Wheel zoom ──────────────────────────────────────────────────────────────
  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(4, Math.max(0.2, +(z + delta).toFixed(2))));
  };

  // ── Drag pan ────────────────────────────────────────────────────────────────
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    drag.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  };
  const onMouseMove = (e) => {
    if (!drag.current) return;
    setPan({
      x: drag.current.panX + e.clientX - drag.current.startX,
      y: drag.current.panY + e.clientY - drag.current.startY,
    });
  };
  const onMouseUp = () => { drag.current = null; };

  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  if (!code?.trim()) return null;

  return (
    <div
      className={`mermaid-diagram-area${fullscreen ? " is-fullscreen" : ""}`}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Floating controls */}
      <div className="mermaid-controls" contentEditable={false}>
        {onExpand && (
          <button className="mm-btn" onClick={onExpand} title="Fullscreen">
            <Icon d={ICONS.expand} />
          </button>
        )}
        <button className="mm-btn" onClick={() => setZoom((z) => Math.min(4, +(z + 0.2).toFixed(2)))} title="Zoom in">
          <Icon d={ICONS.zoomIn} />
        </button>
        <span className="mm-scale">{Math.round(zoom * 100)}%</span>
        <button className="mm-btn" onClick={() => setZoom((z) => Math.max(0.2, +(z - 0.2).toFixed(2)))} title="Zoom out">
          <Icon d={ICONS.zoomOut} />
        </button>
        <button className="mm-btn" onClick={reset} title="Reset">
          <Icon d={ICONS.reset} />
        </button>
      </div>

      {/* Diagram */}
      {error ? (
        <div className="mermaid-error" contentEditable={false}>
          <span>⚠</span><span>{error}</span>
        </div>
      ) : svg ? (
        <div
          className="mermaid-svg-area"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } }) }}
        />
      ) : (
        <div className="mermaid-loading" contentEditable={false}>Rendering…</div>
      )}
    </div>
  );
}

// ─── MermaidPreview ───────────────────────────────────────────────────────────

export function MermaidPreview({ code, isDark = false }) {
  const [fullscreen, setFullscreen] = useState(false);
  if (!code?.trim()) return null;

  return (
    <div className="mermaid-preview" contentEditable={false}>
      <DiagramCanvas code={code} isDark={isDark} onExpand={() => setFullscreen(true)} />

      {fullscreen && createPortal(
        <div className="mermaid-fullscreen-overlay" onClick={() => setFullscreen(false)}>
          <div className="mermaid-fullscreen-inner" onClick={(e) => e.stopPropagation()}>
            <button className="mm-btn mm-close-btn" onClick={() => setFullscreen(false)}>
              <Icon d={ICONS.collapse} size={16} />
            </button>
            <DiagramCanvas code={code} isDark={isDark} fullscreen />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
