/**
 * Wiki link resolver and backlink scanner.
 * Pure functions — no React, no side effects.
 */

/**
 * Resolve a wiki link title to a page in the vault.
 * Matches by exact title (case-insensitive).
 * Returns { packageName, pagePath, title } or null.
 */
export function resolveWikiLink(packages, title) {
  const target = title.toLowerCase().trim();
  for (const pkg of packages) {
    const match = findByTitle(pkg.pages || [], target, pkg.name);
    if (match) return match;
  }
  return null;
}

function findByTitle(pages, target, packageName) {
  for (const page of pages) {
    if (page.title.toLowerCase().trim() === target) {
      return { packageName, pagePath: page.pagePath, title: page.title };
    }
    if (page.children?.length) {
      const child = findByTitle(page.children, target, packageName);
      if (child) return child;
    }
  }
  return null;
}

/**
 * Extract all wiki link titles from a document's blocks.
 * Walks Tiptap JSON looking for marks with type "wikiLink".
 */
export function extractWikiLinks(blocks = []) {
  const links = [];
  const walk = (nodes) => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === "wikiLink" && mark.attrs?.title) {
            links.push(mark.attrs.title);
          }
        }
      }
      if (Array.isArray(node.content)) walk(node.content);
    }
  };
  walk(blocks);
  return [...new Set(links)];
}

/**
 * Find all pages that link TO a given page title.
 * Returns [{ packageName, pagePath, title }]
 *
 * Note: requires pre-scanned link data. Call scanAllLinks first
 * to build the index, then query it.
 */
export function findBacklinks(linkIndex, targetTitle) {
  const target = targetTitle.toLowerCase().trim();
  return linkIndex
    .filter((entry) => entry.links.some((l) => l.toLowerCase().trim() === target))
    .map(({ packageName, pagePath, title }) => ({ packageName, pagePath, title }));
}

/**
 * Build a link index from all packages.
 * Each entry: { packageName, pagePath, title, links: string[] }
 *
 * This needs the blocks of each doc — pass a reader function.
 * For in-memory use (MCP/offline), pass pre-loaded blocks.
 */
export function buildLinkIndex(packages, docBlocks) {
  const index = [];
  const walk = (pages, packageName) => {
    for (const page of pages) {
      const key = `${packageName}/${page.pagePath}`;
      const blocks = docBlocks[key];
      if (blocks) {
        index.push({
          packageName,
          pagePath: page.pagePath,
          title: page.title,
          links: extractWikiLinks(blocks),
        });
      }
      if (page.children?.length) walk(page.children, packageName);
    }
  };
  for (const pkg of packages) walk(pkg.pages || [], pkg.name);
  return index;
}
