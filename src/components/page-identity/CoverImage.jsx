/**
 * CoverImage — Sprint 2.2
 * Imagen de portada (o color sólido) encima del título del documento.
 */

import { useRef } from "react";
import "./CoverImage.scss";

const PRESET_COLORS = [
  "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#64748b",
  "#1e293b", "#f1f5f9",
];

export function CoverImage({ cover, onChange }) {
  const fileInputRef = useRef(null);

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      onChange({ type: "image", value: ev.target.result });
    reader.readAsDataURL(file);
  };

  const handleRemove = () => onChange(null);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="cover-wrapper">
      {/* Area de cobertura */}
      <div
        className={`cover-area ${cover ? "has-cover" : "empty"}`}
        style={
          cover?.type === "image"
            ? { backgroundImage: `url(${cover.value})` }
            : cover?.type === "color"
            ? { background: cover.value }
            : {}
        }
      >
        {/* Controles flotantes sobre la cobertura */}
        <div className="cover-controls">
          <button
            className="cover-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Subir imagen"
          >
            📷 Imagen
          </button>

          {/* Paleta de colores */}
          <div className="cover-colors">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className="cover-color-swatch"
                style={{ background: color }}
                onClick={() => onChange({ type: "color", value: color })}
                title={color}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>

          {cover && (
            <button className="cover-btn cover-btn-remove" onClick={handleRemove}>
              ✕ Quitar
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageFile}
      />
    </div>
  );
}
