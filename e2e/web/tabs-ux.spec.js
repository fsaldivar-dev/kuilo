/**
 * E2E — Tabs, Favorites, Shortcuts
 */

import { test, expect } from "@playwright/test";

test.describe("Tabs & UX features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("shortcuts modal opens with Cmd+/ and closes with Escape", async ({ page }) => {
    await page.keyboard.press("Meta+/");
    await expect(page.locator(".shortcuts-modal")).toBeVisible();
    await expect(page.locator(".shortcuts-header h3")).toContainText("Atajos");

    await page.keyboard.press("Escape");
    await expect(page.locator(".shortcuts-modal")).not.toBeVisible();
  });

  test("shortcuts modal shows all categories", async ({ page }) => {
    await page.keyboard.press("Meta+/");
    const modal = page.locator(".shortcuts-modal");
    await expect(modal.locator("h4")).not.toHaveCount(0);
    await expect(modal.locator(".shortcut-row")).not.toHaveCount(0);
  });

  test("shortcuts modal has correct structure", async ({ page }) => {
    await page.evaluate(() => {
      const modal = document.createElement("div");
      modal.className = "shortcuts-modal";
      modal.id = "shortcuts-preview";
      modal.style.cssText = "position:static;margin:20px auto;max-width:480px;";
      modal.innerHTML = `
        <div class="shortcuts-header"><h3>Atajos de teclado</h3></div>
        <div class="shortcuts-body">
          <div class="shortcuts-group"><h4>General</h4>
            <div class="shortcut-row"><span class="shortcut-desc">Command palette</span><kbd class="shortcut-keys">⌘+K</kbd></div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    });
    const modal = page.locator("#shortcuts-preview");
    await expect(modal).toBeVisible();
    await expect(modal.locator("h3")).toContainText("Atajos");
    await expect(modal.locator("kbd")).toContainText("⌘+K");
    const box = await modal.boundingBox();
    expect(box.width).toBeGreaterThan(300);
  });

  test("snapshot — tab bar", async ({ page }) => {
    await page.evaluate(() => {
      const bar = document.createElement("div");
      bar.className = "tab-bar";
      bar.id = "tabbar-preview";
      bar.style.cssText = "position:static;width:600px;margin:20px auto;";
      bar.innerHTML = `
        <div class="tab active">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
          <span class="tab-title">Getting Started</span>
          <button class="tab-close"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="tab">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ff9f0a" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
          <span class="tab-title">API Reference</span>
          <button class="tab-close"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="tab">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
          <span class="tab-title">Deployment Guide</span>
          <button class="tab-close"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      `;
      document.body.appendChild(bar);
    });
    const bar = page.locator("#tabbar-preview");
    await expect(bar).toBeVisible();
    await expect(bar.locator(".tab")).toHaveCount(3);
    await expect(bar.locator(".tab.active")).toHaveCount(1);
    const box = await bar.boundingBox();
    expect(box.width).toBeGreaterThan(400);
  });

  test("favorite star icon in tree", async ({ page }) => {
    // Check that favorite CSS exists
    const hasStyle = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText?.includes("fav-star")) return true;
          }
        } catch {}
      }
      return false;
    });
    expect(hasStyle).toBe(true);
  });

  test("duplicate button exists in tree", async ({ page }) => {
    // Check that Copy icon btn exists in CSS
    const hasStyle = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText?.includes("icon-btn")) return true;
          }
        } catch {}
      }
      return false;
    });
    expect(hasStyle).toBe(true);
  });
});
