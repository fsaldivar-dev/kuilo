import { Plug, X } from "lucide-react";

export function ConnectorsModal({ connectors, backup }) {
  if (!connectors.connectorsOpen) return null;

  return (
    <div className="connectors-overlay" onClick={() => connectors.setConnectorsOpen(false)}>
      <div className="connectors-modal" onClick={(e) => e.stopPropagation()}>
        <div className="connectors-header">
          <h2><Plug size={18} /> Conectores AI</h2>
          <button className="connectors-close" onClick={() => connectors.setConnectorsOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {connectors.mcpInfo && (
          <div className="connectors-body">
            <div className="connectors-info">
              <div className="connectors-info-row">
                <span className="connectors-label">Vault</span>
                <code className={`connectors-value ${connectors.mcpInfo.vaultExists ? "" : "error"}`}>
                  {connectors.mcpInfo.vaultPath}
                </code>
                {!connectors.mcpInfo.vaultExists && <span className="connectors-error-badge">No existe</span>}
              </div>
              <div className="connectors-info-row">
                <span className="connectors-label">MCP Script</span>
                <code className={`connectors-value ${connectors.mcpInfo.scriptExists ? "" : "error"}`}>
                  {connectors.mcpInfo.scriptPath}
                </code>
                {!connectors.mcpInfo.scriptExists && <span className="connectors-error-badge">No encontrado</span>}
              </div>
            </div>

            <h3>Conectar con</h3>
            <div className="connectors-list">
              {connectors.mcpInfo.targets.map((t) => (
                <div className={`connector-item ${!t.installed ? "not-installed" : ""}`} key={t.name}>
                  <div className="connector-info">
                    <span className="connector-name">{t.label}</span>
                    {!t.installed ? (
                      <span className="connector-status off">No detectado</span>
                    ) : t.connected && t.configValid ? (
                      <span className="connector-status on">● Config escrita — reinicia la app para activar</span>
                    ) : t.connected && t.error ? (
                      <span className="connector-status warn">⚠ {t.error}</span>
                    ) : (
                      <span className="connector-status off">○ No conectado</span>
                    )}
                  </div>
                  {t.installed && (
                    <button
                      className={`connector-action ${t.connected ? "disconnect" : "connect"}`}
                      onClick={() => t.connected ? connectors.disconnectTarget(t.name) : connectors.connectTarget(t.name)}
                      disabled={!connectors.mcpInfo.scriptExists || !connectors.mcpInfo.vaultExists}
                    >
                      {t.connected ? "Desconectar" : "Conectar"}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="connectors-hint">
              Al conectar, se escribe la config MCP en el archivo de cada herramienta.
              Reinicia la herramienta para que tome efecto.
            </p>

            <h3>Git Backup</h3>
            {backup.backupStatus && (
              <div className="connectors-info" style={{ marginBottom: 12 }}>
                <div className="connectors-info-row">
                  <span className="connectors-label">Estado</span>
                  <span className={`connector-status ${backup.backupStatus.hasChanges ? "warn" : "on"}`}>
                    {backup.backupStatus.hasChanges
                      ? `${backup.backupStatus.files?.length || 0} archivos sin backup`
                      : "● Todo respaldado"}
                  </span>
                </div>
                {backup.backupStatus.log?.[0] && (
                  <div className="connectors-info-row">
                    <span className="connectors-label">Ultimo</span>
                    <code className="connectors-value">
                      {backup.backupStatus.log[0].message} — {new Date(backup.backupStatus.log[0].date).toLocaleString("es-MX")}
                    </code>
                  </div>
                )}
              </div>
            )}
            <button className="connector-action connect" onClick={backup.doBackupCommit} style={{ marginBottom: 10, width: "100%" }}>
              Hacer backup ahora
            </button>

            <div className="connectors-info" style={{ marginBottom: 8 }}>
              <div className="connectors-info-row">
                <span className="connectors-label">Remote URL</span>
                <input
                  className="rename-input"
                  placeholder="https://github.com/user/repo.git"
                  value={backup.backupRemoteUrl}
                  onChange={(e) => backup.setBackupRemoteUrl(e.target.value)}
                  style={{ fontSize: 12 }}
                />
              </div>
              <div className="connectors-info-row">
                <span className="connectors-label">Token</span>
                <input
                  className="rename-input"
                  type="password"
                  placeholder="ghp_xxx o token personal"
                  value={backup.backupToken}
                  onChange={(e) => backup.setBackupToken(e.target.value)}
                  style={{ fontSize: 12 }}
                />
              </div>
            </div>
            <button
              className="connector-action connect"
              onClick={backup.doBackupPush}
              disabled={!backup.backupRemoteUrl || !backup.backupToken}
              style={{ width: "100%" }}
            >
              Push a remoto
            </button>
            <p className="connectors-hint">
              Funciona con GitHub, GitLab, Bitbucket, o cualquier repo Git.
              El token es un Personal Access Token con permisos de escritura.
            </p>
          </div>
        )}

        {!connectors.mcpInfo && (
          <div className="connectors-body">
            <p className="connectors-hint">Ejecuta la app desde Electron para usar conectores.</p>
          </div>
        )}
      </div>
    </div>
  );
}
