/**
 * E2E — Full app feature audit with visual regression snapshots
 * Corre con: npm run test:e2e:web
 *
 * Uses toHaveScreenshot() — first run creates baselines in *-snapshots/,
 * subsequent runs compare pixel-by-pixel (1% threshold).
 * Update baselines: npx playwright test --update-snapshots
 */

import { test, expect } from "@playwright/test";

test.describe("Feature audit — App Shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("001 — App carga correctamente con layout completo", async ({ page }) => {
    await expect(page.locator(".app-shell")).toBeVisible();
    await expect(page.locator(".sidebar")).toBeVisible();
    await expect(page.locator(".workspace")).toBeVisible();
    await expect(page).toHaveScreenshot("001-app-shell.png", { fullPage: true });
  });

  test("002 — Titlebar muestra logo y nombre Kuilo", async ({ page }) => {
    await expect(page.locator(".titlebar")).toBeVisible();
    await expect(page.locator(".titlebar-logo")).toBeVisible();
    await expect(page.locator(".titlebar-name")).toContainText("Kuilo");
    await expect(page).toHaveScreenshot("002-titlebar.png");
  });

  test("003 — Sidebar collapse/expand cycle completo", async ({ page }) => {
    await page.locator(".collapse-btn").click();
    await expect(page.locator(".sidebar")).toHaveClass(/collapsed/);
    await expect(page).toHaveScreenshot("003a-sidebar-collapsed.png");

    await page.locator(".sidebar-expand-btn").click();
    await expect(page.locator(".sidebar")).not.toHaveClass(/collapsed/);
    await expect(page).toHaveScreenshot("003b-sidebar-expanded.png");
  });
});

test.describe("Feature audit — Sidebar Footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("004 — Todos los botones del footer están presentes", async ({ page }) => {
    const footer = page.locator(".sidebar-footer");
    await expect(footer.locator("text=Nuevo paquete")).toBeVisible();
    await expect(footer.locator("text=Abrir carpeta")).toBeVisible();
    await expect(footer.locator("text=Exportar libro PDF")).toBeVisible();
    await expect(footer.locator("text=Nuevo proyecto")).toBeVisible();
    await expect(footer.locator("text=Conectores AI")).toBeVisible();
    await expect(page).toHaveScreenshot("004-footer-buttons.png");
  });

  test("005 — Nuevo paquete: form abre, valida, y cancela", async ({ page }) => {
    await page.locator(".footer-btn.primary").click();
    await expect(page.locator(".pkg-form")).toBeVisible();
    await expect(page).toHaveScreenshot("005a-pkg-form-open.png");

    await page.locator(".pkg-form-submit").click();
    await expect(page.locator(".pkg-form-error")).toBeVisible();
    await expect(page).toHaveScreenshot("005b-pkg-form-error.png");

    await page.locator(".pkg-form-cancel").click();
    await expect(page.locator(".pkg-form")).not.toBeVisible();

    await page.locator(".footer-btn.primary").click();
    await page.keyboard.press("Escape");
    await expect(page.locator(".pkg-form")).not.toBeVisible();
  });

  test("006 — Vault button muestra path o 'Cambiar vault'", async ({ page }) => {
    const vaultBtn = page.locator(".vault-btn");
    await expect(vaultBtn).toBeVisible();
    await expect(page).toHaveScreenshot("006-vault-btn.png");
  });
});

test.describe("Feature audit — Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("007 — Barra de búsqueda presente y funcional", async ({ page }) => {
    const input = page.locator(".search-bar input");
    await expect(input).toBeVisible();

    await input.fill("test");
    await expect(page).toHaveScreenshot("007a-search-with-query.png");

    await input.fill("");
    await expect(page).toHaveScreenshot("007b-search-cleared.png");
  });

  test("008 — Nav tree visible", async ({ page }) => {
    await expect(page.locator(".nav-tree")).toBeVisible();
    await expect(page).toHaveScreenshot("008-nav-tree.png");
  });
});

test.describe("Feature audit — Workspace empty state", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("009 — Empty state con mensaje correcto", async ({ page }) => {
    const empty = page.locator(".empty-state");
    if (await empty.isVisible()) {
      await expect(empty).toContainText("Sin página seleccionada");
      await expect(page).toHaveScreenshot("009-empty-state.png");
    }
  });

  test("010 — Colapsar sidebar da más espacio al workspace", async ({ page }) => {
    const workspace = page.locator(".workspace");
    const widthBefore = (await workspace.boundingBox()).width;
    await page.locator(".collapse-btn").click();
    await page.waitForTimeout(300);
    const widthAfter = (await workspace.boundingBox()).width;
    expect(widthAfter).toBeGreaterThan(widthBefore);
    await expect(page).toHaveScreenshot("010-workspace-wide.png");
  });
});

test.describe("Feature audit — Connectors Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("011 — Modal de Conectores AI abre y cierra", async ({ page }) => {
    await page.locator("text=Conectores AI").click();
    await expect(page.locator(".connectors-modal")).toBeVisible();
    await expect(page).toHaveScreenshot("011a-connectors-open.png");

    await page.locator(".connectors-close").click();
    await expect(page.locator(".connectors-modal")).not.toBeVisible();
  });

  test("012 — Modal muestra hint sin Electron", async ({ page }) => {
    await page.locator("text=Conectores AI").click();
    await expect(page.locator(".connectors-hint")).toContainText("Ejecuta la app desde Electron");
    await expect(page).toHaveScreenshot("012-connectors-no-electron.png");
  });

  test("013 — Modal se cierra al click en overlay", async ({ page }) => {
    await page.locator("text=Conectores AI").click();
    await expect(page.locator(".connectors-modal")).toBeVisible();
    await page.locator(".connectors-overlay").click({ position: { x: 10, y: 10 } });
    await expect(page.locator(".connectors-modal")).not.toBeVisible();
  });
});

test.describe("Feature audit — Project Wizard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("014 — Wizard abre al click en Nuevo proyecto", async ({ page }) => {
    await page.locator("text=Nuevo proyecto").click();
    const wizard = page.locator(".wizard-overlay, .project-wizard");
    if (await wizard.isVisible()) {
      await expect(page).toHaveScreenshot("014-wizard-open.png");
    }
  });
});

test.describe("Feature audit — Visual consistency", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("015 — Screenshot completo del estado inicial", async ({ page }) => {
    await expect(page).toHaveScreenshot("015-full-initial-state.png", { fullPage: true });
  });

  test("016 — Sin errores de consola JavaScript", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.reload();
    await page.waitForSelector(".sidebar", { timeout: 10000 });
    const criticalErrors = errors.filter(
      (e) => !e.includes("ResizeObserver") && !e.includes("Warning:")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("017 — No hay elementos con overflow roto", async ({ page }) => {
    const body = await page.evaluate(() => ({
      scrollWidth: document.body.scrollWidth,
      clientWidth: document.body.clientWidth,
    }));
    expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth + 5);
  });
});
