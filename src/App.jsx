import { useEffect, useMemo, useState } from "react";
import { buildBookHtml, BOOK_CSS } from "@/lib/export-book";
import { generateProject } from "@/lib/project-generator";
import { ProjectWizard } from "@/components/project-wizard/ProjectWizard";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Workspace } from "@/components/workspace/Workspace";
import { RenameModal } from "@/components/modals/RenameModal";
import { ConnectorsModal } from "@/components/modals/ConnectorsModal";
import { CommandPalette, buildPaletteCommands } from "@/components/command-palette/CommandPalette";
import { useEditorState } from "@/hooks/use-editor-state";
import { useVault } from "@/hooks/use-vault";
import { useBackup } from "@/hooks/use-backup";
import { useConnectors } from "@/hooks/use-connectors";
import { useSearch } from "@/hooks/use-search";

const api = window.notesApi;

function App() {
  const editor = useEditorState();
  const vault = useVault(editor);
  const backup = useBackup(editor.setSaveState);
  const connectors = useConnectors(backup.refreshBackupStatus);
  const search = useSearch(vault.packages);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

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

  // ── Cmd+K global hotkey ──
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((c) => !c);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const paletteCommands = useMemo(
    () => buildPaletteCommands({
      vault,
      search,
      onOpenWizard: () => setWizardOpen(true),
      onOpenConnectors: connectors.openConnectors,
      onExportBook: exportBook,
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
        onExportBook={exportBook}
        onOpenWizard={() => setWizardOpen(true)}
        onOpenConnectors={connectors.openConnectors}
      />

      <Workspace
        vault={vault}
        editor={editor}
        sidebarCollapsed={sidebarCollapsed}
        onExpandSidebar={() => setSidebarCollapsed(false)}
      />

      {wizardOpen && (
        <ProjectWizard
          onComplete={handleWizardComplete}
          onClose={() => setWizardOpen(false)}
        />
      )}

      <RenameModal vault={vault} />
      <ConnectorsModal connectors={connectors} backup={backup} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={paletteCommands}
      />
    </div>
  );
}

export default App;
