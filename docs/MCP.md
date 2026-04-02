# MCP Server

Kuilo incluye un servidor MCP con 19 herramientas que conecta tu vault con cualquier LLM.

![MCP](screenshots/overview.png)

## Setup

```bash
node scripts/docs-mcp.mjs /path/to/vault
```

O desde la app: **Conectores AI** → seleccionar herramienta → **Conectar**.

## Herramientas (19)

### Lectura

| Tool | Descripcion |
|---|---|
| `get_vault_summary` | Resumen del vault: paquetes, documentos, conteo |
| `list_documents` | Arbol completo filtrable por paquete |
| `read_document` | Lee un page.json completo |
| `search_documents` | Busqueda full-text en contenido |
| `get_document_context` | Resumen compacto: headings, parrafos, wordCount |
| `list_versions` | Lista snapshots historicos de un documento |

### Escritura

| Tool | Descripcion |
|---|---|
| `create_document` | Crea un nuevo page.json |
| `update_document` | Reemplaza bloques con snapshot automatico |
| `append_blocks` | Agrega al final sin tocar lo existente |
| `delete_document` | Elimina documento y su carpeta |
| `rename_document` | Cambia el titulo (meta.title) |
| `update_meta` | Actualiza icon/cover/title sin tocar bloques |

### Validacion

| Tool | Descripcion |
|---|---|
| `validate_document` | Verifica estructura: meta, blocks, types |

### Knowledge Base

| Tool | Descripcion |
|---|---|
| `get_execution_graph` | Grafo de 7 fases: que documentar primero y por que |
| `get_next_actions` | Analiza workflows, devuelve siguientes acciones por area |
| `get_workflow_status` | Progreso de un paquete: docs por status, bloqueados |
| `get_methodology` | Guia de metodologia (Shape Up, Stage-Gate, Lean, etc.) |
| `get_tutorial` | Tutorial paso a paso (como escribir PRD, RFC, etc.) |
| `get_rules` | Reglas: definition of done, review checklist |

## Conectores soportados

- **Claude Desktop** — `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Cursor** — `~/.cursor/mcp.json`
- **Windsurf** — `~/.codeium/windsurf/mcp_config.json`

## Seguridad

- Solo expone documentos `page.json` (structured)
- Archivos `.md` se listan pero no se leen via MCP
- Path traversal protegido con `safeResolve()`
