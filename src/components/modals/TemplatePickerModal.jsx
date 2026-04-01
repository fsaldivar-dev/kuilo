import { useState } from "react";
import { X } from "lucide-react";
import { PAGE_TEMPLATES } from "@/lib/page-templates";

export function TemplatePickerModal({ packageName, parentPath, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? PAGE_TEMPLATES.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase())
        || t.description.toLowerCase().includes(search.toLowerCase())
      )
    : PAGE_TEMPLATES;

  return (
    <div className="connectors-overlay" onClick={onClose}>
      <div className="template-picker" onClick={(e) => e.stopPropagation()}>
        <div className="template-picker-header">
          <h3>Nueva página</h3>
          <button className="history-close" onClick={onClose}>
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
        />
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
