import { Link, X } from "lucide-react";

export function BacklinksPanel({ backlinks, onNavigate, onClose }) {
  return (
    <aside className="backlinks-panel">
      <div className="backlinks-header">
        <h3><Link size={13} /> Backlinks</h3>
        <button className="history-close" onClick={onClose} aria-label="Cerrar panel de backlinks">
          <X size={13} />
        </button>
      </div>
      <div className="backlinks-list">
        {backlinks.length === 0 ? (
          <p className="backlinks-empty">Ninguna otra página enlaza aquí.</p>
        ) : (
          backlinks.map((bl, i) => (
            <button
              key={i}
              className="backlink-item"
              onClick={() => onNavigate(bl)}
            >
              <span className="backlink-title">{bl.title}</span>
              <span className="backlink-pkg">{bl.packageName}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
