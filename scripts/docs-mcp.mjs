#!/usr/bin/env node
/**
 * docs-mcp.mjs — MCP server genérico para vaults Kuilo
 *
 * Uso:
 *   node docs-mcp.mjs /absolute/path/to/vault
 *   NOTES_VAULT=/absolute/path/to/vault node docs-mcp.mjs
 *
 * Expone solo documentos page.json (structured).
 * Archivos .md se listan como legacy pero no se exponen via read_document.
 * Usa list_documents para ver qué hay y promote desde la app si necesitas leer .md.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// ─── Vault root ───────────────────────────────────────────────────────────────

const VAULT_ROOT = path.resolve(
  process.argv[2] || process.env.NOTES_VAULT || path.join(process.cwd(), "docs")
);
const RESERVED = new Set(["versions", "assets", "legacy"]);

// ─── File utils ───────────────────────────────────────────────────────────────

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

function safeResolve(base, ...segments) {
  const resolved = path.resolve(base, ...segments);
  if (!resolved.startsWith(base)) throw new Error("Path fuera del vault");
  return resolved;
}

function uid() {
  return Date.now().toString(36) + crypto.randomBytes(3).toString("hex");
}

// ─── Extract all plain text from page.json blocks (deep) ─────────────────────
// Handles both formats:
//   Tiptap JSON:    { content: [{ type: "text", text: "..." }] }
//   pageDocument:   { content: "plain string" }

function extractPlainText(blocks = []) {
  const parts = [];
  const walk = (nodes) => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      // pageDocument format: content is a string
      if (typeof node.content === "string" && node.content) {
        parts.push(node.content);
      }
      // Direct text node
      if (typeof node.text === "string" && node.text) {
        parts.push(node.text);
      }
      // HTML fallback
      if (typeof node.html === "string" && node.html) {
        const stripped = node.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (stripped) parts.push(stripped);
      }
      // Recurse into arrays
      if (Array.isArray(node.content)) walk(node.content);
      if (Array.isArray(node.children)) walk(node.children);
    }
  };
  walk(blocks);
  return parts.join(" ");
}

// ─── Document operations ────────────────────────────────────────────────────

/** Lists only page.json docs. Legacy .md are flagged but not readable via MCP. */
async function listPagesRecursive(dir, relDir = "") {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return []; }
  const nodes = [];

  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name, "es-MX"))) {
    if (e.name.startsWith(".") || e.name.startsWith("_")) continue;

    if (e.isFile() && e.name.endsWith(".md")) {
      // Flag as legacy — not readable via MCP, needs promote
      const rel = relDir ? `${relDir}/${e.name}` : e.name;
      nodes.push({ pagePath: rel, title: e.name.replace(".md", ""), sourceType: "legacy-markdown", children: [] });
      continue;
    }

    if (!e.isDirectory() || RESERVED.has(e.name)) continue;

    const rel = relDir ? `${relDir}/${e.name}` : e.name;
    const pjPath = path.join(dir, e.name, "page.json");
    if (await exists(pjPath)) {
      const doc = await readJson(pjPath);
      nodes.push({
        pagePath: `${rel}/page.json`,
        title: doc.meta?.title || e.name,
        sourceType: "page-json",
        children: await listPagesRecursive(path.join(dir, e.name), rel),
      });
    } else {
      const children = await listPagesRecursive(path.join(dir, e.name), rel);
      if (children.length) nodes.push({ pagePath: rel, title: e.name, sourceType: "directory", children });
    }
  }
  return nodes;
}

async function listAllPackages() {
  let entries;
  try { entries = await fs.readdir(VAULT_ROOT, { withFileTypes: true }); } catch { return []; }
  const packages = [];

  for (const e of entries.filter(e => e.isDirectory() && !e.name.startsWith(".") && !RESERVED.has(e.name))) {
    const pages = await listPagesRecursive(path.join(VAULT_ROOT, e.name));
    if (pages.length) packages.push({ packageName: e.name, pages });
  }

  // Root-level .md files (legacy only)
  const rootMd = entries.filter(e => e.isFile() && e.name.endsWith(".md"));
  if (rootMd.length) {
    packages.push({
      packageName: "__root__",
      pages: rootMd.map(f => ({ pagePath: f.name, title: f.name.replace(".md", ""), sourceType: "legacy-markdown", children: [] })),
    });
  }

  return packages;
}

