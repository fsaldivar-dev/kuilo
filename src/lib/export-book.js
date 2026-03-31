/**
 * export-book.js
 * Genera el HTML completo de un "libro" a partir de todos los paquetes del vault.
 */

import { pageDocumentToHtml } from "@/lib/page-document";
import { markdownToHtml } from "@/lib/markdown-bridge";

const api = window.notesApi;

// ── Flatten tree into ordered list of pages ──────────────────────────────────

function flattenPages(pages, depth = 0) {
  const result = [];
  for (const page of pages) {
    result.push({ ...page, depth });
    if (page.children?.length) {
      result.push(...flattenPages(page.children, depth + 1));
    }
  }
  return result;
}

// ── Read a page and convert to HTML ──────────────────────────────────────────

async function readPageHtml(packageName, pagePath, sourceType) {
  try {
    const result = await api.readDoc({ packageName, pagePath });
    if (result.sourceType === "page-json" || sourceType === "page-json") {
      return pageDocumentToHtml(result.document);
    }
    return markdownToHtml(result.content || "");
  } catch (err) {
    console.error(`Error leyendo ${packageName}/${pagePath}:`, err);
    return "<p><em>(Error leyendo documento)</em></p>";
  }
}

// ── Build the full book HTML ─────────────────────────────────────────────────

export async function buildBookHtml(packages, vaultName, onProgress) {
  const now = new Date().toLocaleDateString("es-MX", {
    year: "numeric", month: "long", day: "numeric",
  });

  // Count total pages for progress
  let totalPages = 0;
  for (const pkg of packages) totalPages += flattenPages(pkg.pages || []).length;

  // ── Cover ──
  let html = `
    <div class="book-cover">
      <h1 class="book-title">${vaultName || "Documentación"}</h1>
      <p class="book-date">${now}</p>
      <p class="book-stats">${packages.length} paquete${packages.length !== 1 ? "s" : ""} · ${totalPages} página${totalPages !== 1 ? "s" : ""}</p>
    </div>
  `;

  // ── Table of Contents ──
  html += `<div class="book-toc"><h2>Tabla de Contenido</h2><ul class="toc-root">`;

  let chapterNum = 0;
  for (const pkg of packages) {
    chapterNum++;
    // pkg.id = real packageName for IPC calls (__root__, etc.)
    // pkg.name = display label (docs, etc.)
    const pkgId = pkg.id || pkg.name;
    const pkgLabel = pkgId === "__root__" ? "General" : pkg.name;
    html += `<li class="toc-chapter"><a href="#ch-${chapterNum}">${chapterNum}. ${pkgLabel}</a>`;

    const pages = flattenPages(pkg.pages || []);
    if (pages.length) {
      html += `<ul>`;
      let secNum = 0;
      for (const page of pages) {
        secNum++;
        const indent = page.depth > 0 ? ` class="toc-indent-${Math.min(page.depth, 3)}"` : "";
        const id = `ch-${chapterNum}-s-${secNum}`;
        html += `<li${indent}><a href="#${id}">${chapterNum}.${secNum} ${page.title}</a></li>`;
      }
      html += `</ul>`;
    }
    html += `</li>`;
  }
  html += `</ul></div>`;

  // ── Chapters ──
  let done = 0;
  chapterNum = 0;

  for (const pkg of packages) {
    chapterNum++;
    const pkgId = pkg.id || pkg.name;
    const pkgLabel = pkgId === "__root__" ? "General" : pkg.name;

    html += `
      <div class="book-chapter" id="ch-${chapterNum}">
        <h1 class="chapter-title"><span class="chapter-num">Capítulo ${chapterNum}</span>${pkgLabel}</h1>
      </div>
    `;

    const pages = flattenPages(pkg.pages || []);
    let secNum = 0;

    for (const page of pages) {
      secNum++;
      done++;
      onProgress?.(done, totalPages, page.title);

      const id = `ch-${chapterNum}-s-${secNum}`;
      // Use page.packageName (set by normalizePages) or pkgId for the IPC call
      const content = await readPageHtml(page.packageName || pkgId, page.pagePath, page.sourceType);
      const depthClass = page.depth > 0 ? ` section-sub` : "";

      html += `
        <div class="book-section${depthClass}" id="${id}">
          <h2 class="section-title">${chapterNum}.${secNum} ${page.title}</h2>
          <div class="section-content">${content}</div>
        </div>
      `;
    }
  }

  return html;
}

// ── Book CSS ─────────────────────────────────────────────────────────────────

