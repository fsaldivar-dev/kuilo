---
name: api-docs
description: Generate complete API reference from IPC handlers and preload bridge
user_invocable: true
---

Scan the Electron IPC surface and generate a complete API reference.

## Steps

1. **Read `electron/preload.cjs`** — list all exposed methods on `window.notesApi`

2. **Read `electron/main.cjs`** — for each `safeHandle("notes:...")`:
   - Extract the channel name
   - Extract the payload shape (from destructuring)
   - Extract the return value shape
   - Note any side effects (file writes, shell commands)

3. **Read `scripts/docs-mcp.mjs`** — for each MCP tool:
   - Extract name and description
   - Extract inputSchema
   - Note what function it calls

4. **Generate `docs/API-REFERENCE.md`** with format:
   ```markdown
   # API Reference

   ## IPC Methods (window.notesApi)

   ### Document Operations
   #### readDoc(payload)
   - **Payload:** `{ packageName: string, pagePath: string }`
   - **Returns:** `{ sourceType, document?, content? }`
   - **Description:** Lee un documento del vault

   ## MCP Tools (19)
   ### get_vault_summary
   - **Input:** none
   - **Returns:** `{ vaultPath, totalPackages, totalDocuments, ... }`
   ```

5. **Cross-reference** — verify every preload method has a handler in main.cjs

6. Report any mismatches (methods exposed but not handled, or vice versa).
