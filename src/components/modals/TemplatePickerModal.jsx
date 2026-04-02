import { useState, useRef } from "react";
import { X } from "lucide-react";
import { PAGE_TEMPLATES } from "@/lib/page-templates";
import { useFocusTrap } from "@/hooks/use-focus-trap";

const CATEGORIES = ["Todas", ...new Set(PAGE_TEMPLATES.map((t) => t.category).filter(Boolean))];

export function TemplatePickerModal({ packageName, parentPath, onSelect, onClose }) {
  const modalRef = useRef(null);
  useFocusTrap(modalRef, true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");

  const filtered = PAGE_TEMPLATES.filter((t) => {
    if (category !== "Todas" && t.category !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="connectors-overlay" onClick={onClose}>
      <div className="template-picker" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="template-picker-header">
          <h3>Nueva página</h3>
          <button className="history-close" onClick={onClose} aria-label="Cerrar">
            <X size={14} />
          </button>
        </div>
        <input
          type="text"
          className="template-search"
          placeholder="Buscar plantilla..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          aria-label="Buscar plantilla"
        />
        <div className="template-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`template-cat-pill ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="template-grid">
          {filtered.map((tpl) => (
            <button
              key={tpl.id}
              className="template-card"
              onClick={() => {
                onSelect(packageName, parentPath, tpl);
                onClose();
              }}
            >
              <span className="template-icon">{tpl.icon}</span>
              <span className="template-title">{tpl.title}</span>
              <span className="template-desc">{tpl.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
