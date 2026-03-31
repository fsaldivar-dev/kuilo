/**
 * E2E — Editor (web mode contra Vite dev server)
 * Corre con: npm run test:e2e:web
 */

import { test, expect } from "@playwright/test";

test.describe("Editor básico", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Espera a que el editor esté listo
    await page.waitForSelector(".simple-editor-wrapper", { timeout: 10000 });
  });

  test("la app carga sin errores de consola críticos", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.reload();
    await page.waitForSelector(".simple-editor-wrapper");
    const criticalErrors = errors.filter(
      (e) => !e.includes("ResizeObserver") && !e.includes("Warning:")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("el sidebar muestra paquetes", async ({ page }) => {
    await expect(page.locator(".sidebar")).toBeVisible();
  });

  test("el editor acepta texto", async ({ page }) => {
    const editor = page.locator(".tiptap.ProseMirror").first();
    await editor.click();
    await page.keyboard.type("Hola mundo");
    await expect(editor).toContainText("Hola mundo");
  });

  test("Enter crea nuevo párrafo sin romper el editor", async ({ page }) => {
    const editor = page.locator(".tiptap.ProseMirror").first();
    await editor.click();
    await page.keyboard.type("Línea uno");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Línea dos");
    await expect(editor).toContainText("Línea uno");
    await expect(editor).toContainText("Línea dos");
  });

  test("Cmd+B aplica negrita", async ({ page }) => {
    const editor = page.locator(".tiptap.ProseMirror").first();
    await editor.click();
    await page.keyboard.type("texto bold");
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Meta+b");
    await expect(editor.locator("strong")).toBeVisible();
  });
});
