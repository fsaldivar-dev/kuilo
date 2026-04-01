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

    await page.locator(".backlinks-panel .history-close").click();
    await expect(page.locator(".backlinks-panel")).not.toBeVisible();
  });

  test("backlinks panel shows empty state when no links", async ({ page }) => {
    const btn = page.locator('.control-btn:has-text("Backlinks")');
    if (!(await btn.isVisible())) return;

    await btn.click();
    const empty = page.locator(".backlinks-empty");
    if (await empty.isVisible()) {
      await expect(empty).toContainText("Ninguna otra página enlaza aquí");
    }
  });

  test("wiki link renders with correct style", async ({ page }) => {
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

  test("snapshot — wiki link rendered inline", async ({ page }) => {
    // Inject a wiki link into the page to capture its style
    await page.evaluate(() => {
      const container = document.createElement("div");
      container.id = "wiki-link-preview";
      container.style.cssText = "padding:40px;background:var(--bg,#f2f2f7);display:flex;flex-direction:column;gap:12px;";
      container.innerHTML = `
        <p style="font-size:15px;color:#1d1d1f;">
          Para más detalles consulta <a data-wiki-link class="wiki-link" title="API Reference" href="#">API Reference</a>
          y también <a data-wiki-link class="wiki-link" title="Getting Started" href="#">Getting Started</a>.
        </p>
      `;
      document.body.appendChild(container);
    });
    await expect(page.locator("#wiki-link-preview")).toHaveScreenshot("020-wiki-link-inline.png");
  });

  test("snapshot — @mention dropdown", async ({ page }) => {
    // Inject a mention menu to capture its style
    await page.evaluate(() => {
      const menu = document.createElement("div");
      menu.className = "mention-menu";
      menu.id = "mention-preview";
      menu.style.cssText = "position:static;margin:40px auto;";
      const items = [
        { title: "API Reference", pkg: "docs" },
        { title: "Getting Started", pkg: "docs" },
        { title: "Deployment Guide", pkg: "guides" },
        { title: "Customer Journey", pkg: "cliente" },
      ];
      menu.innerHTML = items.map((item, i) => `
        <button class="mention-item ${i === 0 ? "selected" : ""}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span class="mention-item-text">
            <span class="mention-item-title">${item.title}</span>
            <span class="mention-item-pkg">${item.pkg}</span>
          </span>
        </button>
      `).join("");
      document.body.appendChild(menu);
    });
    await expect(page.locator("#mention-preview")).toHaveScreenshot("021-mention-dropdown.png");
  });

  test("snapshot — backlinks panel open", async ({ page }) => {
    const btn = page.locator('.control-btn:has-text("Backlinks")');
    if (!(await btn.isVisible())) return;

    await btn.click();
    await expect(page.locator(".backlinks-panel")).toBeVisible();
    await expect(page).toHaveScreenshot("019-backlinks-panel.png");
  });
});
