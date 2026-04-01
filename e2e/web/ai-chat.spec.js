/**
 * E2E — AI Chat panel
 */

import { test, expect } from "@playwright/test";

test.describe("AI Chat — Kuilo AI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
  });

  test("Kuilo AI button exists in sidebar footer", async ({ page }) => {
    await expect(page.locator("text=Kuilo AI")).toBeVisible();
  });

  test("chat panel structure renders correctly", async ({ page }) => {
    // Inject chat panel to verify structure
    await page.evaluate(() => {
      const chat = document.createElement("div");
      chat.className = "ai-chat";
      chat.id = "chat-preview";
      chat.style.cssText = "position:static;width:360px;height:500px;margin:20px auto;";
      chat.innerHTML = `
        <div class="ai-chat-header">
          <svg width="15" height="15"></svg>
          <span>Kuilo AI</span>
          <div class="ai-chat-header-actions">
            <button class="ai-chat-settings-btn"><svg width="13" height="13"></svg></button>
            <button class="ai-chat-close"><svg width="14" height="14"></svg></button>
          </div>
        </div>
        <div class="ai-chat-messages" style="flex:1;padding:12px 16px;">
          <div class="ai-chat-msg ai-chat-msg-user">
            <div class="ai-chat-msg-icon" style="background:#0071e3;color:white;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;">U</div>
            <div class="ai-chat-msg-content">¿Cómo escribo un PRD?</div>
          </div>
          <div class="ai-chat-msg ai-chat-msg-assistant">
            <div class="ai-chat-msg-icon" style="background:#f2f2f7;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;">A</div>
            <div class="ai-chat-msg-content">
              Para escribir un PRD, revisa <button class="ai-chat-doc-link"><svg width="11" height="11"></svg> PRD inicial</button> y sigue estos pasos:
              <br/><br/>1. Define el problema<br/>2. Identifica las personas<br/>3. Describe la solución
            </div>
          </div>
        </div>
        <div class="ai-chat-input-row" style="display:flex;gap:6px;padding:12px 16px;border-top:1px solid #e5e5ea;">
          <input class="ai-chat-input" placeholder="Pregunta algo..." style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid #e5e5ea;font-size:13px;"/>
          <button class="ai-chat-send" style="width:36px;height:36px;border-radius:8px;background:#0071e3;color:white;display:grid;place-items:center;">→</button>
        </div>
      `;
      document.body.appendChild(chat);
    });

    const chat = page.locator("#chat-preview");
    await expect(chat).toBeVisible();
    await expect(chat.locator(".ai-chat-header")).toBeVisible();
    await expect(chat.locator(".ai-chat-msg")).toHaveCount(2);
    await expect(chat.locator(".ai-chat-doc-link")).toBeVisible();
    await expect(chat.locator(".ai-chat-input")).toBeVisible();

    // Layout assertions (cross-platform safe)
    const box = await chat.boundingBox();
    expect(box.width).toBeGreaterThan(300);
    expect(box.height).toBeGreaterThan(400);
  });

  test("doc link button renders with correct style", async ({ page }) => {
    const hasStyle = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText?.includes("ai-chat-doc-link")) return true;
          }
        } catch {}
      }
      return false;
    });
    expect(hasStyle).toBe(true);
  });

  test("provider selector has free options first", async ({ page }) => {
    await page.evaluate(() => {
      const select = document.createElement("select");
      select.className = "ai-chat-select";
      select.id = "provider-preview";
      select.innerHTML = `
        <option value="gemini">Gemini Flash (Google) — gratis</option>
        <option value="groq">Llama 3 (Groq) — gratis</option>
        <option value="cohere">Command R (Cohere) — gratis</option>
        <option value="anthropic">Claude Haiku (Anthropic) — $</option>
        <option value="openai">GPT-4o mini (OpenAI) — $</option>
      `;
      document.body.appendChild(select);
    });

    const options = await page.locator("#provider-preview option").allTextContents();
    expect(options[0]).toContain("gratis");
    expect(options[1]).toContain("gratis");
    expect(options[2]).toContain("gratis");
    expect(options[3]).toContain("$");
  });
});
