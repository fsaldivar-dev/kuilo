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

function extractPlainText(blocks = []) {
  const parts = [];
  const walk = (nodes) => {
    for (const node of nodes) {
      if (node.text) parts.push(node.text);
      if (node.content) walk(node.content);
      if (node.children) walk(node.children);
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

/** Safe text extraction from a single block's content array */
function blockText(block) {
  try {
    return (block.content || []).map(n => n.text || "").join("");
  } catch { return ""; }
}

async function getDocumentContext(packageName, pagePath) {
  if (!pagePath.endsWith("page.json")) throw new Error("Solo page.json soportado");
  const { document } = await readDocument(packageName, pagePath);
  const blocks = document.blocks || [];
  const text = extractPlainText(blocks);

  // Collect block types present in the document
  const blockTypes = [...new Set(blocks.map(b => b.type).filter(Boolean))];

  return {
    packageName, pagePath, sourceType: "page-json",
    title: document.meta?.title || "",
    updatedAt: document.meta?.updated_at,
    documentVersion: document.document_version,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    blockCount: blocks.length,
    blockTypes,
    headings: blocks
      .filter(b => b.type === "heading" && b.content)
      .map(b => ({ level: b.attrs?.level, text: blockText(b) })),
    leadingParagraphs: blocks
      .filter(b => b.type === "paragraph" && b.content)
      .slice(0, 4)
      .map(b => blockText(b))
      .filter(t => t.length > 0),
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
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const json = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });

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

  throw new Error(`Tool desconocida: ${name}`);
});

await fs.mkdir(VAULT_ROOT, { recursive: true });
const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write(`[kuilo-mcp] vault: ${VAULT_ROOT}\n`);
