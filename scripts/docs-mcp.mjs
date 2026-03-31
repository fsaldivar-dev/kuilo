#!/usr/bin/env node
/**
 * docs-mcp.mjs — MCP server genérico para vaults NotesApp
 *
 * Uso:
 *   node docs-mcp.mjs /absolute/path/to/vault
 *   NOTES_VAULT=/absolute/path/to/vault node docs-mcp.mjs
 *
 * Registro en Claude Desktop:
 * {
 *   "mcpServers": {
 *     "mi-vault": {
 *       "command": "node",
 *       "args": ["/path/to/docs-mcp.mjs", "/path/to/vault"]
 *     }
 *   }
 * }
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

function getTitleFromMarkdown(md = "") {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "Sin título";
}

function extractPlainText(blocks = []) {
  return blocks.map(b => {
    const inner = (b.content || []).map(n => n.text || "").join("");
    return b.children?.length ? inner + "\n" + extractPlainText(b.children) : inner;
  }).join("\n");
}

// ─── Document operations ──────────────────────────────────────────────────────

async function listPagesRecursive(dir, relDir = "") {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return []; }
  const nodes = [];

  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name, "es-MX"))) {
    if (e.name.startsWith(".") || e.name.startsWith("_")) continue;
    const rel = relDir ? `${relDir}/${e.name}` : e.name;

    if (e.isFile() && e.name.endsWith(".md")) {
      const content = await fs.readFile(path.join(dir, e.name), "utf8");
      nodes.push({ pagePath: rel, title: getTitleFromMarkdown(content), sourceType: "legacy-markdown", children: [] });
      continue;
    }

    if (!e.isDirectory() || RESERVED.has(e.name)) continue;

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

  const rootFiles = entries.filter(e => e.isFile() && e.name.endsWith(".md"));
  if (rootFiles.length) {
    const pages = [];
    for (const f of rootFiles) {
      const content = await fs.readFile(path.join(VAULT_ROOT, f.name), "utf8");
      pages.push({ pagePath: f.name, title: getTitleFromMarkdown(content), sourceType: "legacy-markdown", children: [] });
    }
    packages.push({ packageName: "__root__", pages });
  }

  for (const e of entries.filter(e => e.isDirectory() && !e.name.startsWith(".") && !RESERVED.has(e.name))) {
    const pages = await listPagesRecursive(path.join(VAULT_ROOT, e.name));
    if (pages.length) packages.push({ packageName: e.name, pages });
  }
  return packages;
}

async function readDocument(packageName, pagePath) {
  const pkgDir = packageName === "__root__" ? VAULT_ROOT : safeResolve(VAULT_ROOT, packageName);
  const fullPath = safeResolve(pkgDir, pagePath);
  if (pagePath.endsWith("page.json")) {
    return { sourceType: "page-json", document: await readJson(fullPath) };
  }
  return { sourceType: "legacy-markdown", content: await fs.readFile(fullPath, "utf8") };
}

async function searchDocuments(query) {
  const q = query.trim().toLowerCase();
  const packages = await listAllPackages();
  const results = [];

  const search = async (pages, packageName) => {
    for (const page of pages) {
      try {
        const { sourceType, document, content } = await readDocument(packageName, page.pagePath);
        const text = sourceType === "page-json" ? extractPlainText(document.blocks || []) : (content || "");
        if (page.title.toLowerCase().includes(q) || text.toLowerCase().includes(q)) {
          const idx = text.toLowerCase().indexOf(q);
          results.push({ packageName, pagePath: page.pagePath, title: page.title, sourceType,
            snippet: idx >= 0 ? text.slice(Math.max(0, idx - 60), idx + 180).trim() : text.slice(0, 240) });
        }
      } catch {}
      if (page.children?.length) await search(page.children, packageName);
    }
  };

  for (const pkg of packages) await search(pkg.pages, pkg.packageName);
  return results;
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
  const pkgDir = packageName === "__root__" ? VAULT_ROOT : safeResolve(VAULT_ROOT, packageName);
  const filePath = safeResolve(pkgDir, pagePath);
  const existing = await readJson(filePath);
  return updateDocument(packageName, pagePath, [...(existing.blocks || []), ...blocks]);
}

async function getDocumentContext(packageName, pagePath) {
  const { sourceType, document, content } = await readDocument(packageName, pagePath);
  if (sourceType === "legacy-markdown") {
    const lines = (content || "").split("\n");
    return { packageName, pagePath, sourceType, wordCount: content.split(/\s+/).filter(Boolean).length,
      headings: lines.filter(l => l.startsWith("#")).slice(0, 10), preview: content.slice(0, 600) };
  }
  const blocks = document.blocks || [];
  return {
    packageName, pagePath, sourceType: "page-json",
    title: document.meta?.title, updatedAt: document.meta?.updated_at,
    documentVersion: document.document_version,
    wordCount: extractPlainText(blocks).split(/\s+/).filter(Boolean).length,
    blockCount: blocks.length,
    headings: blocks.filter(b => b.type === "heading").map(b => ({
      level: b.attrs?.level, text: (b.content || []).map(n => n.text || "").join("") })),
    leadingParagraphs: blocks.filter(b => b.type === "paragraph").slice(0, 4)
      .map(b => (b.content || []).map(n => n.text || "").join("")),
  };
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new Server(
  { name: "notesapp-vault-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── tools/list ──
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_documents",
      description: "Lista todos los documentos del vault. Devuelve árbol con packageName, pagePath, title y sourceType.",
      inputSchema: { type: "object", properties: { packageName: { type: "string", description: "Filtra por paquete. Omitir = todos." } } },
    },
    {
      name: "read_document",
      description: "Lee un documento. page.json devuelve blocks estructurados; .md devuelve markdown plano.",
      inputSchema: { type: "object", required: ["packageName", "pagePath"],
        properties: { packageName: { type: "string" }, pagePath: { type: "string" } } },
    },
    {
      name: "search_documents",
      description: "Busca texto en títulos y contenido de todos los documentos del vault.",
      inputSchema: { type: "object", required: ["query"],
        properties: { query: { type: "string" } } },
    },
    {
      name: "create_document",
      description: "Crea un nuevo documento page.json en el vault.",
      inputSchema: { type: "object", required: ["packageName", "title"],
        properties: { packageName: { type: "string" }, title: { type: "string" },
          blocks: { type: "array", description: "Bloques Tiptap. Omitir para documento vacío.", items: { type: "object" } } } },
    },
    {
      name: "update_document",
      description: "Reemplaza todos los bloques de un documento page.json. Crea snapshot automático.",
      inputSchema: { type: "object", required: ["packageName", "pagePath", "blocks"],
        properties: { packageName: { type: "string" }, pagePath: { type: "string" },
          blocks: { type: "array", items: { type: "object" } } } },
    },
    {
      name: "append_blocks",
      description: "Agrega bloques al final de un documento page.json sin tocar el contenido existente.",
      inputSchema: { type: "object", required: ["packageName", "pagePath", "blocks"],
        properties: { packageName: { type: "string" }, pagePath: { type: "string" },
          blocks: { type: "array", items: { type: "object" } } } },
    },
    {
      name: "get_document_context",
      description: "Resumen compacto: headings, primeros párrafos, wordCount. Útil antes de leer el documento completo.",
      inputSchema: { type: "object", required: ["packageName", "pagePath"],
        properties: { packageName: { type: "string" }, pagePath: { type: "string" } } },
    },
  ],
}));

// ── tools/call ──
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const json = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });

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

// ── Start ──
await fs.mkdir(VAULT_ROOT, { recursive: true });
const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write(`[docs-mcp] vault: ${VAULT_ROOT}\n`);
