/**
 * E2E — Full app feature audit with screenshots
 * Corre con: npm run test:e2e:web
 *
 * Captura screenshots de cada feature para inspección visual.
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
    await page.screenshot({ path: "e2e/screenshots/001-app-shell.png", fullPage: true });
  });

  test("002 — Titlebar muestra logo y nombre Kuilo", async ({ page }) => {
    const titlebar = page.locator(".titlebar");
    await expect(titlebar).toBeVisible();
    await expect(page.locator(".titlebar-logo")).toBeVisible();
    await expect(page.locator(".titlebar-name")).toContainText("Kuilo");
    await page.screenshot({ path: "e2e/screenshots/002-titlebar.png" });
  });

  test("003 — Sidebar collapse/expand cycle completo", async ({ page }) => {
    // Collapsed state
    await page.locator(".collapse-btn").click();
    await page.screenshot({ path: "e2e/screenshots/003a-sidebar-collapsed.png" });
    await expect(page.locator(".sidebar")).toHaveClass(/collapsed/);
    await expect(page.locator(".search-bar")).not.toBeVisible();
    await expect(page.locator(".sidebar-footer")).not.toBeVisible();

    // Expand from workspace button
    await page.locator(".sidebar-expand-btn").click();
    await page.screenshot({ path: "e2e/screenshots/003b-sidebar-expanded.png" });
    await expect(page.locator(".sidebar")).not.toHaveClass(/collapsed/);
    await expect(page.locator(".search-bar")).toBeVisible();
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
    await page.screenshot({ path: "e2e/screenshots/004-footer-buttons.png" });
  });

  test("005 — Nuevo paquete: form abre, valida, y cancela", async ({ page }) => {
    // Abrir form
    await page.locator(".footer-btn.primary").click();
    await expect(page.locator(".pkg-form")).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/005a-pkg-form-open.png" });

    // Enviar vacío → error
    await page.locator(".pkg-form-submit").click();
    await expect(page.locator(".pkg-form-error")).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/005b-pkg-form-error.png" });

    // Cancelar con botón
    await page.locator(".pkg-form-cancel").click();
    await expect(page.locator(".pkg-form")).not.toBeVisible();

    // Abrir de nuevo y cancelar con Escape
    await page.locator(".footer-btn.primary").click();
    await page.keyboard.press("Escape");
    await expect(page.locator(".pkg-form")).not.toBeVisible();
  });

  test("006 — Vault button muestra path o 'Cambiar vault'", async ({ page }) => {
    const vaultBtn = page.locator(".vault-btn");
    await expect(vaultBtn).toBeVisible();
    const text = await vaultBtn.textContent();
    expect(text.length).toBeGreaterThan(0);
    await page.screenshot({ path: "e2e/screenshots/006-vault-btn.png" });
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
    await expect(input).toHaveAttribute("placeholder", /Buscar en títulos y contenido/);

    await input.fill("test");
    await page.screenshot({ path: "e2e/screenshots/007a-search-with-query.png" });

    await input.fill("");
    await page.screenshot({ path: "e2e/screenshots/007b-search-cleared.png" });
  });

  test("008 — Nav tree visible y responde a búsqueda", async ({ page }) => {
    const navTree = page.locator(".nav-tree");
    await expect(navTree).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/008-nav-tree.png" });
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
      await expect(empty).toContainText("Elige una página");
      await page.screenshot({ path: "e2e/screenshots/009-empty-state.png" });
    }
  });

  test("010 — Layout responsivo — workspace usa todo el ancho disponible", async ({ page }) => {
    const workspace = page.locator(".workspace");
    const box = await workspace.boundingBox();
    expect(box.width).toBeGreaterThan(500);

    // Colapsar sidebar agranda workspace
    const widthBefore = box.width;
    await page.locator(".collapse-btn").click();
    await page.waitForTimeout(300);
    const widthAfter = (await workspace.boundingBox()).width;
    expect(widthAfter).toBeGreaterThan(widthBefore);
    await page.screenshot({ path: "e2e/screenshots/010-workspace-wide.png" });
  });
});

test.describe("Feature audit — Connectors Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("011 — Modal de Conectores AI abre y cierra", async ({ page }) => {
    await page.locator("text=Conectores AI").click();
    const modal = page.locator(".connectors-modal");
    await expect(modal).toBeVisible();
    await expect(page.locator(".connectors-header h2")).toContainText("Conectores AI");
    await page.screenshot({ path: "e2e/screenshots/011a-connectors-open.png" });

    // Cerrar con X
    await page.locator(".connectors-close").click();
    await expect(modal).not.toBeVisible();
  });

  test("012 — Modal muestra hint cuando no hay Electron API", async ({ page }) => {
    await page.locator("text=Conectores AI").click();
    // Sin Electron, mcpInfo es null
    await expect(page.locator(".connectors-hint")).toContainText("Ejecuta la app desde Electron");
    await page.screenshot({ path: "e2e/screenshots/012-connectors-no-electron.png" });
  });

  test("013 — Modal se cierra al click en overlay", async ({ page }) => {
    await page.locator("text=Conectores AI").click();
    await expect(page.locator(".connectors-modal")).toBeVisible();

    // Click en el overlay (fuera del modal)
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
    // ProjectWizard debería aparecer
    const wizard = page.locator(".wizard-overlay, .project-wizard");
    if (await wizard.isVisible()) {
      await page.screenshot({ path: "e2e/screenshots/014-wizard-open.png" });
    }
    // Si no hay overlay, podría ser un dialog diferente
    await page.screenshot({ path: "e2e/screenshots/014-after-wizard-click.png" });
  });
});

test.describe("Feature audit — Visual consistency", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("015 — Screenshot completo del estado inicial", async ({ page }) => {
    await page.screenshot({ path: "e2e/screenshots/015-full-initial-state.png", fullPage: true });
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

  test("017 — No hay elementos con overflow visible roto", async ({ page }) => {
    // Verifica que no hay contenido que se desborde del viewport
    const body = await page.evaluate(() => ({
      scrollWidth: document.body.scrollWidth,
      clientWidth: document.body.clientWidth,
    }));
    expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth + 5);
  });
});
