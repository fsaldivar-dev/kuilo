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
    <h1>${title}</h1>
    ${processedContent}
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
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1d1d1f; background: #f5f5f7; }
.site-shell { display: flex; min-height: 100vh; }
.site-sidebar { width: 260px; background: #1c1c1e; color: #f2f2f7; padding: 24px 0; flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.site-logo { font-size: 18px; font-weight: 700; padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 12px; }
.site-nav {}
.nav-package h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.35); padding: 12px 20px 4px; }
.nav-package ul { list-style: none; }
.nav-package li a { display: block; padding: 6px 20px; font-size: 13px; color: rgba(255,255,255,0.7); text-decoration: none; transition: background 0.1s, color 0.1s; }
.nav-package li a:hover { background: rgba(255,255,255,0.06); color: #fff; }
.nav-package li a.active { background: rgba(0,113,227,0.2); color: #64d2ff; font-weight: 600; }
.site-content { flex: 1; max-width: 780px; margin: 0 auto; padding: 48px 40px 80px; background: white; min-height: 100vh; box-shadow: 0 0 1px rgba(0,0,0,0.08); }
.site-content h1 { font-size: 32px; font-weight: 800; margin-bottom: 24px; line-height: 1.2; }
.site-content h2 { font-size: 22px; font-weight: 700; margin: 32px 0 12px; }
.site-content h3 { font-size: 17px; font-weight: 600; margin: 24px 0 8px; }
.site-content p { font-size: 15px; line-height: 1.7; margin-bottom: 12px; }
.site-content ul, .site-content ol { padding-left: 24px; margin-bottom: 12px; }
.site-content li { font-size: 15px; line-height: 1.7; }
.site-content a { color: #0071e3; text-decoration: none; }
.site-content a:hover { text-decoration: underline; }
.site-content code { background: #f2f2f7; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
.site-content pre { background: #1c1c1e; color: #f2f2f7; padding: 16px 20px; border-radius: 10px; overflow-x: auto; margin-bottom: 16px; font-size: 13px; line-height: 1.5; }
.site-content blockquote { border-left: 3px solid #0071e3; padding: 12px 16px; margin: 16px 0; background: rgba(0,113,227,0.04); border-radius: 0 8px 8px 0; }
.site-content table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
.site-content th, .site-content td { border: 1px solid #e5e5ea; padding: 8px 12px; text-align: left; }
.site-content th { background: #f2f2f7; font-weight: 600; }
.site-content img { max-width: 100%; border-radius: 8px; margin: 16px 0; }
.site-content hr { border: none; border-top: 1px solid #e5e5ea; margin: 24px 0; }
@media (max-width: 768px) {
  .site-shell { flex-direction: column; }
  .site-sidebar { width: 100%; height: auto; position: static; }
  .site-content { padding: 24px 16px; }
}
@media (prefers-color-scheme: dark) {
  body { background: #000; color: #f2f2f7; }
  .site-content { background: #1c1c1e; color: #f2f2f7; }
  .site-content code { background: #2c2c2e; }
  .site-content th { background: #2c2c2e; }
  .site-content th, .site-content td { border-color: #3a3a3c; }
  .site-content blockquote { background: rgba(0,113,227,0.08); }
}
`;
