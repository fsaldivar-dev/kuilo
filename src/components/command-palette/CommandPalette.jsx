import { useEffect, useRef, useState } from "react";
import { Search, FileText, FolderPlus, Plus, Settings, Download, Plug } from "lucide-react";

/**
 * Cmd+K command palette — global quick actions + document navigation.
 */
export function CommandPalette({ open, onClose, commands }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = query.trim()
    ? commands.filter((c) => {
        const q = query.toLowerCase();
        return c.title.toLowerCase().includes(q)
          || c.keywords?.some((k) => k.toLowerCase().includes(q));
      })
    : commands;

  useEffect(() => {
    if (open) { setQuery(""); setSelectedIndex(0); }
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].execute();
        onClose();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [open, filtered, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    listRef.current?.children[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input-row">
          <Search size={16} />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Buscar comando o página..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="palette-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="palette-empty">Sin resultados</div>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              className={`palette-item ${i === selectedIndex ? "selected" : ""}`}
              onClick={() => { cmd.execute(); onClose(); }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="palette-icon">{cmd.icon || <FileText size={14} />}</span>
              <span className="palette-item-text">
                <span className="palette-title">{cmd.title}</span>
                {cmd.description && <span className="palette-desc">{cmd.description}</span>}
              </span>
              {cmd.shortcut && <kbd className="palette-kbd">{cmd.shortcut}</kbd>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Build the command list from app state.
 * Called on each render so doc list stays current.
 */
export function buildPaletteCommands({ vault, search, onOpenWizard, onOpenConnectors, onExportBook }) {
  const commands = [];

  // Navigation: all pages in all packages
  const walkPages = (pages, packageName) => {
    for (const page of pages) {
      commands.push({
        id: `doc:${packageName}/${page.pagePath}`,
        title: page.title,
        description: packageName,
        keywords: [packageName, page.pagePath],
        icon: <FileText size={14} />,
        execute: () => vault.openDoc(page),
      });
      if (page.children?.length) walkPages(page.children, packageName);
    }
  };
  for (const pkg of vault.packages) walkPages(pkg.pages || [], pkg.name);

  // App actions
  commands.push({
    id: "action:new-package",
    title: "Nuevo paquete",
    description: "Crear un nuevo paquete de documentos",
    keywords: ["crear", "package", "paquete", "nuevo"],
    icon: <FolderPlus size={14} />,
    execute: () => vault.setPackageFormOpen(true),
  });

  commands.push({
    id: "action:new-project",
    title: "Nuevo proyecto",
    description: "Abrir el wizard de proyecto",
    keywords: ["proyecto", "wizard", "crear"],
    icon: <Plus size={14} />,
    execute: onOpenWizard,
  });

  commands.push({
    id: "action:connectors",
    title: "Conectores AI",
    description: "Configurar MCP y Git backup",
    keywords: ["mcp", "claude", "cursor", "ai", "backup", "git"],
    icon: <Plug size={14} />,
    execute: onOpenConnectors,
  });

  commands.push({
    id: "action:export-book",
    title: "Exportar libro PDF",
    description: "Exportar todo el vault como libro",
    keywords: ["pdf", "libro", "export", "descargar"],
    icon: <Download size={14} />,
    execute: onExportBook,
  });

  commands.push({
    id: "action:open-folder",
    title: "Abrir carpeta del vault",
    keywords: ["folder", "carpeta", "explorador", "finder"],
    icon: <Settings size={14} />,
    execute: () => vault.openDocsFolder(),
  });

  commands.push({
    id: "action:change-vault",
    title: "Cambiar vault",
    keywords: ["vault", "cambiar", "directorio"],
    icon: <Settings size={14} />,
    execute: () => vault.handleChangeVault(),
  });

  return commands;
}
