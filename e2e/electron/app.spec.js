/**
 * E2E — Electron app instrumentada
 * Corre con: npm run test:e2e:electron
 *
 * Nota: requiere `npm run build` previo para tener el dist listo.
 * Usa electron-playwright-helpers para lanzar el proceso de Electron.
 */

import { test, expect } from "@playwright/test";
import { findLatestBuild, parseElectronApp } from "electron-playwright-helpers";
import { _electron as electron } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../");

test.describe("Electron App", () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    // Lanza electron directamente con el main.cjs después de build
    electronApp = await electron.launch({
      args: [path.join(ROOT, "electron/main.cjs")],
      env: {
        ...process.env,
        NODE_ENV: "test",
        VITE_DEV_SERVER_URL: undefined,
      },
    });
    window = await electronApp.firstWindow();
    await window.waitForSelector(".simple-editor-wrapper", { timeout: 15000 });
  });

  test.afterAll(async () => {
    await electronApp?.close();
  });

  test("la ventana abre y muestra el editor", async () => {
    expect(window).toBeDefined();
    await expect(window.locator(".simple-editor-wrapper")).toBeVisible();
  });

  test("el sidebar carga el árbol de docs", async () => {
    await expect(window.locator(".sidebar")).toBeVisible();
  });

  test("se puede escribir en el editor", async () => {
    const editor = window.locator(".tiptap.ProseMirror").first();
    await editor.click();
    await window.keyboard.type("Test Electron E2E");
    await expect(editor).toContainText("Test Electron E2E");
  });

  test("el indicador de guardado cambia a 'Guardando...'", async () => {
    const editor = window.locator(".tiptap.ProseMirror").first();
    await editor.click();
    await window.keyboard.type("trigger save");
    await expect(window.locator(".save-indicator")).toContainText("Guardando");
  });
});
