# Export


![Export](screenshots/full-app.png)

Kuilo exporta documentos en múltiples formatos.

## Formatos

### Markdown (.md)
- Usa `blocksToMarkdown()` que convierte todos los bloques, incluyendo:
  - Charts → Mermaid `xychart-beta` o `pie`
  - Diagrams → Mermaid code blocks
  - API Endpoints → tablas + code blocks
  - Metadata Cards → tablas key/value
  - Callouts → `> [!NOTE]` / `> [!WARNING]` (GitHub Flavored)
  - Kanban → headings + task lists

### HTML (.html)
- Documento standalone con CSS embebido
- Tipografía, tablas, code blocks, blockquotes
- Abre en cualquier navegador

### PDF (página individual)
- Usa `printToPDF` de Electron
- Renderiza en un BrowserWindow oculto con estilos completos
- Diálogo para elegir dónde guardar
- Se abre automáticamente al terminar

### PDF Libro (vault completo)
- Exporta TODO el vault como un libro PDF
- Portada con nombre del vault, fecha, total de páginas
- Tabla de contenido con numeración jerárquica
- Cada paquete = capítulo con page-break
- Cada página = sección con contenido completo
- Botón en sidebar: **Exportar libro PDF**

### Publish-to-web (sitio estático)
- Genera una carpeta con archivos `.html` individuales
- Cada página tiene sidebar de navegación por paquete
- Diseño idéntico a la app (sidebar oscuro, contenido claro)
- Diagramas Mermaid renderizados con mermaid.js CDN
- Dark mode automático via `prefers-color-scheme`
- Responsive (mobile-friendly)
- Index.html con landing page y links a todos los docs
- Deployable a GitHub Pages, Netlify, Vercel, o cualquier hosting
- Botón en sidebar: **Publicar en web**

## Markdown ↔ Editor

- **Import**: archivos `.md` se abren en el editor visual via `markdownToHtml()`
- **Edit**: se editan con el mismo editor que page.json
- **Save**: se guardan como `.md` limpio via `htmlToMarkdown()`
- **Promote**: botón "Promover" convierte `.md` a `page.json` structured
