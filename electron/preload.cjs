const { contextBridge, ipcRenderer } = require("electron");

// Kuilo API bridge — exposed as window.notesApi for backwards compatibility
contextBridge.exposeInMainWorld("notesApi", {
  listTree: () => ipcRenderer.invoke("notes:list-tree"),
  openDocsFolder: () => ipcRenderer.invoke("notes:open-docs-folder"),
  readDoc: (payload) => ipcRenderer.invoke("notes:read-doc", payload),
  listDocVersions: (payload) => ipcRenderer.invoke("notes:list-doc-versions", payload),
  createPackage: (payload) => ipcRenderer.invoke("notes:create-package", payload),
  createDoc: (payload) => ipcRenderer.invoke("notes:create-doc", payload),
  saveDoc: (payload) => ipcRenderer.invoke("notes:save-doc", payload),
  restoreDocVersion: (payload) => ipcRenderer.invoke("notes:restore-doc-version", payload),
  promoteDoc: (payload) => ipcRenderer.invoke("notes:promote-doc", payload),
  deleteDoc: (payload) => ipcRenderer.invoke("notes:delete-doc", payload),
  renameDoc: (payload) => ipcRenderer.invoke("notes:rename-doc", payload),
  searchContent: (payload) => ipcRenderer.invoke("notes:search-content", payload),
  // Vault
  getVault: () => ipcRenderer.invoke("notes:get-vault"),
  openVaultDialog: () => ipcRenderer.invoke("notes:open-vault-dialog"),
  resetVault: () => ipcRenderer.invoke("notes:reset-vault"),
  // Export
  exportPdf: (payload) => ipcRenderer.invoke("notes:export-pdf", payload),
  exportBook: (payload) => ipcRenderer.invoke("notes:export-book", payload),
  // MCP Connectors
  getMcpInfo: () => ipcRenderer.invoke("notes:get-mcp-info"),
  configureAiConnector: (payload) => ipcRenderer.invoke("notes:configure-ai-connector", payload),
  disconnectAiConnector: (payload) => ipcRenderer.invoke("notes:disconnect-ai-connector", payload),
});
