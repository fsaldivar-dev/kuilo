# Plan de Continuidad: Sistema Documental UX-First

Estado: activo
Proyecto: `NotesApp`
Última actualización: 2026-03-29
Referencia UX: [AppFlowy](https://github.com/AppFlowy-IO/AppFlowy)

---

## Objetivo

Sistema documental personal local-first (sin backend, sin sync cloud) con:
- UX de clase Notion/AppFlowy
- Editor visual por bloques Tiptap
- Formato `page.json` estructurado y legible por LLM
- MCP nativo para que Claude lea/escriba documentos directamente
- Electron frameless, 100% offline

---

## Estado actual vs AppFlowy

### ✅ Ya tenemos

| Feature | AppFlowy | NotesApp |
|---|---|---|
| Heading H1/H2/H3 | ✅ | ✅ |
| Párrafo con rich text | ✅ | ✅ |
| Bold / Italic / Underline / Strikethrough | ✅ | ✅ |
| Superscript / Subscript | ✅ | ✅ |
| Color de texto y highlight | ✅ | ✅ |
| Alineación L/C/R/Justify | ✅ | ✅ |
| Links | ✅ | ✅ |
| Bullet list | ✅ | ✅ |
| Ordered list | ✅ | ✅ |
| Task list (checklist) | ✅ | ✅ |
| Quote / Blockquote | ✅ | ✅ |
| Code block | ✅ | ✅ |
| Tabla básica | ✅ | ✅ |
| Divider / HR | ✅ | ✅ |
| Imágenes (upload) | ✅ | ✅ base64 local |
| Diagrama Mermaid | ✅ | ✅ |
| Callout block | ✅ | ✅ |
| Profile card | ➖ | ✅ custom |
| Páginas anidadas | ✅ | ✅ |
| Sidebar con árbol | ✅ | ✅ |
| Historial de versiones | ✅ | ✅ snapshot local |
| Dark mode | ✅ | ✅ |
| 100% offline / local | ✅ | ✅ |
| Frameless / nativo Mac | ✅ Flutter | ✅ Electron |

---

### 🔧 Roadmap — Features por sprint

---

## SPRINT 1 — UX del Editor (impacto inmediato)

### 1.1 Slash Commands `/`
**Referencia AppFlowy:** Escribes `/` y aparece menú con todos los tipos de bloque.
**Implementación:** Extensión Tiptap `@tiptap/suggestion` + lista de comandos customizable.
**TDD:** Test que verifica que al escribir `/heading` se inserta un bloque H1.
**Archivos:** `src/lib/slash-commands.js`, modificar `simple-editor.jsx`

### 1.2 Bubble Menu contextual
**Referencia AppFlowy:** Toolbar flotante al seleccionar texto con B/I/U/Link/Color.
**Implementación:** `@tiptap/extension-bubble-menu` (en v3 es plugin propio).
**TDD:** Test E2E que selecciona texto y verifica que aparece el bubble menu.
**Archivos:** nuevo componente `src/components/tiptap-ui/bubble-menu.jsx`

### 1.3 Drag handle por bloque
**Referencia AppFlowy:** Icono `⠿` en hover de cada bloque para reordenar drag & drop.
**Implementación:** `@tiptap/extension-drag-handle` (disponible en Tiptap v3 Pro — evaluar alternativa open source con `prosemirror-draggable`).
**TDD:** Test E2E que arrastra bloque y verifica nuevo orden.

### 1.4 Toggle list / Toggle heading
**Referencia AppFlowy:** Bloque colapsable. Click en triángulo colapsa/expande contenido.
**Implementación:** Extensión custom `ToggleNode` + SCSS para animación.
**TDD:** Test que verifica que el contenido se oculta/muestra al hacer click.

---

## SPRINT 2 — Identidad visual de páginas

### 2.1 Emoji icon por página
**Referencia AppFlowy:** Cada página tiene un emoji que aparece en sidebar y header.
**Implementación:** Campo `meta.icon` en `page.json` + emoji picker (`emoji-mart`).
**TDD:** Test que verifica que guardar `meta.icon = "🚀"` persiste en `page.json`.

### 2.2 Cover image por página
**Referencia AppFlowy:** Imagen de portada arriba del título del documento.
**Implementación:** Campo `meta.cover` (base64 o color) en `page.json` + UI de upload/color.
**TDD:** Test de serialización que `meta.cover` se guarda y restaura correctamente.

### 2.3 Breadcrumb navigation
**Referencia AppFlowy:** `Workspace > Paquete > Página > Subpágina` arriba del editor.
**Implementación:** Componente `Breadcrumb.jsx` que calcula el path desde `activeDoc`.
**TDD:** Test unitario que dado un `pagePath` anidado produce los breadcrumbs correctos.

---

## SPRINT 3 — Exploración de filesystem (nuevo)

### 3.1 Explorar cualquier carpeta como vault
**Descripción:** El usuario puede apuntar la app a **cualquier directorio del sistema** (no solo `docs/`) como fuente de documentos. La app indexa los `page.json` y `.md` que encuentre recursivamente.
**Implementación:**
- Electron IPC: `open-folder-dialog` → `dialog.showOpenDialog({ properties: ['openDirectory'] })`
- Guardar la ruta elegida en `electron-store` (persistencia entre sesiones)
- El handler `list-tree` usa la ruta configurada en lugar de `docs/` hardcodeado
- UI: botón "Cambiar vault" en el sidebar footer

**TDD:**
```js
// Test que list-tree funciona con cualquier root path
it("lista documentos desde un path arbitrario")
it("persiste el vault path entre reinicios de la app")
```

### 3.2 Múltiples vaults / workspaces
**Descripción:** Lista de vaults recientes, cambio rápido entre proyectos.
**Implementación:** `electron-store` guarda array de vaults recientes.
**Dependencia:** Requiere 3.1 completado.

---

## SPRINT 4 — Markdown de primera clase (nuevo)

### 4.1 Renderizado visual de archivos `.md`
**Descripción:** Los archivos Markdown legacy se muestran con renderizado visual completo (no textarea+preview split como hoy). Usar el mismo SimpleEditor en modo lectura con el contenido parseado.
**Implementación:**
- Función `markdownToHtml()` usando `marked` o `remark`
- Abrir `.md` en SimpleEditor con `editable: false` para lectura
- Botón "Editar" que activa modo edición

### 4.2 Edición simple de Markdown
**Descripción:** Al activar modo edición en un `.md`, el editor muestra una vista limpia con:
- Toolbar simplificada (solo H1/H2/H3, bold, italic, link, lista, código)
- Guarda como Markdown (no convierte a `page.json`)
- Preview instantáneo side-by-side opcional

**Implementación:**
- `htmlToMarkdown()` al guardar (usar `turndown`)
- Editor configurable con subset de extensiones
- `sourceType: "legacy-markdown"` sigue siendo la fuente de verdad

**TDD:**
```js
it("markdownToHtml convierte # correctamente")
it("htmlToMarkdown roundtrip preserva contenido")
it("editar un .md no lo convierte a page-json")
```

### 4.3 Conversión `.md` → `page.json`
**Descripción:** Botón "Promover a Structured" que convierte un archivo `.md` a `page.json` con historial de versiones.
**Dependencia:** Requiere 4.1 y 4.2.

---

## SPRINT 5 — MCP Nativo

### 5.1 Herramientas MCP de lectura
```
read_document(packageName, pagePath) → page.json
list_documents(packageName?) → árbol de páginas
search_documents(query) → páginas relevantes
```

### 5.2 Herramientas MCP de escritura
```
create_document(packageName, title, blocks[]) → page.json
update_document(packageName, pagePath, blocks[]) → page.json actualizado
append_blocks(packageName, pagePath, blocks[]) → añade al final
```

### 5.3 MCP con contexto semántico
```
get_document_context(pagePath) → resumen + bloques clave para LLM
```

**Stack:** El MCP server vive en `scripts/docs-mcp.mjs` (ya existe la base).
**TDD:** Tests de integración que verifican que las herramientas MCP retornan JSON válido.

---

## SPRINT 6 — Features avanzados AppFlowy

### 6.1 Math equations (KaTeX)
Bloques de ecuaciones inline y block con renderizado KaTeX.

### 6.2 Columns layout
Dos o tres columnas side-by-side dentro de un documento.

### 6.3 Table of Contents block
Bloque que auto-genera índice de headings del documento.

### 6.4 Templates de página
Galería de plantillas predefinidas (Meeting Notes, Sprint Plan, RFC, etc.).

### 6.5 Export
- Markdown desde `page.json`
- HTML estático
- PDF (via Electron `printToPDF`)

---

## Ventaja diferencial vs AppFlowy

| | AppFlowy | NotesApp |
|---|---|---|
| Stack | Flutter + Rust | Electron + React + Vite |
| Datos | Collab binario (CRDT) | `page.json` plain JSON |
| Legible por LLM | ❌ difícil | ✅ nativo |
| MCP nativo | ❌ | ✅ (Sprint 5) |
| Personalizable | limitado | 100% source |
| Explorar cualquier carpeta | ✅ (vault) | ✅ (Sprint 3) |
| Gratis / sin cuenta | ✅ | ✅ |
| Self-hosted | ✅ complejo | ✅ trivial (es local) |

---

## Stack técnico

```
Electron 36 (frameless, IPC, dialog, electron-store)
React 19 + Vite 7
Tiptap v3 (SimpleEditor + extensiones custom)
page.json (blocks tipados, meta, versions/)
Vitest 4 (unit) + Playwright (E2E web + Electron)
scripts/docs-mcp.mjs (MCP server — base lista)
```

## Archivos clave

```
src/App.jsx                    — shell principal, IPC, estado
src/lib/tiptap-utils.js        — upload de imágenes base64
src/lib/page-document.js       — TODO: extraer serialización de App.jsx
src/tests/serialization.test.js — 28 tests pasando
src/components/tiptap-templates/simple/simple-editor.jsx — editor principal
electron/main.cjs              — IPC handlers, BrowserWindow
scripts/docs-mcp.mjs           — MCP server base
docs/                          — vault actual (page.json + .md)
```
