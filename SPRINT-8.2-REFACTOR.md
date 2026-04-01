# Sprint 8.2 — Dividir App.jsx

## Estado actual
- `src/App.jsx`: **1298 líneas**
- 25 useState, 15+ funciones, 5 modals, sidebar + workspace en un solo archivo
- Criterio de éxito: ningún archivo > 200 líneas, 298 tests pasando

## Archivos a crear

### 1. Helpers (extraer de las líneas 38-210)
```
src/lib/tree-helpers.js
```
Mover: `stripMarkdown`, `getTitleFromMarkdown`, `findPageByPath`, `findPageInPackages`,
`filterPages`, `getFirstPage`, `getAncestorPagePaths`, `buildExpandedState`,
`normalizeTree`, `normalizePages`, `renderInlineMarkdown`, `renderMarkdownPreview`

### 2. Custom Hooks (extraer del state + funciones del App)
```
src/hooks/use-vault.js        → packages, activeDoc, sourceType, editorHtml, pageDocument,
                                 versions, vaultPath, refreshTree, openDoc, addDocToPackage,
                                 addPackage, handleChangeVault, deleteDoc, renameDoc,
                                 promoteToStructured, promoteAllLegacy

src/hooks/use-editor-state.js → saveState, legacyContent, pageMeta, jsonViewOpen, historyOpen,
                                 handleEditorChange, handleMetaChange, scheduleSaveLegacy,
                                 scheduleSavePageDocument, restoreVersion

src/hooks/use-backup.js       → backupStatus, backupRemoteUrl, backupToken,
                                 refreshBackupStatus, doBackupCommit, doBackupPush

src/hooks/use-connectors.js   → connectorsOpen, mcpInfo, openConnectors,
                                 connectTarget, disconnectTarget

src/hooks/use-search.js       → searchQuery, searchResults, handleSearch
```

### 3. Componentes del Sidebar
```
src/components/sidebar/Sidebar.jsx         → sidebar completo (sidebar, titlebar, tree)
src/components/sidebar/SearchResults.jsx   → resultados de búsqueda full-text
src/components/sidebar/SidebarFooter.jsx   → botones: nuevo paquete, abrir carpeta, vault,
                                              promover, exportar libro, nuevo proyecto, conectores
src/components/sidebar/PackageForm.jsx     → formulario de crear paquete
```

### 4. Componentes del Workspace
```
src/components/workspace/Workspace.jsx     → área principal (empty state + editor area)
src/components/workspace/DocHeader.jsx     → breadcrumb, título, controles, badges, export
src/components/workspace/ExportButtons.jsx → botones .md, .html, PDF
src/components/workspace/HistoryPanel.jsx  → panel lateral de historial de versiones
```

### 5. Modales
```
src/components/modals/ConnectorsModal.jsx  → panel de conectores AI + Git backup
src/components/modals/RenameModal.jsx      → modal de renombrar página
```

### 6. App.jsx final (~50 líneas)
```jsx
import { useVault } from "@/hooks/use-vault";
import { useEditorState } from "@/hooks/use-editor-state";
import { useBackup } from "@/hooks/use-backup";
import { useConnectors } from "@/hooks/use-connectors";
import { useSearch } from "@/hooks/use-search";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Workspace } from "@/components/workspace/Workspace";
import { ProjectWizard } from "@/components/project-wizard/ProjectWizard";
import { ConnectorsModal } from "@/components/modals/ConnectorsModal";
import { RenameModal } from "@/components/modals/RenameModal";

function App() {
  const vault = useVault();
  const editor = useEditorState(vault);
  const backup = useBackup();
  const connectors = useConnectors();
  const search = useSearch(vault.packages);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);

  return (
    <div className="app-shell">
      <Sidebar vault={vault} search={search} editor={editor} ... />
      <Workspace vault={vault} editor={editor} ... />
      {wizardOpen && <ProjectWizard ... />}
      {connectors.open && <ConnectorsModal ... />}
      {renameTarget && <RenameModal ... />}
    </div>
  );
}
```

## Orden de ejecución

```
Paso 1 → Extraer tree-helpers.js (sin cambios de interfaz)
Paso 2 → Extraer use-vault.js (el hook más grande)
Paso 3 → Extraer use-editor-state.js
Paso 4 → Extraer use-backup.js + use-connectors.js + use-search.js
Paso 5 → Extraer Sidebar + sub-componentes
Paso 6 → Extraer Workspace + sub-componentes
Paso 7 → Extraer modales
Paso 8 → Reducir App.jsx al shell final
Paso 9 → npm test → 298 tests pasando
Paso 10 → Verificar que la app funcione manualmente
```

## Reglas

- Cada paso debe terminar con `npm test` pasando
- No cambiar lógica, solo mover código
- No renombrar funciones ni props (evita romper cosas)
- Commit después de cada paso
- Si algo se rompe, revertir y reintentar

## Comando para empezar

```
git checkout -b sprint-8.2-refactor
```
