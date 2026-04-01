import { useEffect, useMemo, useRef, useState } from "react";
import {
  pageDocumentToHtml,
  htmlToPageDocument,
} from "@/lib/page-document";
import {
  findPageInPackages,
  filterPages,
  getFirstPage,
  getAncestorPagePaths,
  buildExpandedState,
  normalizeTree,
} from "@/lib/tree-helpers";
import { markdownToHtml, htmlToMarkdown } from "@/lib/markdown-bridge";
import { blocksToMarkdown } from "@/lib/blocks-to-markdown";

const api = window.notesApi;

export function useVault() {
  const [packages, setPackages] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [pageMeta, setPageMeta] = useState({ icon: "", cover: null });
  const [legacyContent, setLegacyContent] = useState("");
  const [pageDocument, setPageDocument] = useState(null);
  const [sourceType, setSourceType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
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
  const [searchResults, setSearchResults] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");

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

      const blocks = result.document.blocks || [];
      const isTiptapJson = blocks.length === 0 || (
        blocks[0]?.content === undefined ||
        Array.isArray(blocks[0]?.content) ||
        blocks[0]?.attrs !== undefined
      );

      if (isTiptapJson) {
        setEditorHtml({ type: "doc", content: blocks });
      } else {
        setEditorHtml(pageDocumentToHtml(result.document));
      }

      const nextVersions = await api.listDocVersions({ packageName: doc.packageName, pagePath: doc.pagePath });
      setVersions(nextVersions || []);
      return;
    }
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

  const toggleExpanded = (key) => {
    setExpandedItems((current) => ({ ...current, [key]: !current[key] }));
  };

  const addPackage = async () => {
    const name = packageDraft.trim();
    if (!name) { setPackageError("Escribe un nombre de paquete."); return; }
    setPackageError("");
    const pkg = await api.createPackage({ name });
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
    const rBlocks = result.document.blocks || [];
    const rIsTiptap = rBlocks.length === 0 || Array.isArray(rBlocks[0]?.content) || rBlocks[0]?.attrs !== undefined;
    setEditorHtml(rIsTiptap ? { type: "doc", content: rBlocks } : pageDocumentToHtml(result.document));
    setVersions(result.versions || []);
    await refreshTree(nextActive);
    setSaveState("Versión restaurada");
  };

  const handleEditorChange = (html, json) => {
    if (!activeDocRef.current) return;

    if (sourceTypeRef.current === "legacy-markdown") {
      const markdown = htmlToMarkdown(html);
      setLegacyContent(markdown);
      scheduleSaveLegacy(markdown);
      return;
    }

    if (sourceTypeRef.current !== "page-json" || !pageDocumentRef.current) return;

    const nextDocument = {
      ...pageDocumentRef.current,
      blocks: json?.content || pageDocumentRef.current.blocks,
    };
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

  return {
    // State
    packages,
    activeDoc,
    pageMeta,
    legacyContent,
    pageDocument,
    sourceType,
    searchQuery,
    expandedItems,
    packageDraft,
    packageFormOpen,
    packageError,
    saveState,
    versions,
    historyOpen,
    jsonViewOpen,
    editorHtml,
    vaultPath,
    searchResults,
    renameTarget,
    renameDraft,
    filteredPackages,

    // Setters needed by UI
    setSearchQuery,
    setPackageDraft,
    setPackageFormOpen,
    setPackageError,
    setHistoryOpen,
    setJsonViewOpen,
    setRenameTarget,
    setRenameDraft,
    setSaveState,

    // Actions
    openDoc,
    refreshTree,
    addPackage,
    addDocToPackage,
    handleChangeVault,
    openDocsFolder,
    deleteDoc,
    startRename,
    confirmRename,
    handleSearch,
    promoteAllLegacy,
    promoteToStructured,
    restoreVersion,
    handleEditorChange,
    handleMetaChange,
    toggleExpanded,
    collectLegacyDocs,
  };
}
