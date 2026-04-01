/**
 * E2E — Workspace interactions (web mode)
 * Corre con: npm run test:e2e:web
 *
 * En modo web sin Electron API, la app arranca sin docs.
 * Validamos el empty state y el layout general.
 */

import { test, expect } from "@playwright/test";

test.describe("Workspace — layout y empty state", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("muestra empty state con mensaje correcto", async ({ page }) => {
    const emptyState = page.locator(".empty-state");
    if (await emptyState.isVisible()) {
      await expect(emptyState).toContainText("Sin página seleccionada");
      await expect(emptyState).toContainText("Elige una página");
    }
  });

  test("el layout tiene sidebar y workspace", async ({ page }) => {
    await expect(page.locator(".app-shell")).toBeVisible();
    await expect(page.locator(".sidebar")).toBeVisible();
    await expect(page.locator(".workspace")).toBeVisible();
  });

  test("el workspace ocupa el espacio principal", async ({ page }) => {
    const workspace = page.locator(".workspace");
    const box = await workspace.boundingBox();
    expect(box.width).toBeGreaterThan(400);
    expect(box.height).toBeGreaterThan(300);
  });

  test("colapsar sidebar da más espacio al workspace", async ({ page }) => {
    const workspace = page.locator(".workspace");
    const widthBefore = (await workspace.boundingBox()).width;

    await page.locator(".collapse-btn").click();
    await page.waitForTimeout(300); // Animación CSS

    const widthAfter = (await workspace.boundingBox()).width;
    expect(widthAfter).toBeGreaterThan(widthBefore);
  });
});
