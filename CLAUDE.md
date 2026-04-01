# Kuilo — Structured Notes App

Electron + React (Vite) app for structured documentation. No frameworks (no Next, no Redux). All state in custom hooks.

## Architecture (post Sprint 8.2)

```
App.jsx (shell only)
├── useEditorState()     → editor: save, content, meta, versions, diff, JSON/history toggles
├── useVault(editor)     → vault: packages, activeDoc, CRUD, tree, rename, promote, duplicate
├── useBackup(setSave)   → backup: git commit/push/status
├── useConnectors(refreshBackup) → connectors: MCP targets, connect/disconnect
├── useSearch(packages)  → search: query, results, filteredPackages
├── useTabs()            → tabs: open/close/switch tabs, activeTab
├── useFavorites()       → favorites: star/unstar pages (localStorage)
│
├── <Sidebar />          → sidebar/Sidebar.jsx (4 components: Sidebar, SearchResults, SidebarFooter, PageTreeNode)
├── <Workspace />        → workspace/Workspace.jsx (5 components: Workspace, DocHeader, ExportButtons, HistoryPanel, TabBar)
├── <RenameModal />      → modals/RenameModal.jsx
├── <ConnectorsModal />  → modals/ConnectorsModal.jsx
├── <ShortcutsModal />   → modals/ShortcutsModal.jsx (Cmd+/)
├── <TemplatePickerModal /> → modals/TemplatePickerModal.jsx
├── <CommandPalette />   → command-palette/CommandPalette.jsx (Cmd+K)
└── <ProjectWizard />    → project-wizard/ProjectWizard.jsx
```

### Hook dependency chain
```
editor = useEditorState()        ← no deps, created first
vault  = useVault(editor)        ← writes to editor refs (activeDocRef, sourceTypeRef, refreshTreeRef)
backup = useBackup(editor.setSaveState)
connectors = useConnectors(backup.refreshBackupStatus)
search = useSearch(vault.packages)
```

Circular dependency between vault↔editor broken via refs: editor exposes `activeDocRef`, `sourceTypeRef`, `refreshTreeRef`, `setActiveDocRef`. Vault writes to them via useEffect.

### Key files by concern

| Concern | File | Lines |
|---------|------|-------|
| Vault CRUD + tree | `src/hooks/use-vault.js` | 250 |
| Editor state + save | `src/hooks/use-editor-state.js` | 168 |
| Tree helpers (pure) | `src/lib/tree-helpers.js` | 168 |
| Sidebar UI | `src/components/sidebar/Sidebar.jsx` | 289 |
| Workspace UI | `src/components/workspace/Workspace.jsx` | 227 |
| Connectors modal | `src/components/modals/ConnectorsModal.jsx` | 140 |
| Page document ↔ HTML | `src/lib/page-document.js` | 356 |
| Markdown ↔ HTML | `src/lib/markdown-bridge.js` | 119 |
| Slash commands | `src/lib/slash-commands.js` | 239 |
| Project generator | `src/lib/project-generator.js` | 863 |
| Git backup (isomorphic) | `src/lib/git-backup.js` | 86 |
| Tiptap editor | `src/components/tiptap-templates/simple/simple-editor.jsx` | ~400 |
| Electron main | `electron/main.cjs` | 1164 |
| Electron preload | `electron/preload.cjs` | 36 |

### Document types
- **page-json**: Structured doc with `{ meta, blocks }`. Blocks are Tiptap JSON. Versioned.
- **legacy-markdown**: Plain `.md` file. Can be promoted to page-json via `promoteDoc`.

### IPC API (`window.notesApi`)
Docs: `listTree`, `readDoc`, `createDoc`, `saveDoc`, `deleteDoc`, `renameDoc`, `promoteDoc`, `restoreDocVersion`, `searchContent`, `listDocVersions`
Vault: `getVault`, `openVaultDialog`, `openDocsFolder`
Backup: `backupInit`, `backupStatus`, `backupCommit`, `backupPush`
Export: `exportPdf`, `exportBook`
MCP: `getMcpInfo`, `configureAiConnector`, `disconnectAiConnector`

## Testing

```bash
npm test                    # 344 unit tests (vitest, ~2s)
npm run test:e2e:web        # 34 E2E tests (playwright, ~16s)
npm run test:e2e:electron   # 4 Electron tests (requires npm run build first)
```

Test files: `src/tests/*.test.js` (unit), `e2e/web/*.spec.js` (E2E), `e2e/electron/*.spec.js` (Electron)
Screenshots: `e2e/screenshots/` (19 feature audit snapshots)

## Conventions

- Spanish UI strings, English code/comments
- No state management libraries — hooks + refs only
- `const api = window.notesApi` at module top in hooks/components that need IPC
- Auto-save: 450ms debounce via `scheduleSaveLegacy` / `scheduleSavePageDocument`
- Tiptap JSON stored directly as blocks (not converted to pageDocument format)
- Paths: `@/` alias → `src/` (vite config)

## Known issues

- `renderMarkdownPreview` table regex: `[\s:-|]` char range excludes `-` (char 45). Tables with `| --- |` separators don't parse. Only `:` separators work.
- Web mode (no Electron): app loads but has no API — shows empty state. E2E tests adapted for this.
