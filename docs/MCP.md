# MCP Server

Kuilo incluye un servidor MCP genérico que conecta tu vault con cualquier LLM.

## Setup

```bash
node scripts/docs-mcp.mjs /path/to/vault
```

O desde la app: **Conectores AI** → seleccionar herramienta → **Conectar**.

## Herramientas (13)

### Lectura

| Tool | Descripción |
|---|---|
| `get_vault_summary` | Resumen del vault: paquetes, documentos, conteo |
| `list_documents` | Árbol completo filtrable por paquete |
| `read_document` | Lee un page.json completo |
| `search_documents` | Búsqueda full-text en contenido |
| `get_document_context` | Resumen compacto: headings, párrafos, wordCount |
| `list_versions` | Lista snapshots históricos de un documento |

### Escritura

| Tool | Descripción |
|---|---|
| `create_document` | Crea un nuevo page.json |
| `update_document` | Reemplaza bloques con snapshot automático |
| `append_blocks` | Agrega al final sin tocar lo existente |
| `delete_document` | Elimina documento y su carpeta |
| `rename_document` | Cambia el título (meta.title) |
| `update_meta` | Actualiza icon/cover/title sin tocar bloques |

### Validación

| Tool | Descripción |
|---|---|
| `validate_document` | Verifica estructura: meta, blocks, types |

## Conectores soportados

- **Claude Desktop** — `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Cursor** — `~/.cursor/mcp.json`
- **Windsurf** — `~/.codeium/windsurf/mcp_config.json`

## Seguridad

- Solo expone documentos `page.json` (structured)
- Archivos `.md` se listan pero no se leen via MCP
- Path traversal protegido con `safeResolve()`
- Errores devuelven `{ error, isError: true }` — nunca timeout
