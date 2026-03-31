#!/usr/bin/env node
/**
 * take-screenshots.mjs
 * Launches the Electron app and captures screenshots for the README.
 *
 * Usage: npm run build && node scripts/take-screenshots.mjs
 * Output: docs/screenshots/*.png
 */

import { _electron as electron } from "playwright";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SHOTS = path.join(ROOT, "docs", "screenshots");

await fs.mkdir(SHOTS, { recursive: true });

console.log("Launching Electron app...");

const app = await electron.launch({
  args: [path.join(ROOT, "electron/main.cjs")],
  env: { ...process.env, NODE_ENV: "test" },
});

const win = await app.firstWindow();
await win.waitForLoadState("domcontentloaded");
await win.waitForTimeout(2000);

const shot = async (name, opts = {}) => {
  const p = path.join(SHOTS, `${name}.png`);
  if (opts.clip) {
    await win.screenshot({ path: p, clip: opts.clip });
  } else if (opts.locator) {
    await opts.locator.screenshot({ path: p });
  } else {
    await win.screenshot({ path: p });
  }
  console.log(`  ✓ ${name}.png`);
};

// ── 1. Overview (full app) ──
console.log("\n📸 Taking screenshots...\n");
await shot("overview");

// ── 2. Try to open or create a page to show the editor ──
const sidebar = win.locator(".sidebar");
const docItem = win.locator(".doc-item").first();
if (await docItem.isVisible({ timeout: 2000 }).catch(() => false)) {
  await docItem.click();
  await win.waitForTimeout(1000);
}

// ── 3. Editor with toolbar ──
const toolbar = win.locator('[data-variant="fixed"]').first();
if (await toolbar.isVisible({ timeout: 2000 }).catch(() => false)) {
  await shot("toolbar", { locator: toolbar });
}

// ── 4. Editor content area ──
await shot("editor-with-content");

// ── 5. Slash command menu ──
const editor = win.locator(".tiptap.ProseMirror").first();
if (await editor.isVisible({ timeout: 2000 }).catch(() => false)) {
  await editor.click();
  await win.keyboard.press("Enter");
  await win.keyboard.type("/");
  await win.waitForTimeout(500);
  const slashMenu = win.locator(".slash-menu");
  if (await slashMenu.isVisible({ timeout: 1000 }).catch(() => false)) {
    await shot("slash-commands", { locator: slashMenu });
    await win.keyboard.press("Escape");
    await win.waitForTimeout(300);
  }
}

// ── 6. Insert dropdown ──
const insertBtn = win.locator('.tiptap-button-icon').last();
// Try clicking the + dropdown button
const plusBtns = win.locator('button[aria-label="Insertar componente"]');
if (await plusBtns.first().isVisible({ timeout: 1000 }).catch(() => false)) {
  await plusBtns.first().click();
  await win.waitForTimeout(500);
  const insertMenu = win.locator(".insert-menu");
  if (await insertMenu.isVisible({ timeout: 1000 }).catch(() => false)) {
    await shot("insert-menu", { locator: insertMenu });
    await win.keyboard.press("Escape");
    await win.waitForTimeout(300);
  }
}

// ── 7. Insert a callout via slash command ──
if (await editor.isVisible()) {
  await editor.click();
  await win.keyboard.press("Enter");
  await win.keyboard.type("/note");
  await win.waitForTimeout(500);
  await win.keyboard.press("Enter");
  await win.waitForTimeout(500);
  await win.keyboard.type("Esta es una nota informativa importante.");
  await win.waitForTimeout(300);

  // Insert more callout types
  await win.keyboard.press("Enter");
  await win.keyboard.press("Enter");
  await win.keyboard.type("/tip");
  await win.waitForTimeout(300);
  await win.keyboard.press("Enter");
  await win.waitForTimeout(300);
  await win.keyboard.type("Consejo: usa callouts para destacar informacion.");
  await win.waitForTimeout(300);

  await win.keyboard.press("Enter");
  await win.keyboard.press("Enter");
  await win.keyboard.type("/warning");
  await win.waitForTimeout(300);
  await win.keyboard.press("Enter");
  await win.waitForTimeout(300);
  await win.keyboard.type("Cuidado con los cambios en produccion.");
  await win.waitForTimeout(500);

  await shot("callouts");
}

// ── 8. Insert mermaid diagram ──
if (await editor.isVisible()) {
  await editor.click();
  await win.keyboard.press("Enter");
  await win.keyboard.press("Enter");
  await win.keyboard.type("/mermaid");
  await win.waitForTimeout(300);
  await win.keyboard.press("Enter");
  await win.waitForTimeout(2000); // Wait for mermaid to render
  await shot("mermaid");
}

// ── 9. Insert API endpoint ──
if (await editor.isVisible()) {
  await editor.click();
  await win.keyboard.press("Enter");
  await win.keyboard.press("Enter");
  await win.keyboard.type("/api");
  await win.waitForTimeout(300);
  const apiItem = win.locator(".slash-menu-item", { hasText: "API Endpoint" });
  if (await apiItem.isVisible({ timeout: 1000 }).catch(() => false)) {
    await apiItem.click();
  } else {
    await win.keyboard.press("Enter");
  }
  await win.waitForTimeout(500);
  await shot("api-endpoint");
}

// ── 10. Insert math ──
if (await editor.isVisible()) {
  await editor.click();
  await win.keyboard.press("Enter");
  await win.keyboard.press("Enter");
  await win.keyboard.type("/math");
  await win.waitForTimeout(300);
  await win.keyboard.press("Enter");
  await win.waitForTimeout(500);
  await shot("katex");
}

// ── 11. Dark mode overview ──
const themeToggle = win.locator("button[aria-label]").filter({ hasText: "" }).last();
// Find the actual theme toggle button
const toggleBtns = win.locator(".tiptap-button").last();
await win.evaluate(() => {
  document.documentElement.classList.toggle("dark");
});
await win.waitForTimeout(500);
await shot("dark-mode");

// Switch back to light
await win.evaluate(() => {
  document.documentElement.classList.toggle("dark");
});

// ── 12. Sidebar ──
await shot("sidebar", { locator: sidebar });

// ── 13. Final full overview with content ──
await shot("full-app");

// ── 14. Dark mode full ──
await win.evaluate(() => {
  document.documentElement.classList.add("dark");
});
await win.waitForTimeout(500);
await shot("full-app-dark");

console.log(`\n✅ Done! Screenshots saved to docs/screenshots/\n`);

await app.close();
