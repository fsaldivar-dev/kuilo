import { escapeHtml } from "@/lib/page-document";

export const stripMarkdown = (value = "") =>
  value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_>#-]/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .trim();

export const getTitleFromMarkdown = (content = "") => {
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  const firstLine = content
    .split("\n")
    .map((line) => stripMarkdown(line))
    .find(Boolean);
  return firstLine || "Sin título";
};

export const findPageByPath = (pages, pagePath) => {
  for (const page of pages) {
    if (page.pagePath === pagePath) return page;
    const child = findPageByPath(page.children || [], pagePath);
    if (child) return child;
  }
  return null;
};

export const findPageInPackages = (packages, target) => {
  if (!target) return null;
  const pkg = packages.find((item) => item.name === target.packageName);
  if (!pkg) return null;
  return findPageByPath(pkg.pages || [], target.pagePath);
};

export const filterPages = (pages, query) =>
  pages
    .map((page) => ({
      ...page,
      children: filterPages(page.children || [], query),
    }))
    .filter(
      (page) =>
        page.title.toLowerCase().includes(query) || (page.children || []).length > 0
    );

export const getFirstPage = (packages) => {
  for (const pkg of packages) {
    if (pkg.pages?.[0]) return pkg.pages[0];
  }
  return null;
};

export const getAncestorPagePaths = (pagePath) => {
  const segments = pagePath.split("/");
  const directories = segments.slice(0, -1);
  const buffer = [];
  const ancestors = [];
  for (const segment of directories) {
    buffer.push(segment);
    ancestors.push(`${buffer.join("/")}/page.json`);
    ancestors.push(`${buffer.join("/")}.md`);
  }
  return ancestors;
};

export const buildExpandedState = (packages) =>
  Object.fromEntries(packages.map((pkg) => [`package:${pkg.name}`, true]));

export const normalizePages = (pages, packageName) =>
  pages.map((page) => ({
    id: page.id || `${packageName}/${page.pagePath || page.fileName}`,
    packageName,
    pagePath: page.pagePath || page.fileName,
    title: page.title,
    sourceType: page.sourceType || "legacy-markdown",
    children: normalizePages(page.children || [], packageName),
  }));

export const normalizeTree = (rawTree) =>
  rawTree.map((pkg) => ({
    id: pkg.id || pkg.name,
    name: pkg.name,
    pages: normalizePages(pkg.pages || pkg.docs || [], pkg.id || pkg.name),
  }));

export const renderInlineMarkdown = (text = "") => {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  return html;
};

export const renderMarkdownPreview = (markdown = "") => {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(`<pre class="preview-code"><code class="language-${lang}">${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    if (/^\|(.+)\|$/.test(line) && /^\|[\s:-|]+\|$/.test(lines[index + 1] || "")) {
      const headers = line.split("|").slice(1, -1).map((cell) => `<th>${renderInlineMarkdown(cell.trim())}</th>`).join("");
      index += 2;
      const rows = [];
      while (index < lines.length && /^\|(.+)\|$/.test(lines[index])) {
        const cells = lines[index].split("|").slice(1, -1).map((cell) => `<td>${renderInlineMarkdown(cell.trim())}</td>`).join("");
        rows.push(`<tr>${cells}</tr>`);
        index += 1;
      }
      blocks.push(`<table class="managed-table"><thead><tr>${headers}</tr></thead><tbody>${rows.join("")}</tbody></table>`);
      continue;
    }

    if (/^---+$/.test(line.trim())) { blocks.push('<hr class="preview-divider" />'); index += 1; continue; }

    if (/^#{1,3}\s+/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      blocks.push(`<h${level}>${renderInlineMarkdown(line.replace(/^#{1,3}\s+/, ""))}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(`<blockquote class="preview-callout">${quoteLines.map((ql) => `<p>${renderInlineMarkdown(ql)}</p>`).join("")}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(`<li>${renderInlineMarkdown(lines[index].replace(/^[-*]\s+/, ""))}</li>`);
        index += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    const paragraphLines = [];
    while (index < lines.length && lines[index].trim()) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push(`<p>${renderInlineMarkdown(paragraphLines.join(" "))}</p>`);
  }

  return blocks.join("");
};
