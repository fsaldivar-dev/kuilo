import { useState } from "react";
import { X, Plus, FileText } from "lucide-react";

export function InitiativeModal({ workflow, pages, onAddCard, onClose }) {
  const [selectedInit, setSelectedInit] = useState(workflow.initiatives[0]?.id || "");
  const [selectedStage, setSelectedStage] = useState(workflow.stages[0]?.id || "");
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const stage = workflow.stages.find((s) => s.id === selectedStage);
  const suggestedTypes = stage?.docTypes || [];

  const handleAdd = () => {
    if (!selectedInit || !selectedStage || !title.trim()) return;
    const docRef = selectedDoc ? { packageName: selectedDoc.packageName, pagePath: selectedDoc.pagePath } : null;
    onAddCard(selectedInit, selectedStage, docRef, title.trim(), docType || "Doc");
    setTitle("");
    setDocType("");
    setSelectedDoc(null);
  };

  return (
    <div className="connectors-overlay" onClick={onClose}>
      <div className="wf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wf-modal-header">
          <h3>Agregar card al workflow</h3>
          <button className="history-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="wf-modal-body">
          <label className="wf-label">Iniciativa</label>
          <select className="wf-select" value={selectedInit} onChange={(e) => setSelectedInit(e.target.value)}>
            {workflow.initiatives.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
          </select>

          <label className="wf-label">Etapa</label>
          <select className="wf-select" value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)}>
            {workflow.stages.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>

          {suggestedTypes.length > 0 && (
            <div className="wf-suggested-types">
              {suggestedTypes.map((dt) => (
                <button
                  key={dt}
                  className={`wf-type-btn ${docType === dt ? "active" : ""}`}
                  onClick={() => { setDocType(dt); if (!title) setTitle(dt); }}
                >
                  {dt}
                </button>
              ))}
            </div>
          )}

          <label className="wf-label">Título</label>
          <input
            className="wf-input"
            type="text"
            placeholder="Nombre del documento..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          />

          <label className="wf-label">Vincular documento existente (opcional)</label>
          <div className="wf-doc-list">
            {pages.map((p) => (
              <button
                key={`${p.packageName}/${p.pagePath}`}
                className={`wf-doc-item ${selectedDoc?.pagePath === p.pagePath ? "active" : ""}`}
                onClick={() => {
                  setSelectedDoc(p);
                  if (!title) setTitle(p.title);
                }}
              >
                <FileText size={11} />
                <span>{p.title}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="wf-modal-footer">
          <button className="wf-cancel" onClick={onClose}>Cancelar</button>
          <button className="wf-submit" onClick={handleAdd} disabled={!title.trim() || !selectedInit}>
            <Plus size={13} /> Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
