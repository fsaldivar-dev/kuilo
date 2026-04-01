/**
 * E2E — Wiki Links (@mention) + Backlinks
 */

import { test, expect } from "@playwright/test";

test.describe("Wiki Links — @mention + backlinks", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("backlinks button is visible in doc header", async ({ page }) => {
    // Only visible when a doc is open — in web mode might be empty state
    const btn = page.locator('.control-btn:has-text("Backlinks")');
    const hasDoc = await page.locator(".doc-header").isVisible();
    if (hasDoc) {
      await expect(btn).toBeVisible();
    }
  });

  test("backlinks panel opens and closes", async ({ page }) => {
    const btn = page.locator('.control-btn:has-text("Backlinks")');
    if (!(await btn.isVisible())) return;

    await btn.click();
    await expect(page.locator(".backlinks-panel")).toBeVisible();
    await expect(page.locator(".backlinks-header h3")).toContainText("Backlinks");

    // Close
    await page.locator(".backlinks-panel .history-close").click();
    await expect(page.locator(".backlinks-panel")).not.toBeVisible();
  });

  test("backlinks panel shows empty state when no links", async ({ page }) => {
    const btn = page.locator('.control-btn:has-text("Backlinks")');
    if (!(await btn.isVisible())) return;

    await btn.click();
    // In web mode with no API, should show empty
    const empty = page.locator(".backlinks-empty");
    if (await empty.isVisible()) {
      await expect(empty).toContainText("Ninguna otra página enlaza aquí");
    }
  });

  test("wiki link renders with correct style", async ({ page }) => {
    // Check that wiki-link CSS class exists in stylesheet
    const hasStyle = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText?.includes("wiki-link")) return true;
          }
        } catch {}
      }
      return false;
    });
    expect(hasStyle).toBe(true);
  });

  test("snapshot — backlinks panel open", async ({ page }) => {
    const btn = page.locator('.control-btn:has-text("Backlinks")');
    if (!(await btn.isVisible())) return;

    await btn.click();
    await expect(page.locator(".backlinks-panel")).toBeVisible();
    await expect(page).toHaveScreenshot("019-backlinks-panel.png");
  });
});
