import { useEffect, useMemo, useState } from "react";
import { buildBookHtml, BOOK_CSS } from "@/lib/export-book";
import { generateSite } from "@/lib/publish-site";
import { generateProject } from "@/lib/project-generator";
import { generateWorkflow } from "@/lib/workflow-definitions";
import { ProjectWizard } from "@/components/project-wizard/ProjectWizard";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Workspace } from "@/components/workspace/Workspace";
import { RenameModal } from "@/components/modals/RenameModal";
import { ConnectorsModal } from "@/components/modals/ConnectorsModal";
import { CommandPalette, buildPaletteCommands } from "@/components/command-palette/CommandPalette";
import { TemplatePickerModal } from "@/components/modals/TemplatePickerModal";
import { ShortcutsModal } from "@/components/modals/ShortcutsModal";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { AiChat } from "@/components/ai-chat/AiChat";
import { TerminalPanel } from "@/components/terminal/Terminal";
import { useEditorState } from "@/hooks/use-editor-state";
import { useVault } from "@/hooks/use-vault";
import { useBackup } from "@/hooks/use-backup";
import { useConnectors } from "@/hooks/use-connectors";
import { useSearch } from "@/hooks/use-search";
import { useTabs } from "@/hooks/use-tabs";
import { useFavorites } from "@/hooks/use-favorites";
import { useWorkflow } from "@/hooks/use-workflow";

const api = window.notesApi;

