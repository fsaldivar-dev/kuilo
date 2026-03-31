/**
 * export-utils.js
 * Export a Markdown, HTML estático, y preparación para PDF.
 */

import { htmlToMarkdown } from "@/lib/markdown-bridge";

/**
 * Exporta el contenido del editor como archivo descargable.
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta como Markdown (.md)
 */
export function exportMarkdown(html, title = "document") {
  const markdown = htmlToMarkdown(html);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "document";
  downloadFile(markdown, `${slug}.md`, "text/markdown;charset=utf-8");
}

/**
 * Exporta como HTML estático (.html)
 */
export function exportHtml(html, title = "Document") {
  const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      color: #1d1d1f;
      line-height: 1.6;
    }
    h1, h2, h3 { margin-top: 1.5em; }
    pre {
      background: #f5f5f5;
      padding: 14px 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
    }
    code { background: #f0f0f0; padding: 2px 4px; border-radius: 4px; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    blockquote {
      border-left: 3px solid #ddd;
      margin: 1em 0;
      padding: 0.5em 1em;
      color: #555;
    }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    hr { border: none; border-top: 1px solid #e5e5e5; margin: 2em 0; }
    ul[data-type="taskList"] { list-style: none; padding-left: 0; }
    ul[data-type="taskList"] li::before { content: "☐ "; }
    ul[data-type="taskList"] li[data-checked="true"]::before { content: "☑ "; }
  </style>
</head>
<body>
${html}
</body>
</html>`;

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "document";
  downloadFile(fullHtml, `${slug}.html`, "text/html;charset=utf-8");
}

/**
 * Exporta como PDF (usa window.print con stylesheet)
 */
export function exportPdf(html, title = "Document") {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { alert("No se pudo abrir la ventana de impresión. Desbloquea los popups."); return; }

  try {
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    @page { margin: 2cm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1d1d1f;
      line-height: 1.6;
      font-size: 12pt;
    }
    h1 { font-size: 22pt; } h2 { font-size: 16pt; } h3 { font-size: 13pt; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 10pt; }
    code { font-size: 10pt; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; }
    img { max-width: 100%; }
  </style>
</head>
<body>
${html}
<script>window.onload = () => { window.print(); window.close(); }<\/script>
</body>
</html>`);
  printWindow.document.close();
  } catch (e) { console.error("PDF export failed:", e); printWindow.close(); }
}
