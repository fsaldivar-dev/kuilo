/**
 * E2E — Editor (web mode contra Vite dev server)
 * Corre con: npm run test:e2e:web
 *
 * En modo web no hay Electron API, la app arranca vacía (sin docs).
 * Estos tests validan la UI shell y el sidebar sin documentos.
 */

import { test, expect } from "@playwright/test";

test.describe("Editor básico", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Espera a que el sidebar renderice (no necesita docs)
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("la app carga sin errores de consola críticos", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.reload();
    await page.waitForSelector(".sidebar");
    const criticalErrors = errors.filter(
      (e) => !e.includes("ResizeObserver") && !e.includes("Warning:")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("el sidebar muestra paquetes o empty state", async ({ page }) => {
    await expect(page.locator(".sidebar")).toBeVisible();
    // Sin API → muestra "Sin páginas aún"
    const hasPages = await page.locator(".pkg-section").count();
    if (hasPages === 0) {
      await expect(page.locator(".nav-tree")).toContainText("Sin páginas aún");
    }
  });

  test("el workspace muestra empty state sin docs", async ({ page }) => {
    const emptyState = page.locator(".empty-state");
    const hasPages = await page.locator(".doc-item").count();
    if (hasPages === 0) {
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText("Sin página seleccionada");
    }
  });

  test("el footer muestra todos los botones de acción", async ({ page }) => {
    await expect(page.locator(".footer-btn.primary")).toContainText("Nuevo paquete");
    await expect(page.locator("text=Abrir carpeta")).toBeVisible();
    await expect(page.locator("text=Exportar libro PDF")).toBeVisible();
    await expect(page.locator("text=Nuevo proyecto")).toBeVisible();
    await expect(page.locator("text=Conectores AI")).toBeVisible();
  });
});
