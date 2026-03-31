#!/usr/bin/env node
/**
 * take-screenshots.mjs
 * Creates a temp vault with sample docs, launches Electron, and captures screenshots.
 *
 * Usage: npm run build && node scripts/take-screenshots.mjs
 */

import { _electron as electron } from "playwright";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SHOTS = path.join(ROOT, "docs", "screenshots");
const VAULT = path.join(ROOT, ".screenshot-vault");

// ── Sample documents ────────────────────────────────────────────────────────

const sampleDocs = {
  "demo-features": {
    "01-overview/page.json": {
      meta: { title: "Bienvenido a Kuilo", icon: "rocket", created_at: "2026-03-30", updated_at: "2026-03-30" },
      blocks: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Bienvenido a Kuilo" }] },
        { type: "paragraph", content: [{ type: "text", text: "IDE de documentacion tecnica local-first. Escribe, documenta, y exporta sin salir de la app." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Caracteristicas" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Editor de bloques con Markdown completo" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Callouts, diagramas, ecuaciones, API blocks" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Templates profesionales (PRD, RFC, Sprint, Runbook)" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "MCP nativo para conectar con Claude, Cursor, Windsurf" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Export a Markdown, HTML, PDF y libro completo" }] }] },
        ]},
        { type: "horizontalRule" },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Callouts" }] },
        { type: "callout", attrs: { type: "note" }, content: [{ type: "paragraph", content: [{ type: "text", text: "Los callouts resaltan informacion importante en tus documentos. Hay 5 tipos disponibles." }] }] },
        { type: "callout", attrs: { type: "tip" }, content: [{ type: "paragraph", content: [{ type: "text", text: "Usa /note, /tip, /warning, /caution, o /important para insertar callouts rapidamente." }] }] },
        { type: "callout", attrs: { type: "warning" }, content: [{ type: "paragraph", content: [{ type: "text", text: "Los cambios en documentos structured se versionan automaticamente." }] }] },
        { type: "callout", attrs: { type: "caution" }, content: [{ type: "paragraph", content: [{ type: "text", text: "Eliminar un documento es irreversible. Asegurate de tener respaldo." }] }] },
        { type: "horizontalRule" },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Codigo" }] },
        { type: "codeBlock", attrs: { language: "javascript" }, content: [{ type: "text", text: 'const kuilo = {\n  name: "Kuilo",\n  stack: ["Electron", "React", "Tiptap"],\n  local: true,\n  mcp: true,\n};\n\nconsole.log(`${kuilo.name} is ready!`);' }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Tabla" }] },
        { type: "table", content: [
          { type: "tableRow", content: [
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Feature" }] }] },
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Status" }] }] },
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Version" }] }] },
          ]},
          { type: "tableRow", content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Editor de bloques" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Completo" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "1.0" }] }] },
          ]},
          { type: "tableRow", content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "MCP Server" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "7 herramientas" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "1.0" }] }] },
          ]},
          { type: "tableRow", content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Export PDF" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Pagina + Libro" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "1.0" }] }] },
          ]},
        ]},
        { type: "horizontalRule" },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Task List" }] },
        { type: "taskList", content: [
          { type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Editor de bloques" }] }] },
          { type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Callouts y admonitions" }] }] },
          { type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "MCP Server" }] }] },
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Editor visual de diagramas" }] }] },
        ]},
      ],
      document_version: 1,
    },
    "02-mermaid/page.json": {
      meta: { title: "Diagramas Mermaid", icon: "sparkles", created_at: "2026-03-30", updated_at: "2026-03-30" },
      blocks: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Diagramas Mermaid" }] },
        { type: "paragraph", content: [{ type: "text", text: "Kuilo renderiza diagramas Mermaid en tiempo real con zoom y pan." }] },
        { type: "codeBlock", attrs: { language: "mermaid" }, content: [{ type: "text", text: "flowchart TD\n    A[Usuario] -->|Login| B{Autenticado?}\n    B -->|Si| C[Dashboard]\n    B -->|No| D[Error]\n    D --> A\n    C --> E[Documentos]\n    C --> F[Configuracion]\n    E --> G[Editar]\n    E --> H[Exportar]" }] },
      ],
      document_version: 1,
    },
    "03-api-spec/page.json": {
      meta: { title: "API de Usuarios", icon: "globe", created_at: "2026-03-30", updated_at: "2026-03-30" },
      blocks: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "API de Usuarios" }] },
        { type: "metadataCard", attrs: { fields: JSON.stringify([
          { key: "Base URL", value: "https://api.kuilo.dev/v1", type: "text" },
          { key: "Auth", value: "Bearer Token", type: "select", options: ["Bearer Token", "API Key", "None"] },
          { key: "Status", value: "Stable", type: "select", options: ["Draft", "Stable", "Deprecated"] },
        ])}},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Endpoints" }] },
        { type: "apiEndpoint", attrs: {
          method: "GET", path: "/users", description: "Listar todos los usuarios",
          auth: "Bearer {token}",
          params: JSON.stringify([{ name: "page", type: "number", required: false, description: "Pagina" }, { name: "limit", type: "number", required: false, description: "Items por pagina" }]),
          requestBody: "",
          responses: JSON.stringify([{ status: "200", description: "OK", body: '{\n  "users": [...],\n  "total": 42\n}' }]),
        }},
        { type: "apiEndpoint", attrs: {
          method: "POST", path: "/users", description: "Crear un usuario",
          auth: "Bearer {token}",
          params: "[]",
          requestBody: '{\n  "name": "string",\n  "email": "string",\n  "role": "admin | member"\n}',
          responses: JSON.stringify([
            { status: "201", description: "Created", body: '{\n  "id": "usr_abc123",\n  "name": "Juan"\n}' },
            { status: "400", description: "Bad Request", body: '{\n  "error": "Email already exists"\n}' },
          ]),
        }},
        { type: "apiEndpoint", attrs: {
          method: "DELETE", path: "/users/:id", description: "Eliminar usuario",
          auth: "Bearer {token}",
          params: JSON.stringify([{ name: "id", type: "string", required: true, description: "ID del usuario" }]),
          requestBody: "",
          responses: JSON.stringify([{ status: "204", description: "No Content", body: "" }]),
        }},
      ],
      document_version: 1,
    },
  },
};

