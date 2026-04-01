# Plan de Refactor — Kuilo v2.1

Basado en auditoría de código del 2026-03-31.
29 issues encontrados: 3 críticos, 6 altos, 18 medios, 2 bajos.

---

## Sprint 8.1 — Seguridad (🔴 Crítico)

### 8.1.1 Sanitizar SVG/HTML outputs
**Archivos:** `MermaidPreview.jsx`, `WhiteboardView.jsx`, `export-book.js`
**Problema:** `dangerouslySetInnerHTML` con SVG de Mermaid puede ejecutar scripts maliciosos.
**Fix:**
- Instalar `dompurify`
- Sanitizar TODO lo que pasa por `dangerouslySetInnerHTML`
- Tests: verificar que `<script>`, `onerror`, `onload` se eliminan del SVG

### 8.1.2 Validar payloads IPC
**Archivos:** `electron/main.cjs`, `electron/preload.cjs`
**Problema:** Los handlers IPC no validan tipo ni estructura de los payloads.
**Fix:**
- Crear `validatePayload(schema, data)` helper
- Validar en cada handler: tipos correctos, strings no vacíos, paths seguros
- Tests: enviar payloads malformados y verificar que se rechazan

### 8.1.3 Error boundaries en IPC handlers
**Archivo:** `electron/main.cjs`
**Problema:** Handlers sin try/catch causan unhandled rejections que crashean.
**Fix:**
- Wrapper `safeHandle(name, handler)` que envuelve cada handler en try/catch
- Retorna `{ error: message }` en vez de crashear
- Aplicar a TODOS los handlers (~20)

---

## Sprint 8.2 — Arquitectura (🔴 Crítico)

### 8.2.1 Dividir App.jsx
**Archivo:** `src/App.jsx` (689+ líneas)
**Problema:** Un componente hace todo: state, IPC, routing, rendering, modals.
**Fix:** Separar en:

```
src/
  App.jsx                    ← shell (50 líneas)
  hooks/
    useVault.js              ← vault state, readDoc, saveDoc, refreshTree
    useBackup.js             ← git backup state y handlers
    useConnectors.js         ← MCP connectors state
  components/
    sidebar/
      Sidebar.jsx            ← sidebar completo
      SearchResults.jsx      ← resultados de búsqueda
      SidebarFooter.jsx      ← botones del footer
    workspace/
      Workspace.jsx          ← área principal
      DocHeader.jsx          ← breadcrumb, título, controles
      ExportButtons.jsx      ← botones de export
      HistoryPanel.jsx       ← panel de historial
    modals/
      ConnectorsModal.jsx    ← panel de conectores
      RenameModal.jsx        ← modal de rename
```

**Criterio:** Ningún archivo > 200 líneas.
**Tests:** Mantener 276 tests pasando después del refactor.

---

## Sprint 8.3 — Memory Leaks (🟠 Alto)

### 8.3.1 Destruir editor Tiptap al unmount
**Archivo:** `simple-editor.jsx`
**Problema:** El editor no se destruye cuando el componente se desmonta.
**Fix:**
```js
useEffect(() => {
  return () => editor?.destroy();
}, [editor]);
```

### 8.3.2 Limpiar nodeIdCounter
**Archivos:** `DiagramEditor.jsx`, `diagram-converter.js`
**Problema:** Variable global compartida entre instancias.
**Fix:** Usar `useRef` para IDs por instancia, o `crypto.randomUUID()`.

### 8.3.3 Memoizar collectLegacyDocs
**Archivo:** `App.jsx` (o `Sidebar.jsx` después del refactor)
**Problema:** Se ejecuta en cada render para decidir si mostrar un botón.
**Fix:** `useMemo` con dependencia en `packages`.

---

## Sprint 8.4 — Performance (🟡 Medio)