function App() {
  const editor = useEditorState();
  const vault = useVault(editor);
  const backup = useBackup(editor.setSaveState);
  const connectors = useConnectors(backup.refreshBackupStatus);
  const search = useSearch(vault.packages);
  const tabs = useTabs();
  const wf = useWorkflow();
  const { favorites, toggleFavorite } = useFavorites();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [templatePicker, setTemplatePicker] = useState(null);
  const [pendingCloseTabId, setPendingCloseTabId] = useState(null);

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

  // ── Publish to Web ──
  const publishSite = async () => {
    if (!api?.publishSite || !vault.packages.length) return;
    editor.setSaveState("Generando sitio…");
    const vaultName = vault.vaultPath ? vault.vaultPath.split("/").pop() : "docs";
    const { files } = await generateSite(
      vault.packages, vaultName,
      (done, total, title) => editor.setSaveState(`Publicando ${done}/${total}: ${title}`)
    );
    editor.setSaveState("Eligiendo carpeta…");
    const result = await api.publishSite({ files });
    editor.setSaveState(result?.ok ? `Sitio publicado (${result.totalFiles} archivos)` : "Cancelado");
  };

  // ── Project Wizard ──
  const handleWizardComplete = async ({ projectName, projectDesc, vaultPath: newVault, areas, githubUrl, githubToken }) => {
    setWizardOpen(false);
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

    // Generate workflow.json for each area package
    if (api?.saveWorkflow) {
      for (const pkg of packages) {
        const workflow = generateWorkflow(pkg.packageName);
        if (workflow) {
          await api.saveWorkflow({ packageName: pkg.packageName, workflow });
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

  // ── Vault context for AI chat ──
  const vaultContext = useMemo(() => {
    const pkgs = vault.packages.map((pkg) => {
      const pages = (pkg.pages || []).map((p) => p.title).join(", ");
      return `- ${pkg.name}: ${pages || "(vacío)"}`;
    }).join("\n");

    let activeContent = "";
    if (vault.activeDoc) {
      activeContent = `\n\nDocumento activo: "${vault.activeDoc.title}" (paquete: ${vault.activeDoc.packageName})`;
      if (editor.pageDocument?.blocks) {
        // Extract plain text from Tiptap JSON blocks
        const extractText = (nodes) => {
          if (!Array.isArray(nodes)) return typeof nodes === "string" ? nodes : "";
          return nodes.map((n) => n.text || extractText(n.content) || "").join("");
        };
        const text = (editor.pageDocument.blocks || []).map((b) => {
          const t = extractText(b.content);
          if (b.type === "heading") return `\n## ${t}`;
          return t;
        }).filter(Boolean).join("\n");
        if (text) activeContent += `\nContenido:\n${text.slice(0, 3000)}`;
      } else if (editor.legacyContent) {
        activeContent += `\nContenido:\n${editor.legacyContent.slice(0, 3000)}`;
      }
    }

    return `Vault: ${vault.vaultPath || "local"}\nPaquetes:\n${pkgs}${activeContent}`;
  }, [vault.packages, vault.activeDoc, editor.pageDocument, editor.legacyContent]);

  // ── Tab-aware doc opener ──
  const openDocWithTab = (doc) => {
    tabs.openTab(doc);
    vault.openDoc(doc);
  };

  // When switching tabs, also open the doc
  const handleSwitchTab = (tabId) => {
    tabs.switchTab(tabId);
    const tab = tabs.tabs.find((t) => t.id === tabId);
    if (tab) vault.openDoc(tab);
  };

  // Close tab — warn if active tab has unsaved changes
  const handleCloseTab = (tabId) => {
    const isActiveTab = tabId === tabs.activeTabId;
    if (isActiveTab && editor.isDirty) {
      setPendingCloseTabId(tabId);
      return;
    }
    tabs.closeTab(tabId);
  };

  // ── Template picker wrapper ──
  const addDocWithTemplate = (packageName, parentPath = null) => {
    setTemplatePicker({ packageName, parentPath });
  };

  // ── Global hotkeys ──
  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "k") { e.preventDefault(); setPaletteOpen((c) => !c); }
      if (mod && e.key === "/") { e.preventDefault(); setShortcutsOpen((c) => !c); }
      if (mod && e.key === "w") { e.preventDefault(); if (tabs.activeTabId) handleCloseTab(tabs.activeTabId); }
      if (mod && e.key === "`") { e.preventDefault(); setTerminalOpen((c) => !c); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [tabs.activeTabId]);

  const paletteCommands = useMemo(
    () => buildPaletteCommands({
      vault: { ...vault, openDoc: openDocWithTab },
      search,
      onOpenWizard: () => setWizardOpen(true),
      onOpenConnectors: connectors.openConnectors,
      onExportBook: exportBook,
      onPublishSite: publishSite,
      onToggleTerminal: () => setTerminalOpen((c) => !c),
      onOpenShortcuts: () => setShortcutsOpen(true),
    }),
    [vault.packages]
  );

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
        vault={vault}
        search={search}
        onOpenDoc={openDocWithTab}
        onAddDoc={addDocWithTemplate}
        onDuplicateDoc={vault.duplicateDoc}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onExportBook={exportBook}
        onPublishSite={publishSite}
        onOpenWizard={() => setWizardOpen(true)}
        onOpenConnectors={connectors.openConnectors}
        onOpenChat={() => setChatOpen(true)}
        onOpenTerminal={() => setTerminalOpen(true)}
        onOpenWorkflow={wf.loadWorkflow}
      />

      <Workspace
        vault={vault}
        editor={editor}
        tabs={tabs}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onSwitchTab={handleSwitchTab}
        onCloseTab={handleCloseTab}
        sidebarCollapsed={sidebarCollapsed}
        onExpandSidebar={() => setSidebarCollapsed(false)}
        workflow={wf}
      />

      {wizardOpen && (
        <ProjectWizard
          onComplete={handleWizardComplete}
          onClose={() => setWizardOpen(false)}
        />
      )}

      <RenameModal vault={vault} />
      <ConnectorsModal connectors={connectors} backup={backup} />
      {templatePicker && (
        <TemplatePickerModal
          packageName={templatePicker.packageName}
          parentPath={templatePicker.parentPath}
          onSelect={vault.addDocToPackage}
          onClose={() => setTemplatePicker(null)}
        />
      )}
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ConfirmDialog
        open={!!vault.deleteConfirm}
        title="Eliminar documento"
        message={`¿Eliminar "${vault.deleteConfirm?.title}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={vault.executeDelete}
        onCancel={vault.cancelDelete}
      />
      <ConfirmDialog
        open={!!pendingCloseTabId}
        title="Cambios sin guardar"
        message="Hay cambios sin guardar en esta pestaña. ¿Cerrar de todos modos?"
        confirmLabel="Cerrar"
        variant="danger"
        onConfirm={() => { tabs.closeTab(pendingCloseTabId); setPendingCloseTabId(null); }}
        onCancel={() => setPendingCloseTabId(null)}
      />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={paletteCommands}
      />
      <AiChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        vaultContext={vaultContext}
        pages={vault.packages.flatMap((pkg) => {
          const walk = (pages) => pages.flatMap((p) => [
            { title: p.title, packageName: p.packageName, pagePath: p.pagePath, sourceType: p.sourceType },
            ...walk(p.children || []),
          ]);
          return walk(pkg.pages || []);
        })}
        onOpenDoc={openDocWithTab}
      />
      <TerminalPanel
        open={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        activeDoc={vault.activeDoc}
      />
    </div>
  );
}

export default App;
