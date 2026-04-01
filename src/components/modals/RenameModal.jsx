export function RenameModal({ vault }) {
  if (!vault.renameTarget) return null;

  return (
    <div className="connectors-overlay" onClick={() => vault.setRenameTarget(null)}>
      <div className="rename-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Renombrar página</h3>
        <input
          type="text"
          className="rename-input"
          value={vault.renameDraft}
          onChange={(e) => vault.setRenameDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") vault.confirmRename(); if (e.key === "Escape") vault.setRenameTarget(null); }}
          autoFocus
        />
        <div className="rename-actions">
          <button className="rename-cancel" onClick={() => vault.setRenameTarget(null)}>Cancelar</button>
          <button className="rename-confirm" onClick={vault.confirmRename}>Renombrar</button>
        </div>
      </div>
    </div>
  );
}