export const BOOK_CSS = `
  /* ── Page setup ── */
  @page {
    size: A4;
    margin: 2.2cm 2cm 2.5cm 2cm;
    @bottom-center {
      content: counter(page);
      font-size: 9pt;
      color: #999;
    }
  }

  body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1d1d1f;
    line-height: 1.65;
    font-size: 11pt;
    counter-reset: page;
  }

  /* ── Cover ── */
  .book-cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    text-align: center;
    page-break-after: always;
  }
  .book-title {
    font-size: 32pt;
    font-weight: 800;
    margin-bottom: 16px;
    letter-spacing: -0.02em;
  }
  .book-date {
    font-size: 12pt;
    color: #666;
    margin: 4px 0;
  }
  .book-stats {
    font-size: 10pt;
    color: #999;
    margin-top: 8px;
  }

  /* ── Table of Contents ── */
  .book-toc {
    page-break-after: always;
  }
  .book-toc h2 {
    font-size: 20pt;
    margin-bottom: 20px;
  }
  .toc-root {
    list-style: none;
    padding: 0;
  }
  .toc-root ul {
    list-style: none;
    padding-left: 1.5em;
  }
  .toc-chapter {
    margin: 8px 0;
  }
  .toc-root a {
    color: #1d1d1f;
    text-decoration: none;
    font-size: 11pt;
    line-height: 1.8;
  }
  .toc-root a:hover { text-decoration: underline; }
  .toc-chapter > a {
    font-weight: 700;
    font-size: 12pt;
  }
  .toc-indent-1 { padding-left: 1em; }
  .toc-indent-2 { padding-left: 2em; }
  .toc-indent-3 { padding-left: 3em; }

  /* ── Chapter divider ── */
  .book-chapter {
    page-break-before: always;
    padding-top: 3cm;
    margin-bottom: 1cm;
  }
  .chapter-title {
    font-size: 26pt;
    font-weight: 800;
    border-bottom: 3px solid #1d1d1f;
    padding-bottom: 12px;
  }
  .chapter-num {
    display: block;
    font-size: 11pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #999;
    margin-bottom: 4px;
  }

  /* ── Section (each page) ── */
  .book-section {
    page-break-before: always;
  }
  .book-section.section-sub {
    page-break-before: auto;
    margin-top: 2em;
  }
  .section-title {
    font-size: 16pt;
    font-weight: 700;
    margin-bottom: 0.8em;
    padding-bottom: 6px;
    border-bottom: 1px solid #e5e5ea;
  }

  /* ── Content styles (same as single export) ── */
  h1 { font-size: 22pt; font-weight: 700; margin: 0.8em 0 0.3em; }
  h2 { font-size: 16pt; font-weight: 700; margin: 1em 0 0.3em; }
  h3 { font-size: 13pt; font-weight: 700; margin: 1em 0 0.3em; }
  p { margin: 0.4em 0; }
  pre {
    background: #f5f5f7;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 9pt;
    line-height: 1.5;
    page-break-inside: avoid;
    overflow-x: hidden;
  }
  code {
    font-family: "JetBrains Mono NL", ui-monospace, monospace;
    background: #f0f0f2;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 0.9em;
  }
  pre code { background: none; padding: 0; }
  blockquote {
    border-left: 3px solid #d1d1d6;
    margin: 0.8em 0;
    padding: 0.4em 1em;
    color: #555;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 0.8em 0;
    font-size: 10pt;
    page-break-inside: avoid;
  }
  th, td { border: 1px solid #d1d1d6; padding: 5px 8px; text-align: left; }
  th { background: #f5f5f7; font-weight: 600; }
  img { max-width: 100%; height: auto; border-radius: 6px; page-break-inside: avoid; }
  ul, ol { padding-left: 1.5em; margin: 0.4em 0; }
  hr { border: none; border-top: 1px solid #e5e5ea; margin: 1.5em 0; }
  .columns-layout { display: flex; gap: 12px; }
  .column-item { flex: 1; min-width: 0; }
  .math-source { display: none; }
  .mermaid-controls { display: none; }
  .code-block-header { display: none; }
  .code-block-wrapper { background: #f5f5f7; border-radius: 6px; overflow: hidden; margin: 0.8em 0; page-break-inside: avoid; }
  .code-block-wrapper pre { margin: 0; border: none; }
  .mm-btn, .mm-expand-btn { display: none; }

  /* Avoid section title orphans */
  .section-title { page-break-after: avoid; }
  h1, h2, h3, h4 { page-break-after: avoid; }
`;
