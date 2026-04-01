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
  const [templatePicker, setTemplatePicker] = useState(null);

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

  // Close tab — if it was active, the hook picks the next one
  const handleCloseTab = (tabId) => {
    tabs.closeTab(tabId);
    // After state update, the activeTab changes — we need to open it
    // This is handled by the useEffect below
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
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={paletteCommands}
      />
    </div>
  );
}

export default App;
