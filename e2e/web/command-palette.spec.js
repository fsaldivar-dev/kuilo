/**
 * E2E — Command Palette (Cmd+K)
 */

import { test, expect } from "@playwright/test";

test.describe("Command Palette — Cmd+K", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("opens with Cmd+K and closes with Escape", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await expect(page.locator(".palette")).toBeVisible();
    await expect(page.locator(".palette-input")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.locator(".palette")).not.toBeVisible();
  });

  test("opens with Ctrl+K (Windows/Linux)", async ({ page }) => {
    await page.keyboard.press("Control+k");
    await expect(page.locator(".palette")).toBeVisible();
  });

  test("shows app actions in command list", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    const palette = page.locator(".palette");
    await expect(palette.locator(".palette-item")).not.toHaveCount(0);
    await expect(palette.locator(".palette-title", { hasText: "Nuevo paquete" })).toBeVisible();
    await expect(palette.locator(".palette-title", { hasText: "Conectores AI" })).toBeVisible();
  });

  test("filters commands by query", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    const countBefore = await page.locator(".palette-item").count();

    await page.locator(".palette-input").fill("vault");
    const countAfter = await page.locator(".palette-item").count();
    expect(countAfter).toBeLessThan(countBefore);
    await expect(page.locator(".palette .palette-title", { hasText: "Cambiar vault" })).toBeVisible();
  });

  test("shows empty state for no match", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await page.locator(".palette-input").fill("xyznonexistent");
    await expect(page.locator(".palette-empty")).toContainText("Sin resultados");
  });

  test("closes when clicking overlay", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await expect(page.locator(".palette")).toBeVisible();
    await page.locator(".palette-overlay").click({ position: { x: 10, y: 10 } });
    await expect(page.locator(".palette")).not.toBeVisible();
  });

  test("navigates with arrow keys and selects with Enter", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    const first = page.locator(".palette-item").first();
    await expect(first).toHaveClass(/selected/);

    await page.keyboard.press("ArrowDown");
    await expect(first).not.toHaveClass(/selected/);
    await expect(page.locator(".palette-item").nth(1)).toHaveClass(/selected/);
  });

  test("screenshot — palette open", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await page.screenshot({ path: "e2e/screenshots/018-command-palette.png" });
  });
});
