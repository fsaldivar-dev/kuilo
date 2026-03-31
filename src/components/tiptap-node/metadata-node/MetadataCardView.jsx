/**
 * React NodeView for MetadataCard.
 * Renders typed fields: text inputs, selects, date pickers.
 */

import { useCallback } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import "./metadata-node.scss";

const STATUS_COLORS = {
  Draft:     "#ff9500",
  Review:    "#0071e3",
  Approved:  "#34c759",
  Rejected:  "#ff3b30",
  Proposed:  "#ff9500",
  Accepted:  "#34c759",
  Deprecated:"#8e8e93",
  "Must":    "#ff3b30",
  "Should":  "#ff9500",
  "Nice":    "#34c759",
  P0:        "#ff3b30",
  P1:        "#ff9500",
  P2:        "#0071e3",
  P3:        "#8e8e93",
};

function safeParseFields(val) {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val || "[]"); } catch { return []; }
}

export function MetadataCardView({ node, updateAttributes }) {
  const fields = safeParseFields(node.attrs.fields);

  const updateField = useCallback((index, value) => {
    const current = safeParseFields(node.attrs.fields);
    const next = [...current];
    next[index] = { ...next[index], value };
    updateAttributes({ fields: JSON.stringify(next) });
  }, [node.attrs.fields, updateAttributes]);

  return (
    <NodeViewWrapper className="metadata-card" contentEditable={false}>
      {fields.map((field, i) => (
        <div className="metadata-row" key={i}>
          <span className="metadata-key">{field.key}</span>
          <div className="metadata-value">
            {field.type === "select" ? (
              <select
                className="metadata-select"
                value={field.value || ""}
                onChange={(e) => updateField(i, e.target.value)}
                style={{ color: STATUS_COLORS[field.value] || undefined }}
              >
                {(field.options || []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === "date" ? (
              <input
                type="date"
                className="metadata-input metadata-date"
                value={field.value || ""}
                onChange={(e) => updateField(i, e.target.value)}
              />
            ) : (
              <input
                type="text"
                className="metadata-input"
                placeholder={field.placeholder || ""}
                value={field.value || ""}
                onChange={(e) => updateField(i, e.target.value)}
              />
            )}
          </div>
        </div>
      ))}
    </NodeViewWrapper>
  );
}
