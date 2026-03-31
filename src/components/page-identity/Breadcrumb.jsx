/**
 * Breadcrumb — Sprint 2.3
 * Muestra la ruta de navegación: Package › Folder › Página
 */

import { buildBreadcrumbs } from "@/lib/breadcrumbs";
import "./Breadcrumb.scss";

export function Breadcrumb({ activeDoc, onNavigate }) {
  const crumbs = buildBreadcrumbs(activeDoc);
  if (crumbs.length === 0) return null;

  return (
    <nav className="breadcrumb" aria-label="Ruta de navegación">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={`${crumb.type}-${i}`} className="breadcrumb-item">
            {i > 0 && <span className="breadcrumb-sep" aria-hidden="true">›</span>}

            {isLast || !crumb.pagePath ? (
              <span
                className={`breadcrumb-label ${isLast ? "current" : ""}`}
                title={crumb.label}
              >
                {crumb.label}
              </span>
            ) : (
              <button
                className="breadcrumb-label breadcrumb-link"
                onClick={() => onNavigate?.({ packageName: crumb.packageName, pagePath: crumb.pagePath })}
                title={crumb.label}
              >
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
