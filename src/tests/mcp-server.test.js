/**
 * MCP Server integration tests.
 * Uses the official MCP SDK client to communicate with the server.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const SCRIPT = path.join(ROOT, "scripts/docs-mcp.mjs");
const VAULT = path.join(ROOT, ".test-vault");

// ── Test vault setup ─────────────────────────────────────────────────────────

async function setupVault() {
  await fs.rm(VAULT, { recursive: true, force: true });

  // page.json doc with standard blocks
  const doc1Dir = path.join(VAULT, "test-pkg", "intro");
  await fs.mkdir(path.join(doc1Dir, "versions"), { recursive: true });
  await fs.writeFile(path.join(doc1Dir, "page.json"), JSON.stringify({
    meta: { title: "Introduccion", icon: "", created_at: "2026-01-01", updated_at: "2026-01-01" },
    blocks: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Introduccion" }] },
      { type: "paragraph", content: [{ type: "text", text: "Documento de prueba para el MCP." }] },
      { type: "paragraph", content: [{ type: "text", text: "Texto buscable: zapato azul." }] },
    ],
    document_version: 1,
  }, null, 2));

  // page.json doc with custom blocks (callout, apiEndpoint, metadataCard)
  const doc2Dir = path.join(VAULT, "test-pkg", "api-docs");
  await fs.mkdir(path.join(doc2Dir, "versions"), { recursive: true });
  await fs.writeFile(path.join(doc2Dir, "page.json"), JSON.stringify({
    meta: { title: "API Reference", icon: "globe", created_at: "2026-01-02", updated_at: "2026-01-02" },
    blocks: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "API Reference" }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Endpoints" }] },
      { type: "paragraph", content: [{ type: "text", text: "GET /users - lista usuarios" }] },
      { type: "callout", attrs: { type: "note" }, content: [{ type: "paragraph", content: [{ type: "text", text: "Requiere auth" }] }] },
      { type: "apiEndpoint", attrs: { method: "GET", path: "/users", params: "[]", responses: "[]" } },
      { type: "metadataCard", attrs: { fields: "[]" } },
      { type: "horizontalRule" },
    ],
    document_version: 3,
  }, null, 2));

  // Legacy .md file
  await fs.writeFile(path.join(VAULT, "readme.md"), "# Readme\n\nLegacy file.\n");
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("MCP Server", () => {
  let client;
  let transport;

  beforeAll(async () => {
    await setupVault();

    transport = new StdioClientTransport({
      command: "node",
      args: [SCRIPT, VAULT],
    });

    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(transport);
  }, 10000);

  afterAll(async () => {
    await client?.close();
    await fs.rm(VAULT, { recursive: true, force: true });
  });

  // ── tools/list ──

  it("lists 13 tools", async () => {
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(13);
    const names = tools.map(t => t.name);
    expect(names).toContain("get_vault_summary");
    expect(names).toContain("read_document");
    expect(names).toContain("get_document_context");
    expect(names).toContain("delete_document");
    expect(names).toContain("rename_document");
    expect(names).toContain("update_meta");
    expect(names).toContain("list_versions");
    expect(names).toContain("validate_document");
  });

  // ── get_vault_summary ──

  it("get_vault_summary returns counts", async () => {
    const result = await client.callTool({ name: "get_vault_summary", arguments: {} });
    const data = JSON.parse(result.content[0].text);
    expect(data.totalDocuments).toBeGreaterThanOrEqual(2);
    expect(data.structured).toBeGreaterThanOrEqual(2);
    expect(data.documents).toBeInstanceOf(Array);
  });

  // ── list_documents ──

  it("list_documents returns packages", async () => {
    const result = await client.callTool({ name: "list_documents", arguments: {} });
    const data = JSON.parse(result.content[0].text);
    const pkg = data.find(p => p.packageName === "test-pkg");
    expect(pkg).toBeDefined();
    expect(pkg.pages.length).toBeGreaterThanOrEqual(2);
  });

  it("list_documents filters by packageName", async () => {
    const result = await client.callTool({ name: "list_documents", arguments: { packageName: "test-pkg" } });
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(1);
  });

  // ── read_document ──

  it("read_document reads page.json", async () => {
    const result = await client.callTool({
      name: "read_document",
      arguments: { packageName: "test-pkg", pagePath: "intro/page.json" },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.sourceType).toBe("page-json");
    expect(data.document.meta.title).toBe("Introduccion");
  });

  it("read_document rejects .md files", async () => {
    const result = await client.callTool({
      name: "read_document",
      arguments: { packageName: "__root__", pagePath: "readme.md" },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBeDefined();
  });

  // ── search_documents ──

  it("search finds content", async () => {
    const result = await client.callTool({
      name: "search_documents", arguments: { query: "zapato azul" },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].snippet).toContain("zapato");
  });

  it("search finds by title", async () => {
    const result = await client.callTool({
      name: "search_documents", arguments: { query: "API Reference" },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it("search returns empty for no match", async () => {
    const result = await client.callTool({
      name: "search_documents", arguments: { query: "xyznonexistent" },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(0);
  });

  // ── get_document_context ──

  it("context works on simple page.json", async () => {
    const result = await client.callTool({
      name: "get_document_context",
      arguments: { packageName: "test-pkg", pagePath: "intro/page.json" },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.title).toBe("Introduccion");
    expect(data.wordCount).toBeGreaterThan(0);
    expect(data.headings).toHaveLength(1);
    expect(data.leadingParagraphs.length).toBeGreaterThan(0);
  });

  it("context works on page.json with custom blocks", async () => {
    const result = await client.callTool({
      name: "get_document_context",
      arguments: { packageName: "test-pkg", pagePath: "api-docs/page.json" },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.title).toBe("API Reference");
    expect(data.blockCount).toBe(7);
    expect(data.blockTypes).toContain("callout");
    expect(data.blockTypes).toContain("apiEndpoint");
    expect(data.headings.length).toBeGreaterThanOrEqual(2);
  });

  // ── create_document ──

  it("create_document creates new page.json", async () => {
    const result = await client.callTool({
      name: "create_document",
      arguments: {
        packageName: "test-pkg", title: "Test Created",
        blocks: [{ type: "paragraph", content: [{ type: "text", text: "Created" }] }],
      },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.pagePath).toContain("page.json");
  });

  // ── update_document ──

  it("update_document replaces blocks with snapshot", async () => {
    const result = await client.callTool({
      name: "update_document",
      arguments: {
        packageName: "test-pkg", pagePath: "intro/page.json",
        blocks: [{ type: "paragraph", content: [{ type: "text", text: "Updated" }] }],
      },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.document.blocks).toHaveLength(1);
    expect(data.document.document_version).toBeGreaterThanOrEqual(2);
  });

  // ── append_blocks ──

  it("append_blocks adds without replacing", async () => {
    const result = await client.callTool({
      name: "append_blocks",
      arguments: {
        packageName: "test-pkg", pagePath: "intro/page.json",
        blocks: [{ type: "paragraph", content: [{ type: "text", text: "Appended" }] }],
      },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.document.blocks.length).toBeGreaterThanOrEqual(2);
  });

  // ── rename_document ──

  it("rename_document changes title in meta", async () => {
    const result = await client.callTool({
      name: "rename_document",
      arguments: { packageName: "test-pkg", pagePath: "api-docs/page.json", title: "New API Title" },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.title).toBe("New API Title");

    // Verify persisted
    const read = await client.callTool({
      name: "read_document",
      arguments: { packageName: "test-pkg", pagePath: "api-docs/page.json" },
    });
    expect(JSON.parse(read.content[0].text).document.meta.title).toBe("New API Title");
  });

  it("rename_document rejects empty title", async () => {
    const result = await client.callTool({
      name: "rename_document",
      arguments: { packageName: "test-pkg", pagePath: "api-docs/page.json", title: "" },
    });
    expect(result.isError).toBe(true);
  });

  // ── update_meta ──

  it("update_meta patches icon and cover without touching blocks", async () => {
    const result = await client.callTool({
      name: "update_meta",
      arguments: {
        packageName: "test-pkg", pagePath: "api-docs/page.json",
        meta: { icon: "rocket", cover: { type: "color", value: "#ff0000" } },
      },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.meta.icon).toBe("rocket");
    expect(data.meta.cover.value).toBe("#ff0000");
    expect(data.meta.title).toBe("New API Title"); // title preserved from rename test
  });

  // ── list_versions ──

  it("list_versions returns snapshots after updates", async () => {
    const result = await client.callTool({
      name: "list_versions",
      arguments: { packageName: "test-pkg", pagePath: "intro/page.json" },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.length).toBeGreaterThanOrEqual(1); // update + append created snapshots
    expect(data[0].fileName).toBeDefined();
    expect(data[0].savedAt).toBeDefined();
  });

  // ── validate_document ──

  it("validate_document passes for valid doc", async () => {
    const result = await client.callTool({
      name: "validate_document",
      arguments: { packageName: "test-pkg", pagePath: "api-docs/page.json" },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.valid).toBe(true);
    expect(data.errors).toHaveLength(0);
  });

  // ── delete_document ──
  // Run last since it removes a doc

  it("delete_document removes doc and folder", async () => {
    // Create a throwaway doc first
    const created = await client.callTool({
      name: "create_document",
      arguments: { packageName: "test-pkg", title: "To Delete" },
    });
    const { pagePath } = JSON.parse(created.content[0].text);

    const result = await client.callTool({
      name: "delete_document",
      arguments: { packageName: "test-pkg", pagePath },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.deleted).toBe(true);

    // Verify it's gone
    const read = await client.callTool({
      name: "read_document",
      arguments: { packageName: "test-pkg", pagePath },
    });
    expect(read.isError).toBe(true);
  });
});
