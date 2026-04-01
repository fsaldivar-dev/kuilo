/**
 * E2E — Publish-to-web output verification
 * Renders a generated site page in the browser to verify it looks correct.
 */

import { test, expect } from "@playwright/test";

const SAMPLE_PAGE = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Getting Started — Mi Proyecto</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1d1d1f; background: #f5f5f7; }
.site-shell { display: flex; min-height: 100vh; }
.site-sidebar { width: 260px; background: #1c1c1e; color: #f2f2f7; padding: 24px 0; flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.site-logo { font-size: 18px; font-weight: 700; padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 12px; }
.nav-package h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.35); padding: 12px 20px 4px; }
.nav-package ul { list-style: none; }
.nav-package li a { display: block; padding: 6px 20px; font-size: 13px; color: rgba(255,255,255,0.7); text-decoration: none; transition: background 0.1s; }
.nav-package li a:hover { background: rgba(255,255,255,0.06); color: #fff; }
.nav-package li a.active { background: rgba(0,113,227,0.2); color: #64d2ff; font-weight: 600; }
.site-content { flex: 1; max-width: 780px; margin: 0 auto; padding: 48px 40px 80px; background: white; min-height: 100vh; }
.site-content h1 { font-size: 32px; font-weight: 800; margin-bottom: 24px; }
.site-content h2 { font-size: 22px; font-weight: 700; margin: 32px 0 12px; }
.site-content p { font-size: 15px; line-height: 1.7; margin-bottom: 12px; }
.site-content ul { padding-left: 24px; margin-bottom: 12px; }
.site-content li { font-size: 15px; line-height: 1.7; }
.site-content code { background: #f2f2f7; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
.site-content pre { background: #1c1c1e; color: #f2f2f7; padding: 16px 20px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; }
.site-content blockquote { border-left: 3px solid #0071e3; padding: 12px 16px; margin: 16px 0; background: rgba(0,113,227,0.04); border-radius: 0 8px 8px 0; }
.site-content table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
.site-content th, .site-content td { border: 1px solid #e5e5ea; padding: 8px 12px; }
.site-content th { background: #f2f2f7; font-weight: 600; }
@media (max-width: 768px) { .site-shell { flex-direction: column; } .site-sidebar { width: 100%; height: auto; position: static; } .site-content { padding: 24px 16px; } }
@media (prefers-color-scheme: dark) { body { background: #000; color: #f2f2f7; } .site-content { background: #1c1c1e; color: #f2f2f7; } .site-content code { background: #2c2c2e; } .site-content th { background: #2c2c2e; } .site-content th, .site-content td { border-color: #3a3a3c; } }
</style>
</head>
<body>
<div class="site-shell">
  <aside class="site-sidebar">
    <div class="site-logo">Mi Proyecto</div>
    <nav class="site-nav">
      <div class="nav-package"><h3>docs</h3><ul>
        <li><a href="getting-started.html" class="active">Getting Started</a></li>
        <li><a href="api-reference.html">API Reference</a></li>
        <li><a href="deployment.html">Deployment Guide</a></li>
      </ul></div>
      <div class="nav-package"><h3>legal</h3><ul>
        <li><a href="privacy.html">Aviso de privacidad</a></li>
        <li><a href="terms.html">Términos y condiciones</a></li>
      </ul></div>
    </nav>
  </aside>
  <main class="site-content">
    <h1>Getting Started</h1>
    <p>Bienvenido a <strong>Mi Proyecto</strong>. Esta guía te ayudará a comenzar rápidamente.</p>
    <h2>Instalación</h2>
    <p>Ejecuta el siguiente comando para instalar:</p>
    <pre><code>npm install mi-proyecto</code></pre>
    <h2>Configuración</h2>
    <p>Crea un archivo <code>config.json</code> en la raíz del proyecto:</p>
    <blockquote><p><strong>Nota:</strong> Asegúrate de tener Node.js 18+ instalado.</p></blockquote>
    <h2>Uso básico</h2>
    <ul>
      <li>Abre el dashboard en <code>http://localhost:3000</code></li>
      <li>Configura tu primer workspace</li>
      <li>Invita a tu equipo</li>
    </ul>
    <h2>Métricas</h2>
    <table>
      <tr><th>Métrica</th><th>Valor</th><th>Estado</th></tr>
      <tr><td>Tiempo de carga</td><td>1.2s</td><td>✅ Óptimo</td></tr>
      <tr><td>Uptime</td><td>99.9%</td><td>✅ Excelente</td></tr>
      <tr><td>Errores/día</td><td>3</td><td>⚠️ Revisar</td></tr>
    </table>
  </main>
</div>
</body>
</html>`;

test.describe("Publish-to-web — output preview", () => {
  test("published page renders with sidebar and content", async ({ page }) => {
    await page.setContent(SAMPLE_PAGE);
    await expect(page.locator(".site-shell")).toBeVisible();
    await expect(page.locator(".site-sidebar")).toBeVisible();
    await expect(page.locator(".site-content")).toBeVisible();
    await expect(page.locator(".site-logo")).toContainText("Mi Proyecto");
    await expect(page.locator(".site-content h1")).toContainText("Getting Started");
  });

  test("navigation has active page highlighted", async ({ page }) => {
    await page.setContent(SAMPLE_PAGE);
    const active = page.locator("a.active");
    await expect(active).toContainText("Getting Started");
  });

  test("content renders all block types", async ({ page }) => {
    await page.setContent(SAMPLE_PAGE);
    await expect(page.locator(".site-content h2")).not.toHaveCount(0);
    await expect(page.locator(".site-content pre")).toBeVisible();
    await expect(page.locator(".site-content blockquote")).toBeVisible();
    await expect(page.locator(".site-content table")).toBeVisible();
    await expect(page.locator(".site-content ul")).toBeVisible();
  });

  test("snapshot — published page full view", async ({ page }) => {
    await page.setContent(SAMPLE_PAGE);
    await expect(page).toHaveScreenshot("022-published-page.png", { fullPage: true });
  });

  test("snapshot — published page mobile view", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.setContent(SAMPLE_PAGE);
    await expect(page).toHaveScreenshot("023-published-page-mobile.png", { fullPage: true });
  });
});