/** Read only page.json documents. Rejects .md files. */
async function readDocument(packageName, pagePath) {
  if (!pagePath.endsWith("page.json")) {
    throw new Error(`Solo se pueden leer documentos page.json via MCP. "${pagePath}" es legacy markdown — usa la app Kuilo para promoverlo a structured.`);
  }
  const pkgDir = packageName === "__root__" ? VAULT_ROOT : safeResolve(VAULT_ROOT, packageName);
  const fullPath = safeResolve(pkgDir, pagePath);
  return { sourceType: "page-json", document: await readJson(fullPath) };
}

/** Full-text search across all page.json documents. */
async function searchDocuments(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const packages = await listAllPackages();
  const results = [];

  const search = async (pages, packageName) => {
    for (const page of pages) {
      if (page.sourceType !== "page-json") continue; // skip .md in search

      try {
        const pkgDir = packageName === "__root__" ? VAULT_ROOT : safeResolve(VAULT_ROOT, packageName);
        const fullPath = safeResolve(pkgDir, page.pagePath);
        const doc = await readJson(fullPath);
        const text = extractPlainText(doc.blocks || []);
        const title = doc.meta?.title || "";

        if (title.toLowerCase().includes(q) || text.toLowerCase().includes(q)) {
          const idx = text.toLowerCase().indexOf(q);
          results.push({
            packageName,
            pagePath: page.pagePath,
            title,
            snippet: idx >= 0 ? text.slice(Math.max(0, idx - 60), idx + 180).trim() : text.slice(0, 240),
          });
        }
      } catch (err) {
        process.stderr.write(`[search] error reading ${page.pagePath}: ${err.message}\n`);
      }

      if (page.children?.length) await search(page.children, packageName);
    }
  };

  for (const pkg of packages) await search(pkg.pages, pkg.packageName);
  return results;
}

/** Vault summary — one line per doc, no content. */
async function getVaultSummary() {
  const packages = await listAllPackages();
  const summary = [];

  const walk = (pages, packageName) => {
    for (const page of pages) {
      summary.push({
        packageName,
        pagePath: page.pagePath,
        title: page.title,
        sourceType: page.sourceType,
      });
      if (page.children?.length) walk(page.children, packageName);
    }
  };

  for (const pkg of packages) walk(pkg.pages, pkg.packageName);

  return {
    vaultPath: VAULT_ROOT,
    totalPackages: packages.length,
    totalDocuments: summary.length,
    structured: summary.filter(d => d.sourceType === "page-json").length,
    legacy: summary.filter(d => d.sourceType === "legacy-markdown").length,
    documents: summary,
  };
}

async function createDocument(packageName, title, blocks = []) {
  const pkgDir = packageName === "__root__" ? VAULT_ROOT : safeResolve(VAULT_ROOT, packageName);
  await fs.mkdir(pkgDir, { recursive: true });
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || uid();
  const docDir = safeResolve(pkgDir, slug);
  await fs.mkdir(path.join(docDir, "versions"), { recursive: true });
  await fs.mkdir(path.join(docDir, "assets"), { recursive: true });
  const now = new Date().toISOString();
  const document = {
    meta: { title, icon: "", cover: null, created_at: now, updated_at: now },
    blocks: blocks.length ? blocks : [{ type: "paragraph", content: [] }],
    document_version: 1,
  };
  await fs.writeFile(path.join(docDir, "page.json"), JSON.stringify(document, null, 2), "utf8");
  return { packageName, pagePath: `${slug}/page.json`, title, document };
}

async function updateDocument(packageName, pagePath, blocks) {
  if (!pagePath.endsWith("page.json")) throw new Error("Solo se pueden actualizar documentos page.json");
  const pkgDir = packageName === "__root__" ? VAULT_ROOT : safeResolve(VAULT_ROOT, packageName);
  const filePath = safeResolve(pkgDir, pagePath);
  const versionsDir = path.join(path.dirname(filePath), "versions");
  await fs.mkdir(versionsDir, { recursive: true });
  const existing = await readJson(filePath);
  await fs.writeFile(
    path.join(versionsDir, `v${existing.document_version || 1}-${Date.now()}.json`),
    JSON.stringify({ savedAt: new Date().toISOString(), document: existing }, null, 2), "utf8"
  );
  const updated = {
    ...existing, blocks,
    meta: { ...existing.meta, updated_at: new Date().toISOString() },
    document_version: (existing.document_version || 1) + 1,
  };
  await fs.writeFile(filePath, JSON.stringify(updated, null, 2), "utf8");
  return { packageName, pagePath, title: updated.meta?.title, document: updated };
}

