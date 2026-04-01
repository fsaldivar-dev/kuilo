import { useEffect, useRef, useState } from "react";
import {
  pageDocumentToHtml,
  htmlToPageDocument,
} from "@/lib/page-document";
import { markdownToHtml, htmlToMarkdown } from "@/lib/markdown-bridge";
import { diffBlocks } from "@/lib/block-diff";

const api = window.notesApi;

export function useEditorState() {
  const [saveState, setSaveState] = useState("Cargando");
  const [legacyContent, setLegacyContent] = useState("");
  const [pageMeta, setPageMeta] = useState({ icon: "", cover: null });
  const [editorHtml, setEditorHtml] = useState(null);
  const [pageDocument, setPageDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [jsonViewOpen, setJsonViewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [diffEntries, setDiffEntries] = useState(null);
  const [diffVersionLabel, setDiffVersionLabel] = useState("");

  const saveTimeoutRef = useRef(null);
  const pageDocumentRef = useRef(null);
  // These refs are written by useVault to share live values without circular deps
  const activeDocRef = useRef(null);
  const sourceTypeRef = useRef(null);
  const refreshTreeRef = useRef(null);
  const setActiveDocRef = useRef(null);

  useEffect(() => { pageDocumentRef.current = pageDocument; }, [pageDocument]);

  const loadDoc = async (doc, result) => {
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

  const resetEditor = () => {
    setPageDocument(null);
    setEditorHtml(null);
  };

  const scheduleSaveLegacy = (content) => {
    const activeDoc = activeDocRef.current;
    if (!activeDoc) return;
    window.clearTimeout(saveTimeoutRef.current);
    setSaveState("Guardando...");
    saveTimeoutRef.current = window.setTimeout(async () => {
      const result = await api.saveDoc({ packageName: activeDoc.packageName, pagePath: activeDoc.pagePath, content, sourceType: "legacy-markdown" });
      const nextActive = { packageName: result.packageName, pagePath: result.pagePath, title: result.title };
      setActiveDocRef.current?.(nextActive);
      if (result.document) setPageDocument(result.document);
      if (result.versions) setVersions(result.versions);
      await refreshTreeRef.current?.(nextActive);
      setSaveState("Guardado");
    }, 450);
  };

  const scheduleSavePageDocument = (document) => {
    const activeDoc = activeDocRef.current;
    if (!activeDoc) return;
    window.clearTimeout(saveTimeoutRef.current);
    setSaveState("Guardando...");
    saveTimeoutRef.current = window.setTimeout(async () => {
      const result = await api.saveDoc({ packageName: activeDoc.packageName, pagePath: activeDoc.pagePath, sourceType: "page-json", document });
      const nextActive = { packageName: result.packageName, pagePath: result.pagePath, title: result.title };
      setActiveDocRef.current?.(nextActive);
      await refreshTreeRef.current?.(nextActive);
      setSaveState("Guardado");
    }, 450);
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

  const restoreVersion = async (versionFileName) => {
    const activeDoc = activeDocRef.current;
    if (!activeDoc || sourceTypeRef.current !== "page-json") return;
    setSaveState("Restaurando...");
    const result = await api.restoreDocVersion({ packageName: activeDoc.packageName, pagePath: activeDoc.pagePath, versionFileName });
    const nextActive = { packageName: result.packageName, pagePath: result.pagePath, title: result.title };
    setActiveDocRef.current?.(nextActive);
    setPageDocument(result.document);
    const rBlocks = result.document.blocks || [];
    const rIsTiptap = rBlocks.length === 0 || Array.isArray(rBlocks[0]?.content) || rBlocks[0]?.attrs !== undefined;
    setEditorHtml(rIsTiptap ? { type: "doc", content: rBlocks } : pageDocumentToHtml(result.document));
    setVersions(result.versions || []);
    await refreshTreeRef.current?.(nextActive);
    setSaveState("Versión restaurada");
  };

  const compareVersion = async (versionFileName, versionLabel) => {
    const activeDoc = activeDocRef.current;
    if (!activeDoc || !api?.readDocVersion) return;
    const { document: oldDoc } = await api.readDocVersion({
      packageName: activeDoc.packageName,
      pagePath: activeDoc.pagePath,
      versionFileName,
    });
    const oldBlocks = oldDoc?.blocks || [];
    const currentBlocks = pageDocumentRef.current?.blocks || [];
    setDiffEntries(diffBlocks(oldBlocks, currentBlocks));
    setDiffVersionLabel(versionLabel || versionFileName);
  };

  const closeDiff = () => {
    setDiffEntries(null);
    setDiffVersionLabel("");
  };

  return {
    // State
    saveState, setSaveState,
    legacyContent, setLegacyContent,
    pageMeta,
    editorHtml, setEditorHtml,
    pageDocument,
    versions,
    jsonViewOpen, setJsonViewOpen,
    historyOpen, setHistoryOpen,
    diffEntries, diffVersionLabel,
    // Refs (vault writes to these)
    activeDocRef,
    sourceTypeRef,
    refreshTreeRef,
    setActiveDocRef,
    pageDocumentRef,
    // Actions
    loadDoc,
    resetEditor,
    handleEditorChange,
    handleMetaChange,
    restoreVersion,
    compareVersion,
    closeDiff,
  };
}
