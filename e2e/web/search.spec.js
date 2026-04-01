/**
 * E2E — Search functionality (web mode)
 * Corre con: npm run test:e2e:web
 */

import { test, expect } from "@playwright/test";

test.describe("Search — barra de búsqueda", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("el campo de búsqueda está visible y tiene placeholder", async ({ page }) => {
    const searchInput = page.locator(".search-bar input");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute("placeholder", /Buscar en títulos y contenido/);
  });

  test("escribir en búsqueda no rompe la UI", async ({ page }) => {
    const searchInput = page.locator(".search-bar input");
    await searchInput.fill("query de prueba");
    await expect(searchInput).toHaveValue("query de prueba");

    // La app no debe crashear
    await expect(page.locator(".sidebar")).toBeVisible();
    await expect(page.locator(".workspace")).toBeVisible();
  });

  test("limpiar búsqueda restaura el estado normal", async ({ page }) => {
    const searchInput = page.locator(".search-bar input");
    await searchInput.fill("algo");
    await page.waitForTimeout(200);

    await searchInput.fill("");
    await page.waitForTimeout(200);

    // El nav-tree debe ser visible de nuevo
    await expect(page.locator(".nav-tree")).toBeVisible();
  });
});