async function appendBlocks(packageName, pagePath, blocks) {
  if (!pagePath.endsWith("page.json")) throw new Error("Solo se pueden actualizar documentos page.json");
  const pkgDir = packageName === "__root__" ? VAULT_ROOT : safeResolve(VAULT_ROOT, packageName);
  const filePath = safeResolve(pkgDir, pagePath);
  const existing = await readJson(filePath);
  return updateDocument(packageName, pagePath, [...(existing.blocks || []), ...blocks]);
}

async function deleteDocument(packageName, pagePath) {
  if (!pagePath.endsWith("page.json")) throw new Error("Solo se pueden eliminar documentos page.json");
  const pkgDir = packageName === "__root__" ? VAULT_ROOT : safeResolve(VAULT_ROOT, packageName);
  const filePath = safeResolve(pkgDir, pagePath);
  const docDir = path.dirname(filePath);
  await fs.rm(docDir, { recursive: true, force: true });
  return { deleted: true, packageName, pagePath };
}

async function renameDocument(packageName, pagePath, title) {
  if (!pagePath.endsWith("page.json")) throw new Error("Solo se pueden renombrar documentos page.json");
  if (!title || !title.trim()) throw new Error("El título no puede estar vacío");
  const pkgDir = packageName === "__root__" ? VAULT_ROOT : safeResolve(VAULT_ROOT, packageName);
  const filePath = safeResolve(pkgDir, pagePath);
  const existing = await readJson(filePath);
  const updated = {
    ...existing,
    meta: { ...existing.meta, title: title.trim(), updated_at: new Date().toISOString() },
  };
  await fs.writeFile(filePath, JSON.stringify(updated, null, 2), "utf8");
  return { packageName, pagePath, title: title.trim() };
}

async function updateMeta(packageName, pagePath, meta) {
  if (!pagePath.endsWith("page.json")) throw new Error("Solo page.json soportado");
  const pkgDir = packageName === "__root__" ? VAULT_ROOT : safeResolve(VAULT_ROOT, packageName);
  const filePath = safeResolve(pkgDir, pagePath);
  const existing = await readJson(filePath);
  const updated = {
    ...existing,
    meta: { ...existing.meta, ...meta, updated_at: new Date().toISOString() },
  };
  await fs.writeFile(filePath, JSON.stringify(updated, null, 2), "utf8");
  return { packageName, pagePath, meta: updated.meta };
}

async function listVersions(packageName, pagePath) {
  if (!pagePath.endsWith("page.json")) throw new Error("Solo page.json soportado");
  const pkgDir = packageName === "__root__" ? VAULT_ROOT : safeResolve(VAULT_ROOT, packageName);
  const filePath = safeResolve(pkgDir, pagePath);
  const versionsDir = path.join(path.dirname(filePath), "versions");
  let files;
  try { files = await fs.readdir(versionsDir); } catch { return []; }
  const versions = [];
  for (const f of files.filter(f => f.endsWith(".json")).sort().reverse()) {
    try {
      const data = await readJson(path.join(versionsDir, f));
      versions.push({ fileName: f, savedAt: data.savedAt, version: data.document?.document_version });
    } catch {}
  }
  return versions;
}

function validateDocument(document) {
  const errors = [];
  if (!document || typeof document !== "object") return { valid: false, errors: ["document must be an object"] };
  if (!document.meta || typeof document.meta !== "object") errors.push("missing meta object");
  else {
    if (!document.meta.title) errors.push("meta.title is required");
    if (!document.meta.created_at) errors.push("meta.created_at is required");
  }
  if (!Array.isArray(document.blocks)) errors.push("blocks must be an array");
  else {
    for (let i = 0; i < document.blocks.length; i++) {
      const b = document.blocks[i];
      if (!b || typeof b !== "object") { errors.push(`blocks[${i}] must be an object`); continue; }
      if (!b.type || typeof b.type !== "string") errors.push(`blocks[${i}].type is required`);
    }
  }
  if (document.document_version !== undefined && typeof document.document_version !== "number") {
    errors.push("document_version must be a number");
  }
  return { valid: errors.length === 0, errors };
}

/** Safe text extraction from a single block — handles both formats */
function blockText(block) {
  try {
    // pageDocument format: content is a plain string
    if (typeof block.content === "string") return block.content;
    // Tiptap format: content is array of text nodes
    if (Array.isArray(block.content)) return block.content.map(n => n.text || "").join("");
    return "";
  } catch { return ""; }
}

