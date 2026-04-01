/**
 * publish-site.js
 * Generates a static website from the vault.
 * Each page becomes its own .html file with sidebar navigation.
 * Output: { files: [{ path, content }], index: string }
 */

import { markdownToHtml } from "@/lib/markdown-bridge";
import { blocksToMarkdown } from "@/lib/blocks-to-markdown";

const api = window.notesApi;

function flattenPages(pages, packageName, depth = 0) {
  const result = [];
  for (const page of pages) {
    const slug = page.pagePath.replace(/\/page\.json$/, "").replace(/\.md$/, "").replace(/[^a-z0-9]+/gi, "-");
    result.push({ ...page, packageName: page.packageName || packageName, slug, depth });
    if (page.children?.length) {
      result.push(...flattenPages(page.children, page.packageName || packageName, depth + 1));
    }
  }
  return result;
}

async function readPageHtml(packageName, pagePath, sourceType) {
  try {
    const result = await api.readDoc({ packageName, pagePath });
    if (result.sourceType === "page-json" || sourceType === "page-json") {
      // Convert Tiptap JSON blocks → Markdown → HTML
      // This preserves diagrams as mermaid code blocks, charts, kanban, etc.
      const blocks = result.document?.blocks || [];
      const md = blocksToMarkdown(blocks);
      return markdownToHtml(md);
    }
    return markdownToHtml(result.content || "");
  } catch {
    return "<p><em>(Error leyendo documento)</em></p>";
  }
}

function buildNav(packages, allPages, activePath) {
  let nav = `<nav class="site-nav">`;
  for (const pkg of packages) {
    const label = (pkg.id || pkg.name) === "__root__" ? "General" : pkg.name;
    nav += `<div class="nav-package"><h3>${label}</h3><ul>`;
    const pages = allPages.filter((p) => p.packageName === (pkg.id || pkg.name));
    for (const page of pages) {
      const active = page.slug === activePath ? ' class="active"' : "";
      const indent = page.depth > 0 ? ` style="padding-left:${page.depth * 14}px"` : "";
      nav += `<li${indent}><a href="${page.slug}.html"${active}>${page.title}</a></li>`;
    }
    nav += `</ul></div>`;
  }
  nav += `</nav>`;
  return nav;
}

function wrapPage(title, nav, content, vaultName) {
  // Convert mermaid code blocks to <pre class="mermaid"> for mermaid.js
  const processedContent = content.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    '<pre class="mermaid">$1</pre>'
  );

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — ${vaultName}</title>
<style>${SITE_CSS}</style>
</head>
<body>
<div class="site-shell">
  <aside class="site-sidebar">
    <div class="site-logo">${vaultName}</div>
    ${nav}
  </aside>
  <main class="site-content">
    <div class="site-content-inner">
      <h1>${title}</h1>
      ${processedContent}
    </div>
  </main>
