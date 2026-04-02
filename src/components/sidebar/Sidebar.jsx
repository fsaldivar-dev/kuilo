import {
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCode2,
  Copy,
  FileText,
  FolderOpen,
  Globe,
  LayoutGrid,
  Star,
  StarOff,
  TerminalSquare,
  FolderPlus,
  FolderTree,
  Pencil,
  Plug,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  vault,
  search,
  onOpenDoc,
  onAddDoc,
  onDuplicateDoc,
  favorites,
  onToggleFavorite,
  onExportBook,
  onPublishSite,
  onOpenWizard,
  onOpenConnectors,
  onOpenWorkflow,
  onOpenChat,
  onOpenTerminal,
}) {
  const addDoc = onAddDoc || vault.addDocToPackage;
  const openDoc = onOpenDoc || vault.openDoc;
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
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {collapsed && (
        <div className="collapsed-rail">
          <button className="collapsed-rail-btn" onClick={onOpenChat} title="Kuilo AI" aria-label="Abrir chat AI">
            <Bot size={16} />
          </button>
          <button className="collapsed-rail-btn" onClick={() => { onToggleCollapsed(); }} title="Buscar" aria-label="Buscar">
            <Search size={16} />
          </button>
          <button className="collapsed-rail-btn" onClick={() => onAddDoc?.(vault.packages[0]?.name)} title="Nueva página" aria-label="Nueva página">
            <Plus size={16} />
          </button>
        </div>
      )}

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
              aria-label="Buscar en títulos y contenido"
            />
            {search.searchQuery && (
              <button className="search-clear" onClick={() => search.handleSearch("")} aria-label="Limpiar búsqueda">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Search results */}
          <SearchResults search={search} onOpenDoc={openDoc} />

          {/* Package tree */}
          <nav className="nav-tree" style={search.searchResults && search.searchQuery.trim() ? { display: "none" } : undefined}>
            {search.filteredPackages.length === 0 && (
              <p className="nav-tree-empty">
                {search.searchQuery.trim()
                  ? `Sin resultados para "${search.searchQuery}"`
                  : "Sin páginas aún. Crea tu primer paquete."}
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
                    {onOpenWorkflow && (
                      <button
                        className="icon-btn"
                        onClick={() => onOpenWorkflow(pkg.name)}
                        title="Workflow board"
                        aria-label="Workflow board"
                      >
                        <LayoutGrid size={11} />
                      </button>
                    )}
                    <button
                      className="icon-btn"
                      onClick={() => addDoc(pkg.name)}
                      title="Nueva página"
                      aria-label="Nueva página"
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
                          onOpen={openDoc}
                          onDuplicate={onDuplicateDoc}
                          favorites={favorites}
                          onToggleFavorite={onToggleFavorite}
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
            onOpenChat={onOpenChat}
            onOpenTerminal={onOpenTerminal}
          />
        </>
      )}
    </aside>
  );
}

function SearchResults({ search, onOpenDoc }) {
  if (!search.searchResults || !search.searchQuery.trim()) return null;

  const highlight = (text, query) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return <>{text.slice(0, idx)}<mark>{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</>;
  };

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
            <span className="search-result-title">{highlight(r.title, search.searchQuery)}</span>
            <span className="search-result-snippet">{highlight(r.snippet, search.searchQuery)}</span>
          </button>
        ))
      )}
    </div>
  );
}

