import {
  ChevronRight,
  Download,
  FileCode2,
  FileText,
  History,
  Link,
  X,
} from "lucide-react";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { exportMarkdown, exportHtml, exportPdf } from "@/lib/export-utils";
import { blocksToMarkdown } from "@/lib/blocks-to-markdown";
import { EmojiPicker } from "@/components/page-identity/EmojiPicker";
import { CoverImage } from "@/components/page-identity/CoverImage";
import { Breadcrumb } from "@/components/page-identity/Breadcrumb";
import { DiffView } from "@/components/workspace/DiffView";
import { BacklinksPanel } from "@/components/workspace/BacklinksPanel";
import { resolveWikiLink } from "@/lib/wiki-links";
import { TabBar } from "@/components/workspace/TabBar";
import { WorkflowBoard } from "@/components/workflow/WorkflowBoard";
import { useState, useEffect, useMemo } from "react";

const api = window.notesApi;

function flattenPages(packages) {
  const result = [];
  const walk = (pages, packageName) => {
    for (const page of pages) {
      result.push({ title: page.title, packageName, pagePath: page.pagePath });
      if (page.children?.length) walk(page.children, packageName);
    }
  };
  for (const pkg of packages) walk(pkg.pages || [], pkg.name);
  return result;
}

export function Workspace({ vault, editor, tabs, favorites, onToggleFavorite, onSwitchTab, onCloseTab, sidebarCollapsed, onExpandSidebar, workflow }) {
  const allPages = useMemo(() => flattenPages(vault.packages), [vault.packages]);
  const [backlinksOpen, setBacklinksOpen] = useState(false);
  const [backlinks, setBacklinks] = useState([]);

  const handleWikiLinkClick = (title) => {
    const target = resolveWikiLink(vault.packages, title);
    if (target) vault.openDoc(target);
  };

  // Fetch backlinks when panel opens or active doc changes
  useEffect(() => {
    if (!backlinksOpen || !vault.activeDoc?.title || !api?.searchContent) {
      setBacklinks([]);
      return;
    }
    api.searchContent({ query: vault.activeDoc.title }).then((results) => {
      // Exclude self from results
      const filtered = (results || []).filter(
        (r) => !(r.packageName === vault.activeDoc.packageName && r.pagePath === vault.activeDoc.pagePath)
      );
      setBacklinks(filtered);
    });
  }, [backlinksOpen, vault.activeDoc?.pagePath]);

  return (
    <main className="workspace">
      {tabs && (
        <TabBar
          tabs={tabs.tabs}
          activeTabId={tabs.activeTabId}
          onSwitch={onSwitchTab}
          onClose={onCloseTab}
          onCloseOthers={tabs.closeOtherTabs}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
        />
      )}
      {workflow?.workflow && (
        <WorkflowBoard
          workflow={workflow.workflow}
          allWorkflows={{ [workflow.workflow.areaId]: workflow.workflow }}
          pages={allPages.filter((p) => p.packageName === workflow.activePackage)}
          onOpenDoc={(doc) => { workflow.closeWorkflow(); vault.openDoc(doc); }}
          onCreateDoc={(packageName, title) => {
            workflow.closeWorkflow();
            vault.addDocToPackage(packageName, null, { title, blocks: [] });
          }}
          onUpdateStatus={workflow.updateStatus}
          onLinkDoc={workflow.linkDoc}
          onClose={workflow.closeWorkflow}
        />
      )}
      {!workflow?.workflow && sidebarCollapsed && (
        <button
          className="sidebar-expand-btn"
          onClick={onExpandSidebar}
          title="Expandir sidebar"
        >
          <ChevronRight size={14} />
        </button>
      )}
      {!workflow?.workflow && !vault.activeDoc && (
        <div className="empty-state">
          <FileText size={52} />
          <h2>Sin página seleccionada</h2>
          <p>Elige una página del panel izquierdo o crea una nueva.</p>
        </div>
      )}
      {!workflow?.workflow && vault.activeDoc && (
        <>
          {/* Cover image */}
          {vault.sourceType === "page-json" && (
            <CoverImage
              cover={editor.pageMeta.cover}
              onChange={(cover) => editor.handleMetaChange({ cover })}
            />
          )}

          {/* Document header */}
          <DocHeader vault={vault} editor={editor} backlinksOpen={backlinksOpen} onToggleBacklinks={() => setBacklinksOpen((c) => !c)} />

          {/* Editor area */}
          <div className="editor-area">
            {editor.diffEntries ? (
              <DiffView
                entries={editor.diffEntries}
                versionLabel={editor.diffVersionLabel}
                onClose={editor.closeDiff}
              />
            ) : vault.sourceType === "page-json" && editor.jsonViewOpen ? (
              <div className="json-canvas">
                <pre>{JSON.stringify(editor.pageDocument, null, 2)}</pre>
              </div>
            ) : (
              <SimpleEditor
                key={vault.activeDoc?.pagePath}
                initialContent={editor.editorHtml}
                onContentChange={editor.handleEditorChange}
                onWikiLinkClick={handleWikiLinkClick}
                pages={allPages}
              />
            )}

            {/* History panel */}
            <HistoryPanel editor={editor} sourceType={vault.sourceType} />

            {/* Backlinks panel */}
            {backlinksOpen && (
              <BacklinksPanel
                backlinks={backlinks}
                onNavigate={(bl) => vault.openDoc(bl)}
                onClose={() => setBacklinksOpen(false)}
              />
            )}
          </div>
        </>
      )}
    </main>
  );
}

function DocHeader({ vault, editor, backlinksOpen, onToggleBacklinks }) {
  return (
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
        <button
          className={`control-btn ${backlinksOpen ? "active" : ""}`}
          onClick={onToggleBacklinks}
          title="Ver qué páginas enlazan aquí"
        >
          <Link size={13} />
          Backlinks
        </button>
        {vault.activeDoc && (
          <ExportButtons vault={vault} editor={editor} />
        )}
      </div>
    </div>
  );
}

function ExportButtons({ vault, editor }) {
  return (
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
  );
}

function HistoryPanel({ editor, sourceType }) {
  if (!editor.historyOpen || sourceType !== "page-json") return null;

  return (
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
                className="compare-btn"
                onClick={() => editor.compareVersion(version.fileName, `v${version.version}`)}
              >
                Comparar
              </button>
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
  );
}