</div>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"><\/script>
<script>mermaid.initialize({ startOnLoad: true, theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default' });<\/script>
</body>
</html>`;
}

/**
 * Generate the static site.
 * @returns {{ files: Array<{path: string, content: string}> }}
 */
export async function generateSite(packages, vaultName, onProgress) {
  const allPages = [];
  for (const pkg of packages) {
    allPages.push(...flattenPages(pkg.pages || [], pkg.id || pkg.name));
  }

  const files = [];
  let done = 0;

  for (const page of allPages) {
    done++;
    onProgress?.(done, allPages.length, page.title);
    const content = await readPageHtml(page.packageName, page.pagePath, page.sourceType);
    const nav = buildNav(packages, allPages, page.slug);
    const html = wrapPage(page.title, nav, content, vaultName);
    files.push({ path: `${page.slug}.html`, content: html });
  }

  // Index page — landing with links to all docs
  const indexNav = buildNav(packages, allPages, "");
  const indexContent = packages.map((pkg) => {
    const pkgId = pkg.id || pkg.name;
    const label = pkgId === "__root__" ? "General" : pkg.name;
    const pages = allPages.filter((p) => p.packageName === pkgId);
    if (!pages.length) return "";
    const links = pages.map((p) =>
      `<li><a href="${p.slug}.html">${p.title}</a></li>`
    ).join("");
    return `<h2>${label}</h2><ul>${links}</ul>`;
  }).join("");
  const indexHtml = wrapPage("Inicio", indexNav, indexContent, vaultName);
  files.push({ path: "index.html", content: indexHtml });

  return { files, totalPages: allPages.length };
}

const SITE_CSS = `
/* ── Reset ── */
* { margin: 0; padding: 0; box-sizing: border-box; }
html { height: 100%; }
body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif;
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  color: #1d1d1f;
  background: #1c1c1e;
}

/* ── Shell (mirrors .app-shell) ── */
.site-shell { display: flex; min-height: 100vh; }

/* ── Sidebar (mirrors .sidebar) ── */
.site-sidebar {
  width: 256px;
  min-width: 256px;
  background: #1c1c1e;
  border-right: 1px solid rgba(255,255,255,0.07);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  flex-shrink: 0;
}
.site-logo {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: rgba(255,255,255,0.9);
  font-weight: 600;
  font-size: 15px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.nav-package h3 {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: rgba(255,255,255,0.3);
  padding: 16px 16px 4px;
  font-weight: 600;
}
.nav-package ul { list-style: none; }
.nav-package li a {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 16px;
  font-size: 13px;
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  border-radius: 6px;
  margin: 1px 8px;
  transition: background 0.1s, color 0.1s;
}
.nav-package li a:hover { background: rgba(255,255,255,0.06); color: #fff; }
.nav-package li a.active { background: rgba(0,113,227,0.18); color: #64d2ff; font-weight: 600; }

/* ── Content area (mirrors .workspace + editor) ── */
.site-content {
  flex: 1;
  background: #f2f2f7;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.site-content-inner {
  max-width: 740px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 32px 80px;
}

/* ── Typography (mirrors simple-editor) ── */
.site-content h1 {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.4px;
  margin-bottom: 20px;
  line-height: 1.2;
  color: #1d1d1f;
}
.site-content h2 {
  font-size: 21px;
  font-weight: 700;
  margin: 28px 0 10px;
  color: #1d1d1f;
}
.site-content h3 {
  font-size: 17px;
  font-weight: 600;
  margin: 22px 0 8px;
  color: #1d1d1f;
}
.site-content p {
  font-size: 15px;
  line-height: 1.7;
  margin-bottom: 10px;
  color: #3a3a3c;
}
.site-content strong { color: #1d1d1f; }
.site-content ul, .site-content ol { padding-left: 22px; margin-bottom: 10px; }
.site-content li { font-size: 15px; line-height: 1.7; color: #3a3a3c; margin-bottom: 2px; }
.site-content a { color: #0071e3; text-decoration: none; }
.site-content a:hover { text-decoration: underline; }

/* ── Code blocks ── */
.site-content code {
  background: rgba(0,0,0,0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  font-family: "SF Mono", Menlo, Consolas, monospace;
}
.site-content pre {
  background: #1c1c1e;
  color: #f2f2f7;
  padding: 16px 20px;
  border-radius: 10px;
  overflow-x: auto;
  margin: 16px 0;
  font-size: 13px;
  line-height: 1.6;
  font-family: "SF Mono", Menlo, Consolas, monospace;
}
.site-content pre code { background: none; padding: 0; color: inherit; }

/* ── Blockquotes / Callouts ── */
.site-content blockquote {
  border-left: 3px solid #0071e3;
  padding: 12px 16px;
  margin: 14px 0;
  background: rgba(0,113,227,0.04);
  border-radius: 0 8px 8px 0;
  color: #3a3a3c;
}

/* ── Tables ── */
.site-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0;
  font-size: 13px;
  border-radius: 8px;
  overflow: hidden;
}
.site-content th, .site-content td {
  border: 1px solid #e5e5ea;
  padding: 8px 12px;
  text-align: left;
}
.site-content th { background: #e8e8ed; font-weight: 600; color: #1d1d1f; }
.site-content td { color: #3a3a3c; }

/* ── Media ── */
.site-content img { max-width: 100%; border-radius: 8px; margin: 14px 0; }
.site-content hr { border: none; border-top: 1px solid #d1d1d6; margin: 24px 0; }

/* ── Task lists ── */
.site-content input[type="checkbox"] { margin-right: 6px; }

/* ── Mermaid diagrams ── */
.site-content .mermaid {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin: 14px 0;
  text-align: center;
  border: 1px solid #e5e5ea;
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .site-shell { flex-direction: column; }
  .site-sidebar { width: 100%; min-width: 100%; height: auto; position: static; flex-direction: row; overflow-x: auto; }
  .site-logo { padding: 0 16px; white-space: nowrap; }
  .site-content-inner { padding: 24px 16px 60px; }
}

/* ── Dark mode ── */
@media (prefers-color-scheme: dark) {
  body { background: #000; }
  .site-content { background: #1c1c1e; }
  .site-content h1, .site-content h2, .site-content h3, .site-content strong { color: #f5f5f7; }
  .site-content p, .site-content li, .site-content td { color: #aeaeb2; }
  .site-content code { background: rgba(255,255,255,0.08); color: #f2f2f7; }
  .site-content th { background: #2c2c2e; color: #f2f2f7; }
  .site-content th, .site-content td { border-color: #3a3a3c; }
  .site-content blockquote { background: rgba(0,113,227,0.08); color: #aeaeb2; }
  .site-content .mermaid { background: #2c2c2e; border-color: #3a3a3c; }
  .site-content hr { border-top-color: #3a3a3c; }
}
`;
