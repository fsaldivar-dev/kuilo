import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCode2,
  FileText,
  FolderOpen,
  FolderPlus,
  FolderTree,
  History,
  Pencil,
  Plug,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import {
  escapeHtml,
  pageDocumentToHtml,
  htmlToPageDocument,
} from "@/lib/page-document";
import { markdownToHtml, htmlToMarkdown } from "@/lib/markdown-bridge";
import { PAGE_TEMPLATES } from "@/lib/page-templates";
import { exportMarkdown, exportHtml, exportPdf } from "@/lib/export-utils";
import { buildBookHtml, BOOK_CSS } from "@/lib/export-book";
import { EmojiPicker } from "@/components/page-identity/EmojiPicker";
import { CoverImage } from "@/components/page-identity/CoverImage";
import { Breadcrumb } from "@/components/page-identity/Breadcrumb";

const api = window.notesApi;

const stripMarkdown = (value = "") =>
  value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_>#-]/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .trim();

const getTitleFromMarkdown = (content = "") => {
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  const firstLine = content
    .split("\n")
    .map((line) => stripMarkdown(line))
    .find(Boolean);
  return firstLine || "Sin título";
};

const findPageByPath = (pages, pagePath) => {
  for (const page of pages) {
    if (page.pagePath === pagePath) return page;
    const child = findPageByPath(page.children || [], pagePath);
    if (child) return child;
  }
  return null;
};

const findPageInPackages = (packages, target) => {
  if (!target) return null;
  const pkg = packages.find((item) => item.name === target.packageName);
  if (!pkg) return null;
  return findPageByPath(pkg.pages || [], target.pagePath);
};

const filterPages = (pages, query) =>
  pages
    .map((page) => ({
      ...page,
      children: filterPages(page.children || [], query),
    }))
    .filter(
      (page) =>
        page.title.toLowerCase().includes(query) || (page.children || []).length > 0
    );

const getFirstPage = (packages) => {
  for (const pkg of packages) {
    if (pkg.pages?.[0]) return pkg.pages[0];
  }
  return null;
};