// ── Create vault ────────────────────────────────────────────────────────────

async function createVault() {
  await fs.rm(VAULT, { recursive: true, force: true });
  for (const [pkg, pages] of Object.entries(sampleDocs)) {
    for (const [pagePath, doc] of Object.entries(pages)) {
      const fullPath = path.join(VAULT, pkg, pagePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.mkdir(path.join(path.dirname(fullPath), "versions"), { recursive: true });
      await fs.writeFile(fullPath, JSON.stringify(doc, null, 2), "utf8");
    }
  }
  console.log("Vault created at", VAULT);
}

// ── Screenshots ─────────────────────────────────────────────────────────────

async function run() {
  await createVault();
  await fs.mkdir(SHOTS, { recursive: true });

  console.log("Launching Electron...");

  // Set vault path — electron-store uses app.getPath("userData")
  // For dev, this is typically ~/Library/Application Support/Electron/
  const userDataPaths = [
    path.join(process.env.HOME, "Library", "Application Support", "Electron"),
    path.join(process.env.HOME, "Library", "Application Support", "notes-app"),
    path.join(process.env.HOME, "Library", "Application Support", "NotesApp"),
  ];
  let settingsFile = null;
  let oldSettings = null;
  for (const dir of userDataPaths) {
    const f = path.join(dir, "settings.json");
    try {
      oldSettings = await fs.readFile(f, "utf8");
      settingsFile = f;
      break;
    } catch {}
  }
  // If no existing settings found, use the first path
  if (!settingsFile) {
    settingsFile = path.join(userDataPaths[0], "settings.json");
    await fs.mkdir(path.dirname(settingsFile), { recursive: true });
  }
  // Override vault path
  const currentSettings = oldSettings ? JSON.parse(oldSettings) : {};
  await fs.writeFile(settingsFile, JSON.stringify({ ...currentSettings, vaultPath: VAULT }), "utf8");
  console.log("Settings written to", settingsFile);

  const app = await electron.launch({
    args: [path.join(ROOT, "electron/main.cjs")],
    env: { ...process.env, NODE_ENV: "test" },
  });

  const win = await app.firstWindow();
  await win.waitForLoadState("domcontentloaded");
  await win.waitForTimeout(3000);

  const shot = async (name) => {
    await win.screenshot({ path: path.join(SHOTS, `${name}.png`) });
    console.log(`  ✓ ${name}.png`);
  };

  const shotEl = async (name, selector) => {
    const el = win.locator(selector).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.screenshot({ path: path.join(SHOTS, `${name}.png`) });
      console.log(`  ✓ ${name}.png`);
    } else {
      console.log(`  ✗ ${name} — element not found: ${selector}`);
    }
  };

  console.log("\n📸 Taking screenshots...\n");

  // ── Overview (first page should auto-open) ──
  await shot("overview");

  // ── Click first doc to make sure content loads ──
  const firstDoc = win.locator(".doc-item").first();
  if (await firstDoc.isVisible({ timeout: 2000 }).catch(() => false)) {
    await firstDoc.click();
    await win.waitForTimeout(1500);
  }
  await shot("full-app");

  // ── Dark mode ──
  await win.evaluate(() => document.documentElement.classList.add("dark"));
  await win.waitForTimeout(500);
  await shot("full-app-dark");
  await win.evaluate(() => document.documentElement.classList.remove("dark"));
  await win.waitForTimeout(300);

  // ── Sidebar ──
  await shotEl("sidebar", ".sidebar");

  // ── Toolbar ──
  await shotEl("toolbar", '[data-variant="fixed"]');

  // ── Editor content ──
  await shotEl("editor-with-content", ".simple-editor-content");

  // ── Slash menu ──
  const editor = win.locator(".tiptap.ProseMirror").first();
  if (await editor.isVisible()) {
    await editor.click();
    await editor.press("End");
    await editor.press("Enter");
    await win.keyboard.type("/");
    await win.waitForTimeout(600);
    await shotEl("slash-commands", ".slash-menu");
    await win.keyboard.press("Escape");
    await win.waitForTimeout(300);
  }

  // ── Insert dropdown ──
  const insertBtn = win.locator('button[aria-label="Insertar componente"]').first();
  if (await insertBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await insertBtn.click();
    await win.waitForTimeout(500);
    await shotEl("insert-menu", ".insert-menu");
    await win.keyboard.press("Escape");
    await win.waitForTimeout(300);
  }

  // ── Navigate to Mermaid page ──
  const mermaidDoc = win.locator(".doc-item", { hasText: "Diagramas Mermaid" }).first();
  if (await mermaidDoc.isVisible({ timeout: 2000 }).catch(() => false)) {
    await mermaidDoc.click();
    await win.waitForTimeout(2500); // Wait for mermaid render
    await shot("mermaid");
  }

  // ── Navigate to API page ──
  const apiDoc = win.locator(".doc-item", { hasText: "API de Usuarios" }).first();
  if (await apiDoc.isVisible({ timeout: 2000 }).catch(() => false)) {
    await apiDoc.click();
    await win.waitForTimeout(1500);
    await shot("api-endpoint");

    // Dark mode API
    await win.evaluate(() => document.documentElement.classList.add("dark"));
    await win.waitForTimeout(500);
    await shot("api-endpoint-dark");
    await win.evaluate(() => document.documentElement.classList.remove("dark"));
  }

  // ── Back to overview for callouts shot ──
  const overviewDoc = win.locator(".doc-item", { hasText: "Bienvenido" }).first();
  if (await overviewDoc.isVisible({ timeout: 2000 }).catch(() => false)) {
    await overviewDoc.click();
    await win.waitForTimeout(1500);
    await shot("callouts");

    // Dark mode callouts
    await win.evaluate(() => document.documentElement.classList.add("dark"));
    await win.waitForTimeout(500);
    await shot("dark-mode");
    await win.evaluate(() => document.documentElement.classList.remove("dark"));
  }

  console.log("\n✅ Done! Screenshots saved to docs/screenshots/\n");

  await app.close();

  // Restore original settings
  if (oldSettings) {
    await fs.writeFile(settingsFile, oldSettings, "utf8");
    console.log("Settings restored");
  }

  // Cleanup temp vault
  await fs.rm(VAULT, { recursive: true, force: true });
}

run().catch((e) => { console.error(e); process.exit(1); });
