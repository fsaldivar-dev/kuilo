import { useEffect, useState } from "react";
import { htmlToPageDocument } from "@/lib/page-document";
import {
  findPageInPackages,
  getFirstPage,
  getAncestorPagePaths,
  buildExpandedState,
  normalizeTree,
} from "@/lib/tree-helpers";
import { markdownToHtml } from "@/lib/markdown-bridge";

const api = window.notesApi;

export function useVault(editor) {
  const [packages, setPackages] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [sourceType, setSourceType] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [vaultPath, setVaultPath] = useState("");
  const [packageDraft, setPackageDraft] = useState("");
  const [packageFormOpen, setPackageFormOpen] = useState(false);
  const [packageError, setPackageError] = useState("");
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");

  // Sync refs so editor functions can access vault state without circular deps
  useEffect(() => { editor.activeDocRef.current = activeDoc; }, [activeDoc]);
  useEffect(() => { editor.sourceTypeRef.current = sourceType; }, [sourceType]);
  useEffect(() => { editor.setActiveDocRef.current = setActiveDoc; });

  const expandPathToDoc = (doc) => {
    const keys = { [`package:${doc.packageName}`]: true };
    getAncestorPagePaths(doc.pagePath).forEach((pagePath) => {
      keys[`page:${doc.packageName}/${pagePath}`] = true;
    });
    setExpandedItems((current) => ({ ...current, ...keys }));
  };

  const refreshTree = async (nextActive) => {
    const tree = normalizeTree(await api.listTree());
    setPackages(tree);
    if (!nextActive) return;
    const match = findPageInPackages(tree, nextActive);
    if (match) {
      setActiveDoc(match);
      setSourceType(match.sourceType || editor.sourceTypeRef.current);
      expandPathToDoc(match);
    }
  };

  // Keep refreshTree ref current for editor's scheduleSave functions
  useEffect(() => { editor.refreshTreeRef.current = refreshTree; });

  const openDoc = async (doc) => {
    const result = await api.readDoc({ packageName: doc.packageName, pagePath: doc.pagePath });
    const nextActive = { packageName: doc.packageName, pagePath: doc.pagePath, title: result.title };
    setActiveDoc(nextActive);
    setSourceType(result.sourceType || doc.sourceType || "legacy-markdown");
    expandPathToDoc(nextActive);
    await editor.loadDoc(doc, result);
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!api) { editor.setSaveState("Electron requerido"); return; }
      const vault = await api.getVault?.();
      if (vault) setVaultPath(vault.vaultPath);
      const tree = normalizeTree(await api.listTree());
      setPackages(tree);
      setExpandedItems(buildExpandedState(tree));
      const firstPage = getFirstPage(tree);
      if (firstPage) await openDoc(firstPage);
      else editor.setSaveState("Sin páginas");
    };
    bootstrap();
  }, []);

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
    editor.setSaveState("Paquete creado");
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

  const duplicateDoc = async (doc) => {
    if (!activeDoc || !api?.readDoc) return;
    const source = await api.readDoc({ packageName: doc.packageName, pagePath: doc.pagePath });
    const title = `${doc.title} (copia)`;
    const result = await api.createDoc({ packageName: doc.packageName, parentPath: null, title });
    if (source.sourceType === "page-json" && source.document) {
      const newDoc = { ...source.document, meta: { ...source.document.meta, title } };
      await api.saveDoc({ packageName: doc.packageName, pagePath: result.pagePath, sourceType: "page-json", document: newDoc });
    }
    const nextActive = { packageName: result.packageName, pagePath: result.pagePath, title };
    await refreshTree(nextActive);
    await openDoc({ ...nextActive, sourceType: result.sourceType || "page-json" });
    editor.setSaveState("Página duplicada");
  };

  const handleChangeVault = async () => {
    if (!api?.openVaultDialog) return;
    const result = await api.openVaultDialog();
    if (!result.changed) return;
    setVaultPath(result.vaultPath);
    setActiveDoc(null);
    editor.resetEditor();
    const tree = normalizeTree(await api.listTree());
    setPackages(tree);
    setExpandedItems(buildExpandedState(tree));
    const first = getFirstPage(tree);
    if (first) {
      await openDoc({ packageName: first.packageName, pagePath: first.pagePath, sourceType: first.sourceType || "page-json" });
    } else {
      editor.setSaveState("Vault abierto");
    }
  };

  const openDocsFolder = async () => {
    if (!api?.openDocsFolder) return;
    const result = await api.openDocsFolder();
    editor.setSaveState(result?.ok ? "Carpeta abierta" : "No se pudo abrir carpeta");
  };

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const deleteDoc = (packageName, pagePath, title) => {
    if (!api?.deleteDoc) return;
    setDeleteConfirm({ packageName, pagePath, title });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { packageName, pagePath } = deleteConfirm;
    setDeleteConfirm(null);
    await api.deleteDoc({ packageName, pagePath });
    if (activeDoc?.packageName === packageName && activeDoc?.pagePath === pagePath) {
      setActiveDoc(null);
      editor.resetEditor();
    }
    await refreshTree();
    editor.setSaveState("Documento eliminado");
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
    editor.setSaveState("Renombrado");
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
    if (allLegacy.length === 0) { editor.setSaveState("Sin docs legacy"); return; }

    editor.setSaveState(`Promoviendo 0 / ${allLegacy.length}…`);
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
      editor.setSaveState(`Promoviendo ${done} / ${allLegacy.length}…`);
    }

    await refreshTree();
    editor.setSaveState(`${done} docs promovidos`);
  };

  const promoteToStructured = async () => {
    if (!activeDoc || sourceType !== "legacy-markdown") return;
    editor.setSaveState("Promoviendo...");
    const html = markdownToHtml(editor.legacyContent);
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
    editor.setSaveState("Promovido a Structured");
  };

  return {
    // State
    packages,
    activeDoc,
    sourceType,
    expandedItems,
    vaultPath,
    packageDraft,
    packageFormOpen,
    packageError,
    renameTarget,
    renameDraft,
    deleteConfirm,

    // Setters needed by UI
    setPackageDraft,
    setPackageFormOpen,
    setPackageError,
    setRenameTarget,
    setRenameDraft,

    // Actions
    openDoc,
    refreshTree,
    addPackage,
    addDocToPackage,
    duplicateDoc,
    handleChangeVault,
    openDocsFolder,
    deleteDoc,
    executeDelete,
    cancelDelete: () => setDeleteConfirm(null),
    startRename,
    confirmRename,
    promoteAllLegacy,
    promoteToStructured,
    toggleExpanded,
    collectLegacyDocs,
  };
}