const getAncestorPagePaths = (pagePath) => {
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

const buildExpandedState = (packages) =>
  Object.fromEntries(packages.map((pkg) => [`package:${pkg.name}`, true]));

const normalizeTree = (rawTree) =>
  rawTree.map((pkg) => ({
    id: pkg.id || pkg.name,
    name: pkg.name,
    // usa pkg.id (no pkg.name) para que __root__ no se convierta en "docs"
    pages: normalizePages(pkg.pages || pkg.docs || [], pkg.id || pkg.name),
  }));

const normalizePages = (pages, packageName) =>
  pages.map((page) => ({
    id: page.id || `${packageName}/${page.pagePath || page.fileName}`,
    packageName,
    pagePath: page.pagePath || page.fileName,
    title: page.title,
    sourceType: page.sourceType || "legacy-markdown",
    children: normalizePages(page.children || [], packageName),
  }));

const renderInlineMarkdown = (text = "") => {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  return html;
};

const renderMarkdownPreview = (markdown = "") => {
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


// ─── App ─────────────────────────────────────────────────────────────

function App() {
  const [packages, setPackages] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [pageMeta, setPageMeta] = useState({ icon: "", cover: null });
  const [legacyContent, setLegacyContent] = useState("");
  const [pageDocument, setPageDocument] = useState(null);
  const [sourceType, setSourceType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [packageDraft, setPackageDraft] = useState("");
  const [packageFormOpen, setPackageFormOpen] = useState(false);
  const [packageError, setPackageError] = useState("");
  const [saveState, setSaveState] = useState("Cargando");
  const [versions, setVersions] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [jsonViewOpen, setJsonViewOpen] = useState(false);
  const [editorHtml, setEditorHtml] = useState(null);
  const [vaultPath, setVaultPath] = useState("");
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [mcpInfo, setMcpInfo] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [backupStatus, setBackupStatus] = useState(null);
  const [backupRemoteUrl, setBackupRemoteUrl] = useState("");
  const [backupToken, setBackupToken] = useState("");

  const saveTimeoutRef = useRef(null);
  const pageDocumentRef = useRef(null);
  const sourceTypeRef = useRef(null);
  const activeDocRef = useRef(null);

  const filteredPackages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return packages;
    return packages
      .map((pkg) => ({
        ...pkg,
        pages: pkg.name.toLowerCase().includes(query)
          ? pkg.pages || []
          : filterPages(pkg.pages || [], query),
      }))
      .filter((pkg) => pkg.name.toLowerCase().includes(query) || pkg.pages.length > 0);
  }, [packages, searchQuery]);

  useEffect(() => { pageDocumentRef.current = pageDocument; }, [pageDocument]);
  useEffect(() => { sourceTypeRef.current = sourceType; }, [sourceType]);
  useEffect(() => { activeDocRef.current = activeDoc; }, [activeDoc]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!api) { setSaveState("Electron requerido"); return; }
      const vault = await api.getVault?.();
      if (vault) setVaultPath(vault.vaultPath);
      const tree = normalizeTree(await api.listTree());
      setPackages(tree);
      setExpandedItems(buildExpandedState(tree));
      const firstPage = getFirstPage(tree);
      if (firstPage) await openDoc(firstPage);
      else setSaveState("Sin páginas");
    };
    bootstrap();
  }, []);

  const expandPathToDoc = (doc) => {
    const keys = { [`package:${doc.packageName}`]: true };
    getAncestorPagePaths(doc.pagePath).forEach((pagePath) => {
      keys[`page:${doc.packageName}/${pagePath}`] = true;
    });
    setExpandedItems((current) => ({ ...current, ...keys }));
  };

  const openDoc = async (doc) => {
    const result = await api.readDoc({ packageName: doc.packageName, pagePath: doc.pagePath });
    const nextActive = { packageName: doc.packageName, pagePath: doc.pagePath, title: result.title };
    setActiveDoc(nextActive);
    setSourceType(result.sourceType || doc.sourceType || "legacy-markdown");
    expandPathToDoc(nextActive);
    setSaveState("Guardado");
    setJsonViewOpen(false);

    if (result.sourceType === "page-json") {
      setPageDocument(result.document);
      setPageMeta({ icon: result.document?.meta?.icon || "", cover: result.document?.meta?.cover || null });
      setLegacyContent("");
      setEditorHtml(pageDocumentToHtml(result.document));
      const nextVersions = await api.listDocVersions({ packageName: doc.packageName, pagePath: doc.pagePath });
      setVersions(nextVersions || []);
      return;
    }
    // Markdown: traducir al vuelo para usar el mismo SimpleEditor
    setPageMeta({ icon: "", cover: null });
    setEditorHtml(markdownToHtml(result.content || ""));
    setLegacyContent(result.content || "");
    setPageDocument(null);
    setVersions([]);
  };

  const refreshTree = async (nextActive) => {
    const tree = normalizeTree(await api.listTree());
    setPackages(tree);
    if (!nextActive) return;
    const match = findPageInPackages(tree, nextActive);
    if (match) {
      setActiveDoc(match);
      setSourceType(match.sourceType || sourceTypeRef.current);
      expandPathToDoc(match);
    }
  };

  const scheduleSaveLegacy = (content) => {
    if (!activeDoc) return;
    window.clearTimeout(saveTimeoutRef.current);
    setSaveState("Guardando...");
    saveTimeoutRef.current = window.setTimeout(async () => {
      const result = await api.saveDoc({ packageName: activeDoc.packageName, pagePath: activeDoc.pagePath, content, sourceType: "legacy-markdown" });
      const nextActive = { packageName: result.packageName, pagePath: result.pagePath, title: result.title };
      setActiveDoc(nextActive);
      if (result.document) setPageDocument(result.document);
      if (result.versions) setVersions(result.versions);
      await refreshTree(nextActive);
      setSaveState("Guardado");
    }, 450);
  };

  const scheduleSavePageDocument = (document) => {
    if (!activeDoc) return;
    window.clearTimeout(saveTimeoutRef.current);
    setSaveState("Guardando...");
    saveTimeoutRef.current = window.setTimeout(async () => {
      const result = await api.saveDoc({ packageName: activeDoc.packageName, pagePath: activeDoc.pagePath, sourceType: "page-json", document });
      const nextActive = { packageName: result.packageName, pagePath: result.pagePath, title: result.title };
      setActiveDoc(nextActive);
      await refreshTree(nextActive);
      setSaveState("Guardado");
    }, 450);
  };

  const onLegacyEditorChange = (event) => {
    const next = event.target.value;
    setLegacyContent(next);
    scheduleSaveLegacy(next);
  };

  const toggleExpanded = (key) => {
    setExpandedItems((current) => ({ ...current, [key]: !current[key] }));
  };

  const addPackage = async () => {
    const name = packageDraft.trim();
    if (!name) { setPackageError("Escribe un nombre de paquete."); return; }
    setPackageError("");
    const pkg = await api.createPackage({ name });
    // Create a default first page so the package is never empty
    const result = await api.createDoc({ packageName: pkg.name, parentPath: null, title: "Página de inicio" });
    const nextActive = { packageName: result.packageName, pagePath: result.pagePath, title: result.title };
    await refreshTree(nextActive);
    setExpandedItems((current) => ({ ...current, [`package:${pkg.name}`]: true }));
    await openDoc({ ...nextActive, sourceType: result.sourceType || "page-json" });
    setPackageDraft("");
    setPackageFormOpen(false);
    setSaveState("Paquete creado");
  };

  const addDocToPackage = async (packageName, parentPath = null, template = null) => {
    const title = template?.title || "Nueva página";
    const result = await api.createDoc({ packageName, parentPath, title });
    const nextActive = { packageName: result.packageName, pagePath: result.pagePath, title: result.title };

    // If template has blocks, save them immediately
    if (template?.blocks) {
      const doc = { ...result.document, blocks: template.blocks, meta: { ...result.document.meta, title } };
      await api.saveDoc({ packageName, pagePath: result.pagePath, sourceType: "page-json", document: doc });
    }

    await refreshTree(nextActive);
    await openDoc({ ...nextActive, sourceType: result.sourceType || "page-json" });
  };

  const handleChangeVault = async () => {
    if (!api?.openVaultDialog) return;
    const result = await api.openVaultDialog();
    if (!result.changed) return;
    setVaultPath(result.vaultPath);
    setActiveDoc(null);
    setPageDocument(null);
    setEditorHtml(null);
    const tree = normalizeTree(await api.listTree());
    setPackages(tree);
    setExpandedItems(buildExpandedState(tree));
    const first = getFirstPage(tree);
    if (first) {
      await openDoc({ packageName: first.packageName, pagePath: first.pagePath, sourceType: first.sourceType || "page-json" });
    } else {
      setSaveState("Vault abierto");
    }
  };

  const openDocsFolder = async () => {
    if (!api?.openDocsFolder) return;
    const result = await api.openDocsFolder();
    setSaveState(result?.ok ? "Carpeta abierta" : "No se pudo abrir carpeta");
  };

  // ── Delete document ──
  const deleteDoc = async (packageName, pagePath, title) => {
    if (!api?.deleteDoc) return;
    if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    await api.deleteDoc({ packageName, pagePath });
    if (activeDoc?.packageName === packageName && activeDoc?.pagePath === pagePath) {
      setActiveDoc(null);
      setEditorHtml(null);
      setPageDocument(null);
    }
    await refreshTree();
    setSaveState("Documento eliminado");
  };

  // ── Rename document ──
  const startRename = (doc) => {
    setRenameTarget(doc);
    setRenameDraft(doc.title);
  };

  const confirmRename = async () => {
    if (!renameTarget || !renameDraft.trim() || !api?.renameDoc) return;
    await api.renameDoc({ packageName: renameTarget.packageName, pagePath: renameTarget.pagePath, title: renameDraft.trim() });
    if (activeDoc?.pagePath === renameTarget.pagePath) {
      setActiveDoc((prev) => ({ ...prev, title: renameDraft.trim() }));
    }
    await refreshTree();
    setRenameTarget(null);
    setSaveState("Renombrado");
  };

  // ── Full-text search ──
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults(null); return; }
    if (api?.searchContent) {
      const results = await api.searchContent({ query: query.trim() });
      setSearchResults(results);
    } else {
      setSearchResults(null);
    }
  };

  // ── Export book ──
  const exportBook = async () => {
    if (!api?.exportBook || !packages.length) return;
    setSaveState("Preparando libro…");
    const bookHtml = await buildBookHtml(
      packages,
      vaultPath ? vaultPath.split("/").pop() : "Documentación",
      (done, total, title) => setSaveState(`Leyendo ${done}/${total}: ${title}`)
    );
    setSaveState("Generando PDF…");
    const vaultName = vaultPath ? vaultPath.split("/").pop() : "book";
    const result = await api.exportBook({ html: bookHtml, title: vaultName, css: BOOK_CSS });
    setSaveState(result?.ok ? "Libro exportado" : "Cancelado");
  };

  // ── Git Backup ──
  const refreshBackupStatus = async () => {
    if (!api?.backupStatus) return;
    try {
      const status = await api.backupStatus();
      setBackupStatus(status);
    } catch {}
  };

  const doBackupCommit = async () => {
    if (!api?.backupCommit) return;
    setSaveState("Haciendo backup…");
    await api.backupCommit({ message: `Manual backup ${new Date().toLocaleString("es-MX")}` });
    await refreshBackupStatus();
    setSaveState("Backup guardado");
  };

  const doBackupPush = async () => {
    if (!api?.backupPush || !backupRemoteUrl || !backupToken) return;
    setSaveState("Subiendo a remoto…");
    try {
      await api.backupPush({ url: backupRemoteUrl, token: backupToken });
      await refreshBackupStatus();
      setSaveState("Push completado");
    } catch (err) {
      setSaveState(`Error: ${err.message}`);
    }
  };

  // ── Conectores AI / MCP ──
  const openConnectors = async () => {
    setConnectorsOpen(true);
    if (api?.getMcpInfo) {
      const info = await api.getMcpInfo();
      setMcpInfo(info);
    }
    await refreshBackupStatus();
  };

  const connectTarget = async (target) => {
    if (!api?.configureAiConnector) return;
    await api.configureAiConnector({ target });
    const info = await api.getMcpInfo();
    setMcpInfo(info);
  };

  const disconnectTarget = async (target) => {
    if (!api?.disconnectAiConnector) return;
    await api.disconnectAiConnector({ target });
    const info = await api.getMcpInfo();
    setMcpInfo(info);
  };

  // Recopila todos los docs legacy del árbol actual (recursivo)
  const collectLegacyDocs = (pages) => {
    const result = [];
    for (const page of pages) {
      if (page.sourceType === "legacy-markdown") result.push(page);
      if (page.children?.length) result.push(...collectLegacyDocs(page.children));
    }
    return result;
  };

  const promoteAllLegacy = async () => {
    const allLegacy = packages.flatMap((pkg) => collectLegacyDocs(pkg.pages || []));
    if (allLegacy.length === 0) { setSaveState("Sin docs legacy"); return; }

    setSaveState(`Promoviendo 0 / ${allLegacy.length}…`);
    let done = 0;

    for (const doc of allLegacy) {
      try {
        const read = await api.readDoc({ packageName: doc.packageName, pagePath: doc.pagePath });
        const html = markdownToHtml(read.content || "");
        const document = htmlToPageDocument(html);
        document.meta = { ...document.meta, title: doc.title };
        await api.promoteDoc({ packageName: doc.packageName, pagePath: doc.pagePath, document, title: doc.title });
      } catch (err) {
        console.error("Error promoviendo", doc.pagePath, err);
      }
      done++;
      setSaveState(`Promoviendo ${done} / ${allLegacy.length}…`);
    }

    await refreshTree();
    setSaveState(`${done} docs promovidos`);
  };

  const promoteToStructured = async () => {
    if (!activeDoc || sourceType !== "legacy-markdown") return;
    setSaveState("Promoviendo...");
    const html = markdownToHtml(legacyContent);
    const document = htmlToPageDocument(html);
    document.meta = { ...document.meta, title: activeDoc.title };
    const result = await api.promoteDoc({
      packageName: activeDoc.packageName,
      pagePath: activeDoc.pagePath,
      document,
      title: activeDoc.title,
    });
    const nextActive = { packageName: result.packageName, pagePath: result.pagePath, title: result.title };
    await refreshTree(nextActive);
    await openDoc({ ...nextActive, sourceType: "page-json" });
    setSaveState("Promovido a Structured");
  };

  const restoreVersion = async (versionFileName) => {
    if (!activeDoc || sourceType !== "page-json") return;
    setSaveState("Restaurando...");
    const result = await api.restoreDocVersion({ packageName: activeDoc.packageName, pagePath: activeDoc.pagePath, versionFileName });
    const nextActive = { packageName: result.packageName, pagePath: result.pagePath, title: result.title };
    setActiveDoc(nextActive);
    setPageDocument(result.document);
    setEditorHtml(pageDocumentToHtml(result.document));
    setVersions(result.versions || []);
    await refreshTree(nextActive);
    setSaveState("Versión restaurada");
  };

  const handleEditorChange = (html) => {
    if (!activeDocRef.current) return;

    if (sourceTypeRef.current === "legacy-markdown") {
      // Bridge: HTML del editor → Markdown → guardar como .md
      const markdown = htmlToMarkdown(html);
      setLegacyContent(markdown);
      scheduleSaveLegacy(markdown);
      return;
    }

    if (sourceTypeRef.current !== "page-json" || !pageDocumentRef.current) return;
    const nextDocument = htmlToPageDocument(html, pageDocumentRef.current);
    pageDocumentRef.current = nextDocument;
    setPageDocument(nextDocument);
    scheduleSavePageDocument(nextDocument);
  };

  const handleMetaChange = (patch) => {
    if (!pageDocumentRef.current) return;
    const nextMeta = { ...pageDocumentRef.current.meta, ...patch };
    const nextDocument = { ...pageDocumentRef.current, meta: nextMeta };
    pageDocumentRef.current = nextDocument;
    setPageDocument(nextDocument);
    setPageMeta((prev) => ({ ...prev, ...patch }));
    scheduleSavePageDocument(nextDocument);
  };

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        {/* Draggable titlebar */}
        <div className="titlebar">
          <img src="./logo.png" alt="Kuilo" className="titlebar-logo" />
          {!sidebarCollapsed && <span className="titlebar-name">Kuilo</span>}
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed((c) => !c)}
            title={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Search */}
            <div className="search-bar">
              <Search size={13} />
              <input
                type="text"
                placeholder="Buscar página..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar en títulos y contenido..."
              />
            </div>

            {/* Search results */}
            {searchResults && searchQuery.trim() && (
              <div className="search-results">
                {searchResults.length === 0 ? (
                  <p className="search-empty">Sin resultados para "{searchQuery}"</p>
                ) : (
                  searchResults.map((r, i) => (
                    <button
                      key={i}
                      className="search-result-item"
                      onClick={() => {
                        openDoc({ packageName: r.packageName, pagePath: r.pagePath, sourceType: r.sourceType });
                        setSearchQuery("");
                        setSearchResults(null);
                      }}
                    >
                      <span className="search-result-title">{r.title}</span>
                      <span className="search-result-snippet">{r.snippet}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Package tree */}
            <nav className="nav-tree" style={searchResults && searchQuery.trim() ? { display: "none" } : undefined}>
              {filteredPackages.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, padding: "8px 12px" }}>
                  Sin páginas aún
                </p>
              )}
              {filteredPackages.map((pkg) => {
                const packageKey = `package:${pkg.name}`;
                const packageExpanded = expandedItems[packageKey];
                return (
                  <section className="pkg-section" key={pkg.id}>
                    <div className="pkg-header">
                      <button
                        className="pkg-toggle"
                        onClick={() => toggleExpanded(packageKey)}
                      >
                        {packageExpanded
                          ? <ChevronDown size={11} />
                          : <ChevronRight size={11} />}
                        <FolderTree size={11} />
                        <span>{pkg.name}</span>
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => addDocToPackage(pkg.name)}
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
                            activeDoc={activeDoc}
                            expandedItems={expandedItems}
                            onToggle={toggleExpanded}
                            onOpen={openDoc}
                            onAddChild={addDocToPackage}
                            onDelete={deleteDoc}
                            onRename={startRename}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
              {packageFormOpen ? (
                <div className="pkg-form">
                  <input
                    type="text"
                    placeholder="ej. engineering"
                    value={packageDraft}
                    onChange={(e) => {
                      setPackageDraft(e.target.value);
                      if (packageError) setPackageError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addPackage();
                      if (e.key === "Escape") {
                        setPackageFormOpen(false);
                        setPackageDraft("");
                        setPackageError("");
                      }
                    }}
                    autoFocus
                  />
                  <div className="pkg-form-row">
                    <button
                      className="pkg-form-cancel"
                      onClick={() => { setPackageFormOpen(false); setPackageDraft(""); setPackageError(""); }}
                    >
                      Cancelar
                    </button>
                    <button className="pkg-form-submit" onClick={addPackage}>
                      Crear
                    </button>
                  </div>
                  {packageError && <p className="pkg-form-error">{packageError}</p>}
                </div>
              ) : (
                <>
                  <button
                    className="footer-btn primary"
                    onClick={() => setPackageFormOpen(true)}
                  >
                    <FolderPlus size={13} />
                    Nuevo paquete
                  </button>
                  <button className="footer-btn" onClick={openDocsFolder}>
                    <FolderOpen size={13} />
                    Abrir carpeta
                  </button>
                  <button className="footer-btn vault-btn" onClick={handleChangeVault} title={vaultPath}>
                    <FolderTree size={13} />
                    {vaultPath ? vaultPath.split("/").pop() : "Cambiar vault"}
                  </button>
                  {packages.flatMap((pkg) => collectLegacyDocs(pkg.pages || [])).length > 0 && (
                    <button className="footer-btn promote-all-btn" onClick={promoteAllLegacy} title="Convierte todos los .md a page.json estructurado">
                      <FileCode2 size={13} />
                      Promover todo a Structured
                    </button>
                  )}
                  <button className="footer-btn book-btn" onClick={exportBook}>
                    <Download size={13} />
                    Exportar libro PDF
                  </button>
                  <button className="footer-btn connectors-btn" onClick={openConnectors}>
                    <Plug size={13} />
                    Conectores AI
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </aside>

      {/* ── Workspace ── */}
      <main className="workspace">
        {sidebarCollapsed && (
          <button
            className="sidebar-expand-btn"
            onClick={() => setSidebarCollapsed(false)}
            title="Expandir sidebar"
          >
            <ChevronRight size={14} />
          </button>
        )}
        {!activeDoc ? (
          <div className="empty-state">
            <FileText size={52} />
            <h2>Sin página seleccionada</h2>
            <p>Elige una página del panel izquierdo o crea una nueva.</p>
          </div>
        ) : (
          <>
            {/* Cover image */}
            {sourceType === "page-json" && (
              <CoverImage
                cover={pageMeta.cover}
                onChange={(cover) => handleMetaChange({ cover })}
              />
            )}

            {/* Document header */}
            <div className="doc-header">
              <div className="doc-meta">
                <Breadcrumb activeDoc={activeDoc} onNavigate={openDoc} />
                <div className="doc-title-row">
                  {sourceType === "page-json" && (
                    <EmojiPicker
                      value={pageMeta.icon}
                      onChange={(icon) => handleMetaChange({ icon })}
                    />
                  )}
                  <h1 className="doc-title">{activeDoc.title}</h1>
                </div>
              </div>
              <div className="doc-controls">
                <span className="save-indicator">
                  <span className={`save-dot ${saveState === "Guardando..." || saveState === "Restaurando..." ? "saving" : ""}`} />
                  {saveState}
                </span>
                <span className={`source-badge ${sourceType || "none"}`}>
                  {sourceType === "page-json" ? "Structured" : sourceType === "legacy-markdown" ? "Legacy" : "—"}
                </span>
                {sourceType === "legacy-markdown" && (
                  <button
                    className="control-btn promote-btn"
                    onClick={promoteToStructured}
                    title="Convertir a Structured (page.json)"
                  >
                    Promover
                  </button>
                )}
                {sourceType === "page-json" && (
                  <>
                    <button
                      className={`control-btn ${jsonViewOpen ? "active" : ""}`}
                      onClick={() => setJsonViewOpen((c) => !c)}
                      title="Ver JSON"
                    >
                      <FileCode2 size={13} />
                      JSON
                    </button>
                    <button
                      className={`control-btn ${historyOpen ? "active" : ""}`}
                      onClick={() => setHistoryOpen((c) => !c)}
                      title="Historial de versiones"
                    >
                      <History size={13} />
                      Historial
                    </button>
                  </>
                )}
                {activeDoc && (
                  <div className="export-group">
                    <button
                      className="control-btn"
                      onClick={() => {
                        const el = document.querySelector(".simple-editor");
                        if (el) exportMarkdown(el.innerHTML, activeDoc.title);
                      }}
                      title="Exportar Markdown"
                    >
                      <Download size={13} /> .md
                    </button>
                    <button
                      className="control-btn"
                      onClick={() => {
                        const el = document.querySelector(".simple-editor");
                        if (el) exportHtml(el.innerHTML, activeDoc.title);
                      }}
                      title="Exportar HTML"
                    >
                      <Download size={13} /> .html
                    </button>
                    <button
                      className="control-btn"
                      onClick={async () => {
                        const el = document.querySelector(".simple-editor");
                        if (!el) return;
                        if (api?.exportPdf) {
                          setSaveState("Generando PDF…");
                          const result = await api.exportPdf({ html: el.innerHTML, title: activeDoc.title });
                          setSaveState(result?.ok ? "PDF exportado" : "Cancelado");
                        } else {
                          exportPdf(el.innerHTML, activeDoc.title);
                        }
                      }}
                      title="Exportar PDF"
                    >
                      <Download size={13} /> PDF
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Editor area */}
            <div className="editor-area">
              {sourceType === "page-json" && jsonViewOpen ? (
                <div className="json-canvas">
                  <pre>{JSON.stringify(pageDocument, null, 2)}</pre>
                </div>
              ) : (
                <SimpleEditor
                  key={activeDoc?.pagePath}
                  initialContent={editorHtml}
                  onContentChange={handleEditorChange}
                />
              )}

              {/* History panel */}
              {historyOpen && sourceType === "page-json" && (
                <aside className="history-panel">
                  <div className="history-header">
                    <h3>Historial</h3>
                    <button className="history-close" onClick={() => setHistoryOpen(false)}>
                      <X size={13} />
                    </button>
                  </div>
                  <div className="history-list">
                    {versions.length === 0 ? (
                      <p className="history-empty">Aún no hay snapshots guardados.</p>
                    ) : (
                      versions.map((version) => (
                        <div className="history-item" key={version.id}>
                          <div className="history-item-info">
                            <strong>v{version.version}</strong>
                            <time>
                              {version.savedAt
                                ? new Date(version.savedAt).toLocaleString("es-MX", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Sin fecha"}
                            </time>
                          </div>
                          <button
                            className="restore-btn"
                            onClick={() => restoreVersion(version.fileName)}
                          >
                            Restaurar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </aside>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── Rename modal ── */}
      {renameTarget && (
        <div className="connectors-overlay" onClick={() => setRenameTarget(null)}>
          <div className="rename-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Renombrar página</h3>
            <input
              type="text"
              className="rename-input"
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setRenameTarget(null); }}
              autoFocus
            />
            <div className="rename-actions">
              <button className="rename-cancel" onClick={() => setRenameTarget(null)}>Cancelar</button>
              <button className="rename-confirm" onClick={confirmRename}>Renombrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Connectors modal ── */}
      {connectorsOpen && (
        <div className="connectors-overlay" onClick={() => setConnectorsOpen(false)}>
          <div className="connectors-modal" onClick={(e) => e.stopPropagation()}>
            <div className="connectors-header">
              <h2><Plug size={18} /> Conectores AI</h2>
              <button className="connectors-close" onClick={() => setConnectorsOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {mcpInfo && (
              <div className="connectors-body">
                <div className="connectors-info">
                  <div className="connectors-info-row">
                    <span className="connectors-label">Vault</span>
                    <code className={`connectors-value ${mcpInfo.vaultExists ? "" : "error"}`}>
                      {mcpInfo.vaultPath}
                    </code>
                    {!mcpInfo.vaultExists && <span className="connectors-error-badge">No existe</span>}
                  </div>
                  <div className="connectors-info-row">
                    <span className="connectors-label">MCP Script</span>
                    <code className={`connectors-value ${mcpInfo.scriptExists ? "" : "error"}`}>
                      {mcpInfo.scriptPath}
                    </code>
                    {!mcpInfo.scriptExists && <span className="connectors-error-badge">No encontrado</span>}
                  </div>
                </div>

                <h3>Conectar con</h3>
                <div className="connectors-list">
                  {mcpInfo.targets.map((t) => (
                    <div className={`connector-item ${!t.installed ? "not-installed" : ""}`} key={t.name}>
                      <div className="connector-info">
                        <span className="connector-name">{t.label}</span>
                        {!t.installed ? (
                          <span className="connector-status off">No detectado</span>
                        ) : t.connected && t.configValid ? (
                          <span className="connector-status on">● Config escrita — reinicia la app para activar</span>
                        ) : t.connected && t.error ? (
                          <span className="connector-status warn">⚠ {t.error}</span>
                        ) : (
                          <span className="connector-status off">○ No conectado</span>
                        )}
                      </div>
                      {t.installed && (
                        <button
                          className={`connector-action ${t.connected ? "disconnect" : "connect"}`}
                          onClick={() => t.connected ? disconnectTarget(t.name) : connectTarget(t.name)}
                          disabled={!mcpInfo.scriptExists || !mcpInfo.vaultExists}
                        >
                          {t.connected ? "Desconectar" : "Conectar"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <p className="connectors-hint">
                  Al conectar, se escribe la config MCP en el archivo de cada herramienta.
                  Reinicia la herramienta para que tome efecto.
                </p>

                <h3>Git Backup</h3>
                {backupStatus && (
                  <div className="connectors-info" style={{ marginBottom: 12 }}>
                    <div className="connectors-info-row">
                      <span className="connectors-label">Estado</span>
                      <span className={`connector-status ${backupStatus.hasChanges ? "warn" : "on"}`}>
                        {backupStatus.hasChanges
                          ? `${backupStatus.files?.length || 0} archivos sin backup`
                          : "● Todo respaldado"}
                      </span>
                    </div>
                    {backupStatus.log?.[0] && (
                      <div className="connectors-info-row">
                        <span className="connectors-label">Ultimo</span>
                        <code className="connectors-value">
                          {backupStatus.log[0].message} — {new Date(backupStatus.log[0].date).toLocaleString("es-MX")}
                        </code>
                      </div>
                    )}
                  </div>
                )}
                <button className="connector-action connect" onClick={doBackupCommit} style={{ marginBottom: 10, width: "100%" }}>
                  Hacer backup ahora
                </button>

                <div className="connectors-info" style={{ marginBottom: 8 }}>
                  <div className="connectors-info-row">
                    <span className="connectors-label">Remote URL</span>
                    <input
                      className="rename-input"
                      placeholder="https://github.com/user/repo.git"
                      value={backupRemoteUrl}
                      onChange={(e) => setBackupRemoteUrl(e.target.value)}
                      style={{ fontSize: 12 }}
                    />
                  </div>
                  <div className="connectors-info-row">
                    <span className="connectors-label">Token</span>
                    <input
                      className="rename-input"
                      type="password"
                      placeholder="ghp_xxx o token personal"
                      value={backupToken}
                      onChange={(e) => setBackupToken(e.target.value)}
                      style={{ fontSize: 12 }}
                    />
                  </div>
                </div>
                <button
                  className="connector-action connect"
                  onClick={doBackupPush}
                  disabled={!backupRemoteUrl || !backupToken}
                  style={{ width: "100%" }}
                >
                  Push a remoto
                </button>
                <p className="connectors-hint">
                  Funciona con GitHub, GitLab, Bitbucket, o cualquier repo Git.
                  El token es un Personal Access Token con permisos de escritura.
                </p>
              </div>
            )}

            {!mcpInfo && (
              <div className="connectors-body">
                <p className="connectors-hint">Ejecuta la app desde Electron para usar conectores.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page tree node ───────────────────────────────────────────────────

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

export default App;