### 8.4.1 Reemplazar setTimeout(0) con flushSync o batched updates
**Archivo:** `FlowchartView.jsx`
**Problema:** 5 `setTimeout` con delay 0 para sincronizar React Flow → Mermaid.
**Fix:** Usar `flushSync` de React o `queueMicrotask`.

### 8.4.2 PDF: reemplazar setTimeout con waitForLoadState
**Archivo:** `electron/main.cjs`
**Problema:** `setTimeout(1500)` arbitrario para esperar que el PDF renderice.
**Fix:**
```js
await pdfWin.webContents.executeJavaScript('document.readyState');
// o
pdfWin.webContents.on('did-finish-load', resolve);
```

### 8.4.3 Lazy imports para módulos pesados
**Archivos:** `simple-editor.jsx`
**Problema:** Mermaid, KaTeX, React Flow se importan estáticos.
**Fix:** Dynamic `import()` para:
- `mermaid` (~450KB)
- `katex` (~260KB)
- `@xyflow/react` (~200KB)
- `recharts` (~150KB)

### 8.4.4 Search: no bloquear main process
**Archivo:** `electron/main.cjs`
**Problema:** `searchDir` recursivo puede bloquear el main process en vaults grandes.
**Fix:** Usar `setImmediate()` entre iteraciones o mover a worker thread.

---

## Sprint 8.5 — Error Handling (🟡 Medio)

### 8.5.1 Eliminar catch vacíos
**Archivo:** `App.jsx` (múltiples)
**Problema:** `catch {}` traga errores silenciosamente.
**Fix:** Reemplazar con `catch (err) { console.error(...) }` o feedback al usuario.

### 8.5.2 React Error Boundary
**Nuevo archivo:** `src/components/ErrorBoundary.jsx`
**Problema:** Un componente roto crashea toda la app.
**Fix:** Error boundary que muestra "algo salió mal" y permite reiniciar.

### 8.5.3 Validar getPos() antes de usar
**Archivo:** `CodeBlockLanguageSelect.jsx`
**Problema:** `getPos()` puede retornar undefined si el nodo fue eliminado.
**Fix:** Guard clause antes de la transacción.

---

## Sprint 8.6 — Código muerto y limpieza (🟢 Bajo)

### 8.6.1 Eliminar archivos no usados
- `src/components/tiptap-node/diagram-node/` — diagramBlock deshabilitado
- `src/components/tiptap-node/whiteboard-node/` — Excalidraw deshabilitado
- `src/lib/mermaid-controls.js` — ya no se usa (reemplazado por React Flow)
- `@excalidraw/excalidraw` — desinstalar del package.json
- `@panzoom/panzoom` — ya desinstalado
- `@monaco-editor/react` — verificar si se usa o desinstalar

### 8.6.2 Consolidar imports duplicados
- `lucide-react` se importa en 5+ archivos con diferentes iconos
- Crear barrel export `src/components/icons.js`

### 8.6.3 Unificar helpers de bloques
- `page-templates.js` y `project-generator.js` tienen helpers idénticos (`h()`, `p()`, `ul()`, etc.)
- Extraer a `src/lib/block-helpers.js`

---

## Orden de ejecución

```
Sprint 8.1 → Seguridad          (1-2 horas) — PRIMERO
Sprint 8.2 → Dividir App.jsx    (2-3 horas) — más impacto en mantenibilidad
Sprint 8.3 → Memory leaks       (30 min)
Sprint 8.4 → Performance        (1-2 horas)
Sprint 8.5 → Error handling     (1 hora)
Sprint 8.6 → Limpieza           (30 min)
```

## Métricas de éxito

- [ ] 0 `dangerouslySetInnerHTML` sin sanitizar
- [ ] 0 IPC handlers sin try/catch
- [ ] 0 archivos > 200 líneas
- [ ] 0 catch vacíos (`catch {}`)
- [ ] 276+ tests pasando
- [ ] Build size reducido ~300KB (por lazy imports)
- [ ] 0 warnings de React deps en useEffect
