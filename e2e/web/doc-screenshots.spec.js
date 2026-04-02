/**
 * E2E — Capture screenshots for documentation
 * Each test renders a feature mockup and captures it for docs/screenshots/
 */

import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = path.join(process.cwd(), "docs", "screenshots");

test.describe("Documentation screenshots", () => {

  test("app-shell — full app with sidebar + workspace", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
    const screenshot = await page.screenshot({ fullPage: true });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, "full-app.png"), screenshot);
  });

  test("sidebar — tree with packages and pages", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
    const sidebar = page.locator(".sidebar");
    const screenshot = await sidebar.screenshot();
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, "sidebar.png"), screenshot);
  });

  test("command-palette — Cmd+K open", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
    await page.keyboard.press("Meta+k");
    await page.waitForSelector(".palette", { timeout: 3000 });
    const screenshot = await page.screenshot();
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, "command-palette.png"), screenshot);
  });

  test("empty-state — workspace without doc", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
    const workspace = page.locator(".workspace");
    const screenshot = await workspace.screenshot();
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, "empty-state.png"), screenshot);
  });

  test("package-form — new package form open", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
    await page.locator(".footer-btn.primary").click();
    await page.waitForSelector(".pkg-form", { timeout: 3000 });
    const screenshot = await page.screenshot();
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, "package-form.png"), screenshot);
  });

  test("tabs-bar — injected tab bar", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
    await page.evaluate(() => {
      const bar = document.createElement("div");
      bar.className = "tab-bar";
      bar.style.cssText = "position:fixed;top:0;left:256px;right:0;z-index:999;";
      bar.innerHTML = `
        <div class="tab active"><span class="tab-title">PRD inicial</span></div>
        <div class="tab"><span class="tab-title">API Spec</span></div>
        <div class="tab"><span class="tab-title">Runbook</span></div>
      `;
      document.body.prepend(bar);
    });
    const bar = page.locator(".tab-bar");
    const screenshot = await bar.screenshot();
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, "tabs.png"), screenshot);
  });

  test("ai-chat — injected chat panel", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
    await page.evaluate(() => {
      const chat = document.createElement("div");
      chat.className = "ai-chat";
      chat.style.cssText = "position:fixed;right:0;top:0;bottom:0;width:360px;z-index:999;";
      chat.innerHTML = `
        <div class="ai-chat-header" style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #3a3a3c;font-size:14px;font-weight:600;color:#f2f2f7;">
          Kuilo AI
        </div>
        <div style="flex:1;padding:16px;display:flex;flex-direction:column;gap:10px;">
          <div class="ai-chat-msg ai-chat-msg-user" style="display:flex;gap:8px;">
            <div style="width:24px;height:24px;border-radius:50%;background:#0071e3;flex-shrink:0;"></div>
            <div style="font-size:13px;color:#f2f2f7;">¿Qué me falta documentar?</div>
          </div>
          <div class="ai-chat-msg ai-chat-msg-assistant" style="display:flex;gap:8px;">
            <div style="width:24px;height:24px;border-radius:50%;background:#2c2c2e;flex-shrink:0;"></div>
            <div style="font-size:13px;color:#aeaeb2;">Te faltan 3 docs en el área técnica: RFC, Sprint Plan, y Runbook.</div>
          </div>
        </div>
        <div style="padding:12px 16px;border-top:1px solid #3a3a3c;display:flex;gap:6px;">
          <input style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid #3a3a3c;background:#2c2c2e;color:#f2f2f7;font-size:13px;" placeholder="Pregunta algo..." />
          <button style="width:36px;height:36px;border-radius:8px;background:#0071e3;color:white;display:grid;place-items:center;">→</button>
        </div>
      `;
      document.body.appendChild(chat);
    });
    const chat = page.locator(".ai-chat");
    const screenshot = await chat.screenshot();
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, "ai-chat.png"), screenshot);
  });

  test("terminal — injected terminal panel", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
    await page.evaluate(() => {
      const term = document.createElement("div");
      term.className = "terminal-panel";
      term.style.cssText = "position:fixed;bottom:0;left:256px;right:0;height:200px;z-index:999;";
      term.innerHTML = `
        <div class="terminal-header" style="display:flex;align-items:center;gap:8px;padding:6px 12px;background:#2c2c2e;border-bottom:1px solid #3a3a3c;color:#f2f2f7;font-size:12px;">
          <span>Terminal</span>
          <span style="color:#34c759;font-size:10px;">●</span>
        </div>
        <div style="flex:1;padding:12px;background:#1c1c1e;font-family:monospace;font-size:13px;color:#f2f2f7;">
          <div style="color:#34c759;">$ gemini</div>
          <div style="color:#64d2ff;">✦ Gemini CLI v1.0 — Connected to kuilo-vault (19 tools)</div>
          <div style="margin-top:8px;">
            <span style="color:#8e8e93;">> </span>
            <span>¿Qué me falta documentar en técnico?</span>
          </div>
        </div>
      `;
      document.body.appendChild(term);
    });
    const term = page.locator(".terminal-panel");
    const screenshot = await term.screenshot();
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, "terminal.png"), screenshot);
  });

  test("workflow — injected workflow board", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
    await page.evaluate(() => {
      const board = document.createElement("div");
      board.style.cssText = "position:fixed;top:0;left:256px;right:0;bottom:0;z-index:999;background:#1c1c1e;display:flex;flex-direction:column;";
      board.innerHTML = `
        <div style="padding:14px 20px;border-bottom:1px solid #3a3a3c;background:#2c2c2e;display:flex;align-items:center;gap:12px;">
          <span style="color:#0071e3;font-size:13px;">← Volver</span>
          <div><div style="font-size:16px;font-weight:700;color:#f2f2f7;">arc42 + Shape Up</div><div style="font-size:11px;color:#8e8e93;">Starke/Hruschka + Basecamp</div></div>
          <span style="margin-left:auto;font-size:12px;color:#8e8e93;">2/7 completados · 28%</span>
        </div>
        <div style="height:4px;background:#3a3a3c;"><div style="height:100%;width:28%;background:#34c759;"></div></div>
        <div style="flex:1;display:flex;gap:8px;padding:12px;overflow-x:auto;">
          ${["Pitch|#ff9500|PRD ✅|Problem Statement", "Bet|#0071e3|RFC 🔵|ADR|API Spec", "Build|#af52de|Sprint Plan ⬜|Test Plan ⬜", "Cool-down|#34c759|Runbook ⬜|Retrospectiva ⬜"].map(col => {
            const [title, color, ...docs] = col.split("|");
            return `<div style="flex:1;min-width:200px;background:#2c2c2e;border-radius:10px;overflow:hidden;">
              <div style="padding:10px 12px;border-top:3px solid ${color};display:flex;justify-content:space-between;">
                <span style="font-size:11px;font-weight:700;color:#f2f2f7;text-transform:uppercase;">${title}</span>
                <span style="font-size:11px;color:#8e8e93;">${docs.length}</span>
              </div>
              <div style="padding:8px;display:flex;flex-direction:column;gap:4px;">
                ${docs.map(d => `<div style="padding:8px;border-radius:6px;border:1px solid #48484a;background:#3a3a3c;font-size:12px;color:#f2f2f7;">${d}</div>`).join("")}
              </div>
            </div>`;
          }).join("")}
        </div>
      `;
      document.body.appendChild(board);
    });
    const screenshot = await page.screenshot();
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, "workflow-board.png"), screenshot);
  });

  test("kanban — injected kanban board", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".sidebar", { timeout: 10000 });
    await page.evaluate(() => {
      const kanban = document.createElement("div");
      kanban.id = "kanban-preview";
      kanban.style.cssText = "width:700px;margin:40px auto;background:#1c1c1e;border-radius:12px;padding:16px;display:flex;gap:12px;font-family:-apple-system,system-ui,sans-serif;";
      const cols = [
        { title: "Por hacer", color: "#ff9500", cards: ["Diseñar landing page", "Configurar analytics", "Escribir copy de onboarding"] },
        { title: "En progreso", color: "#0071e3", cards: ["Implementar auth OAuth", "Setup CI/CD pipeline"] },
        { title: "Hecho", color: "#34c759", cards: ["Definir stack técnico", "Crear repositorio", "Diseñar esquema de DB", "Configurar Vite + React"] },
      ];
      kanban.innerHTML = cols.map(col => `
        <div style="flex:1;background:#2c2c2e;border-radius:10px;overflow:hidden;">
          <div style="padding:10px 12px;border-top:3px solid ${col.color};display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:12px;font-weight:700;color:#f2f2f7;text-transform:uppercase;">${col.title}</span>
            <span style="font-size:11px;color:#8e8e93;background:rgba(255,255,255,0.06);padding:1px 7px;border-radius:10px;">${col.cards.length}</span>
          </div>
          <div style="padding:8px;display:flex;flex-direction:column;gap:4px;">
            ${col.cards.map(c => '<div style="padding:8px 10px;border-radius:6px;border:1px solid #48484a;background:#3a3a3c;font-size:12px;color:#f2f2f7;cursor:grab;">' + c + '</div>').join("")}
          </div>
        </div>
      `).join("");
      document.body.appendChild(kanban);
    });
    const screenshot = await page.locator("#kanban-preview").screenshot();
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, "kanban.png"), screenshot);
  });
});