async function getDocumentContext(packageName, pagePath) {
  if (!pagePath.endsWith("page.json")) throw new Error("Solo page.json soportado");

  const { document } = await readDocument(packageName, pagePath);

  // Defensive: if document structure is unexpected, return minimal info
  if (!document || typeof document !== "object") {
    return { packageName, pagePath, error: "Documento vacío o corrupto" };
  }

  const blocks = Array.isArray(document.blocks) ? document.blocks : [];

  let text = "";
  try { text = extractPlainText(blocks); } catch (e) {
    process.stderr.write(`[context] extractPlainText failed: ${e.message}\n`);
  }

  const headings = [];
  const paragraphs = [];
  const blockTypes = new Set();

  for (const b of blocks) {
    try {
      if (b.type) blockTypes.add(b.type);
      if (b.type === "heading") {
        headings.push({ level: b.attrs?.level || b.props?.level, text: blockText(b) });
      }
      if (b.type === "paragraph" && paragraphs.length < 4) {
        const t = blockText(b);
        if (t) paragraphs.push(t);
      }
    } catch (e) {
      process.stderr.write(`[context] block parse error: ${e.message}\n`);
    }
  }

  return {
    packageName, pagePath, sourceType: "page-json",
    title: document.meta?.title || "",
    updatedAt: document.meta?.updated_at,
    documentVersion: document.document_version,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    blockCount: blocks.length,
    blockTypes: [...blockTypes],
    headings,
    leadingParagraphs: paragraphs,
  };
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new Server(
  { name: "kuilo-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_vault_summary",
      description: "Resumen del vault: total de paquetes, documentos, y lista de títulos con pagePath. Usar como primer paso para explorar.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_documents",
      description: "Lista documentos con árbol completo. Filtrable por paquete.",
      inputSchema: { type: "object", properties: { packageName: { type: "string", description: "Filtra por paquete. Omitir = todos." } } },
    },
    {
      name: "read_document",
      description: "Lee un documento page.json. Requiere packageName + pagePath exacto (usar list_documents primero). No soporta .md — promover desde la app.",
      inputSchema: { type: "object", required: ["packageName", "pagePath"],
        properties: { packageName: { type: "string" }, pagePath: { type: "string", description: "Debe terminar en page.json" } } },
    },
    {
      name: "search_documents",
      description: "Busca texto en títulos y contenido de documentos page.json del vault.",
      inputSchema: { type: "object", required: ["query"],
        properties: { query: { type: "string" } } },
    },
    {
      name: "create_document",
      description: "Crea un nuevo documento page.json.",
      inputSchema: { type: "object", required: ["packageName", "title"],
        properties: { packageName: { type: "string" }, title: { type: "string" },
          blocks: { type: "array", description: "Bloques Tiptap. Omitir para documento vacío.", items: { type: "object" } } } },
    },
    {
      name: "update_document",
      description: "Reemplaza todos los bloques de un page.json. Crea snapshot automático.",
      inputSchema: { type: "object", required: ["packageName", "pagePath", "blocks"],
        properties: { packageName: { type: "string" }, pagePath: { type: "string" },
          blocks: { type: "array", items: { type: "object" } } } },
    },
    {
      name: "append_blocks",
      description: "Agrega bloques al final de un page.json sin tocar el contenido existente.",
      inputSchema: { type: "object", required: ["packageName", "pagePath", "blocks"],
        properties: { packageName: { type: "string" }, pagePath: { type: "string" },
          blocks: { type: "array", items: { type: "object" } } } },
    },
    {
      name: "get_document_context",
      description: "Resumen compacto de un page.json: headings, primeros párrafos, wordCount. Útil antes de leer el documento completo.",
      inputSchema: { type: "object", required: ["packageName", "pagePath"],
        properties: { packageName: { type: "string" }, pagePath: { type: "string" } } },
    },
    {
      name: "delete_document",
      description: "Elimina un documento page.json y su carpeta completa (incluyendo versions y assets).",
      inputSchema: { type: "object", required: ["packageName", "pagePath"],
        properties: { packageName: { type: "string" }, pagePath: { type: "string" } } },
    },
    {
      name: "rename_document",
      description: "Cambia el título de un documento page.json (actualiza meta.title).",
      inputSchema: { type: "object", required: ["packageName", "pagePath", "title"],
        properties: { packageName: { type: "string" }, pagePath: { type: "string" }, title: { type: "string" } } },
    },
    {
      name: "update_meta",
      description: "Actualiza campos de meta (icon, cover, title) sin tocar los bloques. Merge parcial.",
      inputSchema: { type: "object", required: ["packageName", "pagePath", "meta"],
        properties: { packageName: { type: "string" }, pagePath: { type: "string" },
          meta: { type: "object", description: "Campos a actualizar: { title, icon, cover }" } } },
    },
    {
      name: "list_versions",
      description: "Lista snapshots históricos de un documento page.json.",
      inputSchema: { type: "object", required: ["packageName", "pagePath"],
        properties: { packageName: { type: "string" }, pagePath: { type: "string" } } },
    },
    {
      name: "validate_document",
      description: "Valida la estructura de un documento page.json. Devuelve { valid, errors }.",
      inputSchema: { type: "object", required: ["packageName", "pagePath"],
        properties: { packageName: { type: "string" }, pagePath: { type: "string" } } },
    },
    {
      name: "get_execution_graph",
      description: "Grafo de ejecución de documentación: muestra las 7 fases en orden, qué docs van en cada fase, y las dependencias cross-área. Usar para guiar al usuario sobre por dónde empezar.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_next_actions",
      description: "Analiza todos los workflows del vault y devuelve las siguientes acciones concretas por área: qué docs crear, cuáles pasar a review, cuáles aprobar. Incluye progreso por área.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_methodology",
      description: "Lee la guía de una metodología (shape-up, stage-gate, lean-startup, etc.). Explica qué es, cuándo usarla, etapas, y definition of done.",
      inputSchema: { type: "object", required: ["name"],
        properties: { name: { type: "string", description: "Nombre del archivo sin .md: shape-up, stage-gate, lean-startup" } } },
    },
    {
      name: "get_tutorial",
      description: "Lee el tutorial de cómo escribir un tipo de documento (how-to-write-prd, how-to-write-rfc, how-to-write-lean-canvas, etc.).",
      inputSchema: { type: "object", required: ["name"],
        properties: { name: { type: "string", description: "Nombre del tutorial sin .md" } } },
    },
    {
      name: "get_rules",
      description: "Lee las reglas del vault (definition-of-done, review-checklist). Define cuándo un doc está listo para review o done.",
      inputSchema: { type: "object", required: ["name"],
        properties: { name: { type: "string", description: "Nombre de la regla sin .md: definition-of-done, review-checklist" } } },
    },
    {
      name: "get_workflow_status",
      description: "Estado completo del workflow de un paquete: progreso, docs por status, acciones siguientes, docs bloqueados y por qué.",
      inputSchema: { type: "object", required: ["packageName"],
        properties: { packageName: { type: "string" } } },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const json = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });

  try {
    if (name === "get_vault_summary") return json(await getVaultSummary());
    if (name === "list_documents") {
      const all = await listAllPackages();
      return json(args?.packageName ? all.filter(p => p.packageName === args.packageName) : all);
    }
    if (name === "read_document") return json(await readDocument(args.packageName, args.pagePath));
    if (name === "search_documents") return json(await searchDocuments(args.query || ""));
    if (name === "create_document") return json(await createDocument(args.packageName, args.title, args.blocks));
    if (name === "update_document") return json(await updateDocument(args.packageName, args.pagePath, args.blocks));
    if (name === "append_blocks") return json(await appendBlocks(args.packageName, args.pagePath, args.blocks));
    if (name === "get_document_context") return json(await getDocumentContext(args.packageName, args.pagePath));
    if (name === "delete_document") return json(await deleteDocument(args.packageName, args.pagePath));
    if (name === "rename_document") return json(await renameDocument(args.packageName, args.pagePath, args.title));
    if (name === "update_meta") return json(await updateMeta(args.packageName, args.pagePath, args.meta));
    if (name === "list_versions") return json(await listVersions(args.packageName, args.pagePath));
    if (name === "validate_document") {
      const { document } = await readDocument(args.packageName, args.pagePath);
      return json(validateDocument(document));
    }

    // ── Knowledge base tools ──
    if (name === "get_execution_graph") return json(await getExecutionGraph());
    if (name === "get_next_actions") return json(await getNextActions());
    if (name === "get_methodology") return json(await getKnowledge("methodologies", args.name));
    if (name === "get_tutorial") return json(await getKnowledge("tutorials", args.name));
    if (name === "get_rules") return json(await getKnowledge("rules", args.name));
    if (name === "get_workflow_status") return json(await getWorkflowStatus(args.packageName));

    throw new Error(`Tool desconocida: ${name}`);
  } catch (err) {
    process.stderr.write(`[kuilo-mcp] tool ${name} error: ${err.message}\n${err.stack}\n`);
    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }], isError: true };
  }
});

