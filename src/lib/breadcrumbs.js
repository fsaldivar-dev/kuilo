/**
 * breadcrumbs.js
 * Calcula la lista de breadcrumbs a partir de un activeDoc.
 *
 * Estructura de resultado:
 *   [
 *     { type: "package", label: "mi-paquete", packageName: "mi-paquete" },
 *     { type: "folder",  label: "guias/inicio", pagePath: null },   // solo si está anidada
 *     { type: "page",    label: "Título",       pagePath: "guias/inicio/page.json", packageName: "..." }
 *   ]
 */

/**
 * @param {{ packageName: string, pagePath: string, title: string } | null | undefined} activeDoc
 * @returns {Array<{ type: string, label: string, pagePath?: string, packageName?: string }>}
 */
export function buildBreadcrumbs(activeDoc) {
  if (!activeDoc) return [];

  const { packageName, pagePath, title } = activeDoc;

  const crumbs = [];

  // 1 — Package (workspace / top-level folder)
  crumbs.push({ type: "package", label: packageName, packageName });

  // 2 — Folder path (si la página está anidada dentro de subcarpetas)
  //     pagePath = "guias/inicio/page.json" → folder = "guias/inicio"
  const folder = pagePath?.replace(/\/?page\.json$/, "");
  if (folder) {
    crumbs.push({ type: "folder", label: folder, pagePath: null });
  }

  // 3 — Página actual (siempre la última)
  crumbs.push({ type: "page", label: title || "Sin título", pagePath, packageName });

  return crumbs;
}
