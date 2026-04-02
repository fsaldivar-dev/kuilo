import { useRef } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";

export function RenameModal({ vault }) {
  const modalRef = useRef(null);
  useFocusTrap(modalRef, !!vault.renameTarget);

  if (!vault.renameTarget) return null;

  return (
    <div className="connectors-overlay" onClick={() => vault.setRenameTarget(null)}>
      <div className="rename-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <h3>Renombrar página</h3>
        <input
          type="text"
          className="rename-input"
          value={vault.renameDraft}
          onChange={(e) => vault.setRenameDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") vault.confirmRename(); if (e.key === "Escape") vault.setRenameTarget(null); }}
          autoFocus
          aria-label="Nuevo nombre de la página"
        />
        <div className="rename-actions">
          <button className="rename-cancel" onClick={() => vault.setRenameTarget(null)}>Cancelar</button>
          <button className="rename-confirm" onClick={vault.confirmRename}>Renombrar</button>
        </div>
      </div>
    </div>
  );
}
