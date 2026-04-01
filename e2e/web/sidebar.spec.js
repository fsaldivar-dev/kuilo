/**
 * E2E — Sidebar interactions (web mode)
 * Corre con: npm run test:e2e:web
 */

import { test, expect } from "@playwright/test";

test.describe("Sidebar — navegación y paquetes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("colapsar y expandir sidebar", async ({ page }) => {
    const sidebar = page.locator(".sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar).not.toHaveClass(/collapsed/);

    // Colapsar
    await page.locator(".collapse-btn").click();
    await expect(sidebar).toHaveClass(/collapsed/);

    // El botón de expandir aparece en el workspace
    const expandBtn = page.locator(".sidebar-expand-btn");
    await expect(expandBtn).toBeVisible();
    await expandBtn.click();
    await expect(sidebar).not.toHaveClass(/collapsed/);
  });

  test("abrir y cerrar formulario de nuevo paquete con Escape", async ({ page }) => {
    await page.locator(".footer-btn.primary").click();
    await expect(page.locator(".pkg-form")).toBeVisible();

    const input = page.locator(".pkg-form input");
    await expect(input).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.locator(".pkg-form")).not.toBeVisible();
  });

  test("abrir y cancelar formulario con botón Cancelar", async ({ page }) => {
    await page.locator(".footer-btn.primary").click();
    await expect(page.locator(".pkg-form")).toBeVisible();

    await page.locator(".pkg-form-cancel").click();
    await expect(page.locator(".pkg-form")).not.toBeVisible();
  });

  test("formulario muestra error si se envía vacío", async ({ page }) => {
    await page.locator(".footer-btn.primary").click();
    await page.locator(".pkg-form-submit").click();
    await expect(page.locator(".pkg-form-error")).toBeVisible();
    await expect(page.locator(".pkg-form-error")).toContainText("Escribe un nombre");
  });

  test("sidebar tiene barra de búsqueda funcional", async ({ page }) => {
    const searchInput = page.locator(".search-bar input");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute("placeholder", /Buscar/);

    // Escribir y limpiar no rompe nada
    await searchInput.fill("test query");
    await expect(searchInput).toHaveValue("test query");
    await searchInput.fill("");
    await expect(searchInput).toHaveValue("");
  });

  test("sidebar cuando está colapsado oculta contenido", async ({ page }) => {
    await page.locator(".collapse-btn").click();

    // Search bar, nav-tree, footer no deberían estar visibles
    await expect(page.locator(".search-bar")).not.toBeVisible();
    await expect(page.locator(".nav-tree")).not.toBeVisible();
    await expect(page.locator(".sidebar-footer")).not.toBeVisible();
  });
});
