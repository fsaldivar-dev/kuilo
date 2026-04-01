import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCode2,
  FileText,
  FolderOpen,
  Globe,
  FolderPlus,
  FolderTree,
  Pencil,
  Plug,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  vault,
  search,
  onAddDoc,
  onExportBook,
  onPublishSite,
  onOpenWizard,
  onOpenConnectors,
}) {
  const addDoc = onAddDoc || vault.addDocToPackage;
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Draggable titlebar */}
      <div className="titlebar">
        <img src="./logo.png" alt="Kuilo" className="titlebar-logo" />
        {!collapsed && <span className="titlebar-name">Kuilo</span>}
        <button
          className="collapse-btn"
          onClick={onToggleCollapsed}
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Search */}
          <div className="search-bar">
            <Search size={13} />
            <input
              type="text"
              placeholder="Buscar en títulos y contenido..."
              value={search.searchQuery}
              onChange={(e) => search.handleSearch(e.target.value)}
            />
          </div>

          {/* Search results */}
          <SearchResults search={search} onOpenDoc={vault.openDoc} />

          {/* Package tree */}
          <nav className="nav-tree" style={search.searchResults && search.searchQuery.trim() ? { display: "none" } : undefined}>
            {search.filteredPackages.length === 0 && (
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, padding: "8px 12px" }}>
                Sin páginas aún
              </p>
            )}
            {search.filteredPackages.map((pkg) => {
              const packageKey = `package:${pkg.name}`;
              const packageExpanded = vault.expandedItems[packageKey];
              return (
                <section className="pkg-section" key={pkg.id}>
                  <div className="pkg-header">
                    <button
                      className="pkg-toggle"
                      onClick={() => vault.toggleExpanded(packageKey)}
                    >
                      {packageExpanded
                        ? <ChevronDown size={11} />
                        : <ChevronRight size={11} />}
                      <FolderTree size={11} />
                      <span>{pkg.name}</span>
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => addDoc(pkg.name)}
                      title="Nueva página"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {packageExpanded && (
                    <div className="doc-list">
                      {(pkg.pages || []).map((page) => (
                        <PageTreeNode
                          key={page.id}
                          page={page}
                          depth={0}
                          activeDoc={vault.activeDoc}
                          expandedItems={vault.expandedItems}
                          onToggle={vault.toggleExpanded}
                          onOpen={vault.openDoc}
                          onAddChild={addDoc}
                          onDelete={vault.deleteDoc}
                          onRename={vault.startRename}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </nav>

          {/* Footer */}
          <SidebarFooter
            vault={vault}
            onExportBook={onExportBook}
            onPublishSite={onPublishSite}
            onOpenWizard={onOpenWizard}
            onOpenConnectors={onOpenConnectors}
          />
        </>
      )}
    </aside>
  );
}

function SearchResults({ search, onOpenDoc }) {
  if (!search.searchResults || !search.searchQuery.trim()) return null;

  return (
    <div className="search-results">
      {search.searchResults.length === 0 ? (
        <p className="search-empty">Sin resultados para "{search.searchQuery}"</p>
      ) : (
        search.searchResults.map((r, i) => (
          <button
            key={i}
            className="search-result-item"
            onClick={() => {
              onOpenDoc({ packageName: r.packageName, pagePath: r.pagePath, sourceType: r.sourceType });
              search.handleSearch("");
            }}
          >
            <span className="search-result-title">{r.title}</span>
            <span className="search-result-snippet">{r.snippet}</span>
          </button>
        ))
      )}
    </div>
  );
}

function SidebarFooter({ vault, onExportBook, onPublishSite, onOpenWizard, onOpenConnectors }) {
  if (vault.packageFormOpen) {
    return (
      <div className="sidebar-footer">
        <div className="pkg-form">
          <input
            type="text"
            placeholder="ej. engineering"
            value={vault.packageDraft}
            onChange={(e) => {
              vault.setPackageDraft(e.target.value);
              if (vault.packageError) vault.setPackageError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") vault.addPackage();
              if (e.key === "Escape") {
                vault.setPackageFormOpen(false);
                vault.setPackageDraft("");
                vault.setPackageError("");
              }
            }}
            autoFocus
          />
          <div className="pkg-form-row">
            <button
              className="pkg-form-cancel"
              onClick={() => { vault.setPackageFormOpen(false); vault.setPackageDraft(""); vault.setPackageError(""); }}
            >
              Cancelar
            </button>
            <button className="pkg-form-submit" onClick={vault.addPackage}>
              Crear
            </button>
          </div>
          {vault.packageError && <p className="pkg-form-error">{vault.packageError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-footer">
      <button
        className="footer-btn primary"
        onClick={() => vault.setPackageFormOpen(true)}
      >
        <FolderPlus size={13} />
        Nuevo paquete
      </button>
      <button className="footer-btn" onClick={vault.openDocsFolder}>
        <FolderOpen size={13} />
        Abrir carpeta
      </button>
      <button className="footer-btn vault-btn" onClick={vault.handleChangeVault} title={vault.vaultPath}>
        <FolderTree size={13} />
        {vault.vaultPath ? vault.vaultPath.split("/").pop() : "Cambiar vault"}
      </button>
      {vault.packages.flatMap((pkg) => vault.collectLegacyDocs(pkg.pages || [])).length > 0 && (
        <button className="footer-btn promote-all-btn" onClick={vault.promoteAllLegacy} title="Convierte todos los .md a page.json estructurado">
          <FileCode2 size={13} />
          Promover todo a Structured
        </button>
      )}
      <button className="footer-btn book-btn" onClick={onExportBook}>
        <Download size={13} />
        Exportar libro PDF
      </button>
      <button className="footer-btn publish-btn" onClick={onPublishSite}>
        <Globe size={13} />
        Publicar en web
      </button>
      <button className="footer-btn wizard-btn" onClick={onOpenWizard}>
        <Plus size={13} />
        Nuevo proyecto
      </button>
      <button className="footer-btn connectors-btn" onClick={onOpenConnectors}>
        <Plug size={13} />
        Conectores AI
      </button>
    </div>
  );
}

function PageTreeNode({ page, depth, activeDoc, expandedItems, onToggle, onOpen, onAddChild, onDelete, onRename }) {
  const key = `page:${page.packageName}/${page.pagePath}`;
  const expanded = expandedItems[key];
  const isActive = activeDoc?.packageName === page.packageName && activeDoc?.pagePath === page.pagePath;
  const hasChildren = page.children.length > 0;

  return (
    <div className="tree-node">
      <div className="tree-row" style={{ paddingLeft: `${depth * 14}px` }}>
        <button
          className={`tree-arrow ${!hasChildren ? "placeholder" : ""}`}
          onClick={() => hasChildren && onToggle(key)}
          aria-label={hasChildren ? "Expandir" : "Sin subpáginas"}
        >
          {hasChildren
            ? expanded
              ? <ChevronDown size={11} />
              : <ChevronRight size={11} />
            : null}
        </button>
        <button
          className={`doc-item ${isActive ? "active" : ""}`}
          onClick={() => onOpen(page)}
        >
          <FileText size={12} style={{ flexShrink: 0 }} />
          <span className="doc-label">{page.title}</span>
        </button>
        <button className="icon-btn" onClick={() => onRename(page)} title="Renombrar">
          <Pencil size={10} />
        </button>
        <button className="icon-btn" onClick={() => onAddChild(page.packageName, page.pagePath)} title="Nueva subpágina">
          <Plus size={11} />
        </button>
        <button className="icon-btn icon-btn-danger" onClick={() => onDelete(page.packageName, page.pagePath, page.title)} title="Eliminar">
          <Trash2 size={10} />
        </button>
      </div>

      {hasChildren && expanded && (
        <div className="tree-children">
          {page.children.map((child) => (
            <PageTreeNode
              key={child.id}
              page={child}
              depth={depth + 1}
              activeDoc={activeDoc}
              expandedItems={expandedItems}
              onToggle={onToggle}
              onOpen={onOpen}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}
