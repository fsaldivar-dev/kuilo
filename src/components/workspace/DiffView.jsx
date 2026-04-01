import { X } from "lucide-react";
import { blockToText } from "@/lib/block-diff";

const STATUS_LABELS = {
  added: "Agregado",
  removed: "Eliminado",
  modified: "Modificado",
  equal: null,
};

function renderBlockContent(block) {
  const text = blockToText(block);
  if (!text && block.type) return `[${block.type}]`;
  return text;
}

export function DiffView({ entries, versionLabel, onClose }) {
  return (
    <div className="diff-view">
      <div className="diff-header">
        <span>Comparando con <strong>{versionLabel}</strong></span>
        <button className="diff-close" onClick={onClose}>
          <X size={14} /> Cerrar
        </button>
      </div>
      <div className="diff-body">
        {entries.map((entry, i) => (
          <div key={i} className={`diff-block diff-${entry.status}`}>
            {STATUS_LABELS[entry.status] && (
              <span className={`diff-badge diff-badge-${entry.status}`}>
                {STATUS_LABELS[entry.status]}
              </span>
            )}
            {entry.status === "modified" && entry.oldBlock && (
              <div className="diff-old-text">{renderBlockContent(entry.oldBlock)}</div>
            )}
            <div className={`diff-text ${entry.status === "removed" ? "diff-strikethrough" : ""}`}>
              {entry.block.type === "heading" && (
                <strong>{renderBlockContent(entry.block)}</strong>
              )}
              {entry.block.type !== "heading" && renderBlockContent(entry.block)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
