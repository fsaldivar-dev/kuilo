<p align="center">
  <img src="docs/screenshots/logo.png" alt="Kuilo" width="120" />
</p>

<h1 align="center">Kuilo</h1>

<p align="center">
  <strong>IDE de documentacion tecnica — local-first, offline, con MCP nativo.</strong><br/>
  Del nahuatl <em>tlacuilo</em>: el escriba que documenta conocimiento.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/plataforma-macOS-blue" />
  <img src="https://img.shields.io/badge/stack-Electron%20%2B%20React%20%2B%20Tiptap-purple" />
  <img src="https://img.shields.io/badge/licencia-MIT-green" />
  <img src="https://img.shields.io/badge/MCP-8%20herramientas-orange" />
  <img src="https://img.shields.io/badge/tests-256%20passing-brightgreen" />
</p>

---

## Que es Kuilo?

Kuilo es un IDE de documentacion tecnica para equipos de una persona. Documenta tu negocio, tu producto, tus APIs, tus procesos — todo en un solo lugar, 100% offline, con archivos JSON que cualquier IA puede leer.

![Vista general](docs/screenshots/full-app-dark.png)

---

## Capacidades

| Capacidad | Documentacion | Descripcion |
|---|---|---|
| **Editor de bloques** | [EDITOR.md](docs/EDITOR.md) | Markdown completo, callouts, columnas, emoji, KaTeX |
| **Diagramas** | [DIAGRAMS.md](docs/DIAGRAMS.md) | Editor visual con React Flow + Mermaid fallback |
| **Charts / KPIs** | [CHARTS.md](docs/CHARTS.md) | Graficas interactivas con Recharts (bar, line, area, pie) |
| **Kanban** | [KANBAN.md](docs/KANBAN.md) | Tablero de tareas con drag & drop |
| **API Blocks** | [API-BLOCKS.md](docs/API-BLOCKS.md) | Documentar endpoints REST visualmente |
| **Templates** | [TEMPLATES.md](docs/TEMPLATES.md) | PRD, RFC, Sprint, Runbook, Lean Canvas, y mas |
| **MCP Server** | [MCP.md](docs/MCP.md) | 8 herramientas para conectar con Claude, Cursor, Windsurf |
| **Export** | [EXPORT.md](docs/EXPORT.md) | Markdown, HTML, PDF, libro PDF completo |
| **Git Backup** | [BACKUP.md](docs/BACKUP.md) | Auto-backup con isomorphic-git a cualquier repo |
| **Project Wizard** | [PROJECT-WIZARD.md](docs/PROJECT-WIZARD.md) | Wizard guiado que crea proyectos con documentos pre-llenados |

---

## Screenshots

| | |
|---|---|
| ![Editor](docs/screenshots/editor-with-content.png) | ![Dark mode](docs/screenshots/dark-mode.png) |
| ![Slash commands](docs/screenshots/slash-commands.png) | ![Insert menu](docs/screenshots/insert-menu.png) |

---

## Project Wizard

Crea un proyecto completo con un wizard de 5 pasos:

1. **Proyecto** — nombre + carpeta
2. **Tipo** — preset (Startup, App, Franquicia, Completo)
3. **Areas** — elige que documentar (negocio, cliente, producto, marketing, legal...)
4. **Backup** — conecta con GitHub
5. **Crear** — genera paquetes + documentos con contenido guiado

Cada documento incluye:
- **Por que?** — explica la importancia
- **Que escribir?** — instrucciones concretas
- **Ejemplo** — texto real que puedes copiar

---

## Bloques especiales

### Callouts
5 tipos: Note, Tip, Important, Warning, Caution — compatibles con GitHub Flavored Markdown.

### API Endpoints
Documenta REST APIs con method badges, parametros, request body, y responses.

### Charts
Graficas interactivas: edita datos inline y la grafica se actualiza en tiempo real.

### Kanban
Arrastra tarjetas entre columnas. Colores, contadores, edicion inline.

### Diagramas
Editor visual con React Flow. Soporte para flowcharts, state, class, ER, mindmap, sequence, gantt.

### Metadata Cards
Campos estructurados: selects con opciones precargadas, datepicker, texto libre.

---

## MCP Nativo

```json
{
  "mcpServers": {
    "mi-vault": {
      "command": "node",
      "args": ["path/to/kuilo/scripts/docs-mcp.mjs", "/path/to/vault"]
    }
  }
}
```

8 herramientas: `get_vault_summary`, `list_documents`, `read_document`, `search_documents`, `create_document`, `update_document`, `append_blocks`, `get_document_context`.

Conecta con un click desde la app: Claude Desktop, Cursor, Windsurf.

---

## Vault & Formato

```
mi-vault/
  paquete/
    pagina/
      page.json          <- documento estructurado
      versions/          <- snapshots automaticos
    legacy-file.md       <- markdown plano
```

Archivos JSON planos, legibles por humanos, legibles por LLMs, versionables con Git.

---

## Stack

```
Electron 36          frameless, IPC, printToPDF
React 19             UI
Vite 7               build
Tiptap 3             editor de bloques
React Flow           diagramas visuales
Recharts             graficas
@hello-pangea/dnd    kanban drag & drop
isomorphic-git       backup sin CLI
KaTeX                ecuaciones
Mermaid              diagramas (fallback)
MCP SDK              server MCP
```

---

## Desarrollo

```bash
npm install
npm run dev          # Vite dev server
npm run build        # Build
npm run desktop      # Electron
npm test             # 256 tests
```

---

## Licencia

MIT

---

<p align="center">
  <em>Kuilo — del nahuatl tlacuilo, el que documenta.</em>
</p>