// ─── Knowledge base functions ────────────────────────────────────────────────

const KNOWLEDGE_DIR = path.join(path.dirname(VAULT_ROOT), "_knowledge");

async function getExecutionGraph() {
  const graphPath = path.join(KNOWLEDGE_DIR, "graph.json");
  if (!(await exists(graphPath))) return { error: "No graph.json found. Create a project first." };
  return readJson(graphPath);
}

async function getKnowledge(category, name) {
  const filePath = path.join(KNOWLEDGE_DIR, category, `${name}.md`);
  if (!(await exists(filePath))) {
    // List available files
    try {
      const files = await fs.readdir(path.join(KNOWLEDGE_DIR, category));
      return { error: `"${name}" not found. Available: ${files.filter(f => f.endsWith(".md")).map(f => f.replace(".md", "")).join(", ")}` };
    } catch {
      return { error: `Category "${category}" not found.` };
    }
  }
  return { name, category, content: await fs.readFile(filePath, "utf8") };
}

async function getWorkflowStatus(packageName) {
  const pkgDir = packageName === "__root__" ? VAULT_ROOT : safeResolve(VAULT_ROOT, packageName);
  const wfPath = path.join(pkgDir, "workflow.json");
  if (!(await exists(wfPath))) return { error: `No workflow.json found in ${packageName}` };

  const wf = await readJson(wfPath);
  const allDocs = (wf.stages || []).flatMap(s => (s.docs || []).map(d => ({ ...d, stage: s.title })));
  const byStatus = { "not-started": 0, "draft": 0, "review": 0, "done": 0 };
  for (const d of allDocs) byStatus[d.status || "not-started"]++;

  const blocked = [];
  const nextActions = [];

  for (const d of allDocs) {
    if (d.status === "done") continue;
    const hasUnmetDeps = (d.dependsOn || []).some(dep => {
      const depDoc = allDocs.find(x => x.docType === dep.docType);
      if (!depDoc) return true;
      const order = { "not-started": 0, "draft": 1, "review": 2, "done": 3 };
      return (order[depDoc.status] || 0) < (order[dep.requiredStatus] || 0);
    });

    if (hasUnmetDeps) {
      blocked.push({ docType: d.docType, stage: d.stage, blockedBy: d.dependsOn });
    } else if (d.status !== "done") {
      nextActions.push({ docType: d.docType, stage: d.stage, currentStatus: d.status || "not-started", action: d.status === "not-started" ? "Crear documento" : d.status === "draft" ? "Completar y pasar a review" : "Revisar y aprobar" });
    }
  }

  return {
    packageName,
    framework: wf.framework,
    author: wf.author,
    totalDocs: allDocs.length,
    byStatus,
    progress: allDocs.length > 0 ? Math.round((byStatus.done / allDocs.length) * 100) : 0,
    nextActions: nextActions.slice(0, 5),
    blocked,
  };
}

async function getNextActions() {
  const packages = await listAllPackages();
  const actions = [];

  for (const pkg of packages) {
    const pkgDir = pkg.packageName === "__root__" ? VAULT_ROOT : safeResolve(VAULT_ROOT, pkg.packageName);
    const wfPath = path.join(pkgDir, "workflow.json");
    if (!(await exists(wfPath))) continue;

    const status = await getWorkflowStatus(pkg.packageName);
    if (status.nextActions?.length) {
      actions.push({ area: pkg.packageName, framework: status.framework, progress: status.progress, actions: status.nextActions });
    }
  }

  // Also read the graph to suggest phase-level guidance
  let graphAdvice = null;
  try {
    const graph = await readJson(path.join(KNOWLEDGE_DIR, "graph.json"));
    graphAdvice = graph.execution_order?.map(p => ({ phase: p.phase, name: p.name, description: p.description, docs: p.parallel.length }));
  } catch {}

  return { perArea: actions, executionPhases: graphAdvice };
}

await fs.mkdir(VAULT_ROOT, { recursive: true });
const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write(`[kuilo-mcp] vault: ${VAULT_ROOT}\n`);
