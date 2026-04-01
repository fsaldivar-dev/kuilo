import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCode2,
  FileText,
  FolderOpen,
  FolderPlus,
  FolderTree,
  History,
  Pencil,
  Plug,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { PAGE_TEMPLATES } from "@/lib/page-templates";
import { exportMarkdown, exportHtml, exportPdf } from "@/lib/export-utils";
import { buildBookHtml, BOOK_CSS } from "@/lib/export-book";
import { blocksToMarkdown } from "@/lib/blocks-to-markdown";
import { ProjectWizard } from "@/components/project-wizard/ProjectWizard";
import { generateProject } from "@/lib/project-generator";
import { EmojiPicker } from "@/components/page-identity/EmojiPicker";
import { CoverImage } from "@/components/page-identity/CoverImage";
import { Breadcrumb } from "@/components/page-identity/Breadcrumb";
import { useEditorState } from "@/hooks/use-editor-state";
import { useVault } from "@/hooks/use-vault";
import { useBackup } from "@/hooks/use-backup";
import { useConnectors } from "@/hooks/use-connectors";
import { useSearch } from "@/hooks/use-search";

const api = window.notesApi;

// ─── App ─────────────────────────────────────────────────────────────

function App() {
  const editor = useEditorState();
  const vault = useVault(editor);
  const backup = useBackup(editor.setSaveState);
  const connectors = useConnectors(backup.refreshBackupStatus);
  const search = useSearch(vault.packages);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  // ── Export book ──
  const exportBook = async () => {
    if (!api?.exportBook || !vault.packages.length) return;
    editor.setSaveState("Preparando libro…");
    const bookHtml = await buildBookHtml(
      vault.packages,
      vault.vaultPath ? vault.vaultPath.split("/").pop() : "Documentación",
      (done, total, title) => editor.setSaveState(`Leyendo ${done}/${total}: ${title}`)
    );
    editor.setSaveState("Generando PDF…");
    const vaultName = vault.vaultPath ? vault.vaultPath.split("/").pop() : "book";
    const result = await api.exportBook({ html: bookHtml, title: vaultName, css: BOOK_CSS });
    editor.setSaveState(result?.ok ? "Libro exportado" : "Cancelado");
  };

  // ── Project Wizard ──
  const handleWizardComplete = async ({ projectName, projectDesc, vaultPath: newVault, areas, githubUrl, githubToken }) => {
    setWizardOpen(false);

    if (newVault) editor.setSaveState("Creando proyecto…");

    editor.setSaveState("Creando proyecto…");
    const packages = generateProject(projectName, areas);

    for (const pkg of packages) {
      try { await api.createPackage({ name: pkg.packageName }); } catch {}
      for (const doc of pkg.docs) {
        try {
          const result = await api.createDoc({ packageName: pkg.packageName, parentPath: null, title: doc.title });
          const document = { ...result.document, blocks: doc.blocks, meta: { ...result.document.meta, title: doc.title } };
          await api.saveDoc({ packageName: pkg.packageName, pagePath: result.pagePath, sourceType: "page-json", document });
        } catch (err) {
          console.error(`Error creating ${doc.title}:`, err);
        }
      }
    }

    await vault.refreshTree();

    if (githubUrl && githubToken && api?.backupInit && api?.backupCommit && api?.backupPush) {
      editor.setSaveState("Configurando backup…");
      try {
        await api.backupInit();
        await api.backupCommit({ message: `Proyecto "${projectName}" creado` });
        await api.backupPush({ url: githubUrl, token: githubToken });
        editor.setSaveState(`Proyecto creado + backup en GitHub`);
      } catch (err) {
        editor.setSaveState(`Proyecto creado (backup falló: ${err.message})`);
      }
    } else {
      editor.setSaveState(`Proyecto "${projectName}" creado`);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        {/* Draggable titlebar */}
        <div className="titlebar">
          <img src="./logo.png" alt="Kuilo" className="titlebar-logo" />
          {!sidebarCollapsed && <span className="titlebar-name">Kuilo</span>}
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed((c) => !c)}
            title={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Search */}
            <div className="search-bar">
              <Search size={13} />
              <input
                type="text"
                placeholder="Buscar en títulos y contenido..."
                value={search.searchQuery}
                onChange={(e) => search.handleSearch(e.target.value)}
              />
            </div>

            {/* Search results */}
            {search.searchResults && search.searchQuery.trim() && (
              <div className="search-results">
                {search.searchResults.length === 0 ? (
                  <p className="search-empty">Sin resultados para "{search.searchQuery}"</p>
                ) : (
                  search.searchResults.map((r, i) => (
                    <button
                      key={i}
                      className="search-result-item"
                      onClick={() => {
                        vault.openDoc({ packageName: r.packageName, pagePath: r.pagePath, sourceType: r.sourceType });
                        search.handleSearch("");
                        search.handleSearch("");
                      }}
                    >
                      <span className="search-result-title">{r.title}</span>
                      <span className="search-result-snippet">{r.snippet}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Package tree */}
            <nav className="nav-tree" style={search.searchResults && search.searchQuery.trim() ? { display: "none" } : undefined}>
              {search.filteredPackages.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, padding: "8px 12px" }}>
                  Sin páginas aún
                </p>
              )}
              {search.filteredPackages.map((pkg) => {
                const packageKey = `package:${pkg.name}`;
                const packageExpanded = vault.expandedItems[packageKey];
                return (
                  <section className="pkg-section" key={pkg.id}>
                    <div className="pkg-header">
                      <button
                        className="pkg-toggle"
                        onClick={() => vault.toggleExpanded(packageKey)}
                      >
                        {packageExpanded
                          ? <ChevronDown size={11} />
                          : <ChevronRight size={11} />}
                        <FolderTree size={11} />
                        <span>{pkg.name}</span>
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => vault.addDocToPackage(pkg.name)}
                        title="Nueva página"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {packageExpanded && (
                      <div className="doc-list">
                        {(pkg.pages || []).map((page) => (
                          <PageTreeNode
                            key={page.id}
                            page={page}
                            depth={0}
                            activeDoc={vault.activeDoc}
                            expandedItems={vault.expandedItems}
                            onToggle={vault.toggleExpanded}
                            onOpen={vault.openDoc}
                            onAddChild={vault.addDocToPackage}
                            onDelete={vault.deleteDoc}
                            onRename={vault.startRename}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
              {vault.packageFormOpen ? (
                <div className="pkg-form">
                  <input
                    type="text"
                    placeholder="ej. engineering"
                    value={vault.packageDraft}
                    onChange={(e) => {
                      vault.setPackageDraft(e.target.value);
                      if (vault.packageError) vault.setPackageError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") vault.addPackage();
                      if (e.key === "Escape") {
                        vault.setPackageFormOpen(false);
                        vault.setPackageDraft("");
                        vault.setPackageError("");
                      }
                    }}
                    autoFocus
                  />
                  <div className="pkg-form-row">
                    <button
                      className="pkg-form-cancel"
                      onClick={() => { vault.setPackageFormOpen(false); vault.setPackageDraft(""); vault.setPackageError(""); }}
                    >
                      Cancelar
                    </button>
                    <button className="pkg-form-submit" onClick={vault.addPackage}>
                      Crear
                    </button>
                  </div>
                  {vault.packageError && <p className="pkg-form-error">{vault.packageError}</p>}
                </div>
              ) : (
                <>
                  <button
                    className="footer-btn primary"
                    onClick={() => vault.setPackageFormOpen(true)}
                  >
                    <FolderPlus size={13} />
                    Nuevo paquete
                  </button>
                  <button className="footer-btn" onClick={vault.openDocsFolder}>
                    <FolderOpen size={13} />
                    Abrir carpeta
                  </button>
                  <button className="footer-btn vault-btn" onClick={vault.handleChangeVault} title={vault.vaultPath}>
                    <FolderTree size={13} />
                    {vault.vaultPath ? vault.vaultPath.split("/").pop() : "Cambiar vault"}
                  </button>
                  {vault.packages.flatMap((pkg) => vault.collectLegacyDocs(pkg.pages || [])).length > 0 && (
                    <button className="footer-btn promote-all-btn" onClick={vault.promoteAllLegacy} title="Convierte todos los .md a page.json estructurado">
                      <FileCode2 size={13} />
                      Promover todo a Structured
                    </button>
                  )}
                  <button className="footer-btn book-btn" onClick={exportBook}>
                    <Download size={13} />
                    Exportar libro PDF
                  </button>
                  <button className="footer-btn wizard-btn" onClick={() => setWizardOpen(true)}>
                    <Plus size={13} />
                    Nuevo proyecto
                  </button>
                  <button className="footer-btn connectors-btn" onClick={connectors.openConnectors}>
                    <Plug size={13} />
                    Conectores AI
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </aside>

      {/* ── Workspace ── */}
      <main className="workspace">
        {sidebarCollapsed && (
          <button
            className="sidebar-expand-btn"
            onClick={() => setSidebarCollapsed(false)}
            title="Expandir sidebar"
          >
            <ChevronRight size={14} />
          </button>
        )}
        {!vault.activeDoc ? (
          <div className="empty-state">
            <FileText size={52} />
            <h2>Sin página seleccionada</h2>
            <p>Elige una página del panel izquierdo o crea una nueva.</p>
          </div>
        ) : (
          <>
            {/* Cover image */}
            {vault.sourceType === "page-json" && (
              <CoverImage
                cover={editor.pageMeta.cover}
                onChange={(cover) => editor.handleMetaChange({ cover })}
              />
            )}

            {/* Document header */}
            <div className="doc-header">
              <div className="doc-meta">
                <Breadcrumb activeDoc={vault.activeDoc} onNavigate={vault.openDoc} />
                <div className="doc-title-row">
                  {vault.sourceType === "page-json" && (
                    <EmojiPicker
                      value={editor.pageMeta.icon}
                      onChange={(icon) => editor.handleMetaChange({ icon })}
                    />
                  )}
                  <h1 className="doc-title">{vault.activeDoc.title}</h1>
                </div>
              </div>
              <div className="doc-controls">
                <span className="save-indicator">
                  <span className={`save-dot ${editor.saveState === "Guardando..." || editor.saveState === "Restaurando..." ? "saving" : ""}`} />
                  {editor.saveState}
                </span>
                <span className={`source-badge ${vault.sourceType || "none"}`}>
                  {vault.sourceType === "page-json" ? "Structured" : vault.sourceType === "legacy-markdown" ? "Legacy" : "—"}
                </span>
                {vault.sourceType === "legacy-markdown" && (
                  <button
                    className="control-btn promote-btn"
                    onClick={vault.promoteToStructured}
                    title="Convertir a Structured (page.json)"
                  >
                    Promover
                  </button>
                )}
                {vault.sourceType === "page-json" && (
                  <>
                    <button
                      className={`control-btn ${editor.jsonViewOpen ? "active" : ""}`}
                      onClick={() => editor.setJsonViewOpen((c) => !c)}
                      title="Ver JSON"
                    >
                      <FileCode2 size={13} />
                      JSON
                    </button>
                    <button
                      className={`control-btn ${editor.historyOpen ? "active" : ""}`}
                      onClick={() => editor.setHistoryOpen((c) => !c)}
                      title="Historial de versiones"
                    >
                      <History size={13} />
                      Historial
                    </button>
                  </>
                )}
                {vault.activeDoc && (
                  <div className="export-group">
                    <button
                      className="control-btn"
                      onClick={() => {
                        if (vault.sourceType === "page-json" && editor.pageDocument?.blocks) {
                          const md = blocksToMarkdown(editor.pageDocument.blocks);
                          const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a"); a.href = url;
                          a.download = `${vault.activeDoc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
                          a.click(); URL.revokeObjectURL(url);
                        } else {
                          const el = document.querySelector(".simple-editor");
                          if (el) exportMarkdown(el.innerHTML, vault.activeDoc.title);
                        }
                      }}
                      title="Exportar Markdown"
                    >
                      <Download size={13} /> .md
                    </button>
                    <button
                      className="control-btn"
                      onClick={() => {
                        const el = document.querySelector(".simple-editor");
                        if (el) exportHtml(el.innerHTML, vault.activeDoc.title);
                      }}
                      title="Exportar HTML"
                    >
                      <Download size={13} /> .html
                    </button>
                    <button
                      className="control-btn"
                      onClick={async () => {
                        const el = document.querySelector(".simple-editor");
                        if (!el) return;
                        if (api?.exportPdf) {
                          editor.setSaveState("Generando PDF…");
                          const result = await api.exportPdf({ html: el.innerHTML, title: vault.activeDoc.title });
                          editor.setSaveState(result?.ok ? "PDF exportado" : "Cancelado");
                        } else {
                          exportPdf(el.innerHTML, vault.activeDoc.title);
                        }
                      }}
                      title="Exportar PDF"
                    >
                      <Download size={13} /> PDF
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Editor area */}
            <div className="editor-area">
              {vault.sourceType === "page-json" && editor.jsonViewOpen ? (
                <div className="json-canvas">
                  <pre>{JSON.stringify(editor.pageDocument, null, 2)}</pre>
                </div>
              ) : (
                <SimpleEditor
                  key={vault.activeDoc?.pagePath}
                  initialContent={editor.editorHtml}
                  onContentChange={editor.handleEditorChange}
                />
              )}

              {/* History panel */}
              {editor.historyOpen && vault.sourceType === "page-json" && (
                <aside className="history-panel">
                  <div className="history-header">
                    <h3>Historial</h3>
                    <button className="history-close" onClick={() => editor.setHistoryOpen(false)}>
                      <X size={13} />
                    </button>
                  </div>
                  <div className="history-list">
                    {editor.versions.length === 0 ? (
                      <p className="history-empty">Aún no hay snapshots guardados.</p>
                    ) : (
                      editor.versions.map((version) => (
                        <div className="history-item" key={version.id}>
                          <div className="history-item-info">
                            <strong>v{version.version}</strong>
                            <time>
                              {version.savedAt
                                ? new Date(version.savedAt).toLocaleString("es-MX", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Sin fecha"}
                            </time>
                          </div>
                          <button
                            className="restore-btn"
                            onClick={() => editor.restoreVersion(version.fileName)}
                          >
                            Restaurar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </aside>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── Project Wizard ── */}
      {wizardOpen && (
        <ProjectWizard
          onComplete={handleWizardComplete}
          onClose={() => setWizardOpen(false)}
        />
      )}

      {/* ── Rename modal ── */}
      {vault.renameTarget && (
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
      )}

      {/* ── Connectors modal ── */}
      {connectors.connectorsOpen && (
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
                          onClick={() => t.connected ? connectors.disconnectors.connectTarget(t.name) : connectors.connectTarget(t.name)}
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
      )}
    </div>
  );
}

// ─── Page tree node ───────────────────────────────────────────────────

function PageTreeNode({ page, depth, activeDoc, expandedItems, onToggle, onOpen, onAddChild, onDelete, onRename }) {
  const key = `page:${page.packageName}/${page.pagePath}`;
  const expanded = expandedItems[key];
  const isActive = activeDoc?.packageName === page.packageName && activeDoc?.pagePath === page.pagePath;
  const hasChildren = page.children.length > 0;

  return (
    <div className="tree-node">
      <div className="tree-row" style={{ paddingLeft: `${depth * 14}px` }}>
        <button
          className={`tree-arrow ${!hasChildren ? "placeholder" : ""}`}
          onClick={() => hasChildren && onToggle(key)}
          aria-label={hasChildren ? "Expandir" : "Sin subpáginas"}
        >
          {hasChildren
            ? expanded
              ? <ChevronDown size={11} />
              : <ChevronRight size={11} />
            : null}
        </button>
        <button
          className={`doc-item ${isActive ? "active" : ""}`}
          onClick={() => onOpen(page)}
        >
          <FileText size={12} style={{ flexShrink: 0 }} />
          <span className="doc-label">{page.title}</span>
        </button>
        <button className="icon-btn" onClick={() => onRename(page)} title="Renombrar">
          <Pencil size={10} />
        </button>
        <button className="icon-btn" onClick={() => onAddChild(page.packageName, page.pagePath)} title="Nueva subpágina">
          <Plus size={11} />
        </button>
        <button className="icon-btn icon-btn-danger" onClick={() => onDelete(page.packageName, page.pagePath, page.title)} title="Eliminar">
          <Trash2 size={10} />
        </button>
      </div>

      {hasChildren && expanded && (
        <div className="tree-children">
          {page.children.map((child) => (
            <PageTreeNode
              key={child.id}
              page={child}
              depth={depth + 1}
              activeDoc={activeDoc}
              expandedItems={expandedItems}
              onToggle={onToggle}
              onOpen={onOpen}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