function SidebarFooter({ vault, onExportBook, onPublishSite, onOpenWizard, onOpenConnectors, onOpenChat, onOpenTerminal }) {
  if (vault.packageFormOpen) {
    return (
      <div className="sidebar-footer">
        <div className="pkg-form">
          <label className="pkg-form-label">Nombre del paquete</label>
          <input
            type="text"
            placeholder="ej. ingeniería, marketing, notas"
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
            aria-label="Nombre del paquete"
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
      {/* Crear */}
      <div className="footer-group">
        <button
          className="footer-btn primary"
          onClick={() => vault.setPackageFormOpen(true)}
        >
          <FolderPlus size={13} />
          Nuevo paquete
        </button>
        <button className="footer-btn wizard-btn" onClick={onOpenWizard}>
          <Plus size={13} />
          Nuevo proyecto
        </button>
      </div>

      {/* Herramientas */}
      <div className="footer-group">
        <button className="footer-btn connectors-btn" onClick={onOpenConnectors}>
          <Plug size={13} />
          Conectores AI
        </button>
        {onOpenChat && (
          <button className="footer-btn ai-chat-btn" onClick={onOpenChat}>
            <Bot size={13} />
            Kuilo AI
          </button>
        )}
        {onOpenTerminal && (
          <button className="footer-btn terminal-btn" onClick={onOpenTerminal}>
            <TerminalSquare size={13} />
            Terminal
          </button>
        )}
      </div>

      {/* Exportar */}
      <div className="footer-group">
        <button className="footer-btn book-btn" onClick={onExportBook}>
          <Download size={13} />
          Exportar libro PDF
        </button>
        <button className="footer-btn publish-btn" onClick={onPublishSite}>
          <Globe size={13} />
          Publicar en web
        </button>
        {vault.packages.flatMap((pkg) => vault.collectLegacyDocs(pkg.pages || [])).length > 0 && (
          <button className="footer-btn promote-all-btn" onClick={vault.promoteAllLegacy} title="Convierte todos los .md a page.json estructurado">
            <FileCode2 size={13} />
            Promover todo a Structured
          </button>
        )}
      </div>

      {/* Sistema */}
      <div className="footer-group">
        <button className="footer-btn" onClick={vault.openDocsFolder}>
          <FolderOpen size={13} />
          Abrir carpeta
        </button>
        <button className="footer-btn vault-btn" onClick={vault.handleChangeVault} title={vault.vaultPath}>
          <FolderTree size={13} />
          {vault.vaultPath ? vault.vaultPath.split("/").pop() : "Cambiar vault"}
        </button>
      </div>
    </div>
  );
}

function PageTreeNode({ page, depth, activeDoc, expandedItems, onToggle, onOpen, onAddChild, onDelete, onRename, onDuplicate, favorites, onToggleFavorite }) {
  const key = `page:${page.packageName}/${page.pagePath}`;
  const docId = `${page.packageName}/${page.pagePath}`;
  const expanded = expandedItems[key];
  const isActive = activeDoc?.packageName === page.packageName && activeDoc?.pagePath === page.pagePath;
  const hasChildren = page.children.length > 0;
  const isFav = favorites?.has(docId);

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
          className={`doc-item ${isActive ? "active" : ""} ${isFav ? "favorite" : ""}`}
          onClick={() => onOpen(page)}
        >
          {isFav && <Star size={9} className="fav-star" />}
          <FileText size={12} style={{ flexShrink: 0 }} />
          <span className="doc-label">{page.title}</span>
        </button>
        <button className="icon-btn" onClick={() => onToggleFavorite?.(docId)} title={isFav ? "Quitar favorito" : "Favorito"} aria-label={isFav ? "Quitar favorito" : "Favorito"}>
          {isFav ? <StarOff size={10} /> : <Star size={10} />}
        </button>
        <button className="icon-btn" onClick={() => onRename(page)} title="Renombrar" aria-label="Renombrar">
          <Pencil size={10} />
        </button>
        <button className="icon-btn" onClick={() => onDuplicate?.(page)} title="Duplicar" aria-label="Duplicar">
          <Copy size={10} />
        </button>
        <button className="icon-btn" onClick={() => onAddChild(page.packageName, page.pagePath)} title="Nueva subpágina" aria-label="Nueva subpágina">
          <Plus size={11} />
        </button>
        <button className="icon-btn icon-btn-danger" onClick={() => onDelete(page.packageName, page.pagePath, page.title)} title="Eliminar" aria-label="Eliminar">
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
              onDuplicate={onDuplicate}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
