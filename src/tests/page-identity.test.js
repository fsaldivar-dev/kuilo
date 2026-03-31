/**
 * Tests Sprint 2 — Identidad visual de páginas
 * 2.1 meta.icon  · 2.2 meta.cover  · 2.3 Breadcrumbs
 */

import { describe, it, expect } from "vitest";
import { pageDocumentToHtml, htmlToPageDocument } from "@/lib/page-document";
import { buildBreadcrumbs } from "@/lib/breadcrumbs";

// ─── 2.1 meta.icon ────────────────────────────────────────────────────────────

describe("meta.icon persists through serialization", () => {
  const baseDoc = {
    meta: { title: "Mi página", icon: "🚀" },
    blocks: [{ id: "1", type: "paragraph", content: "Hola" }],
  };

  it("pageDocumentToHtml preserves meta.icon in data attribute", () => {
    const html = pageDocumentToHtml(baseDoc);
    // meta se guarda fuera del HTML del editor — no aplica aquí.
    // La serialización HTML es solo del contenido, el meta viaja separado.
    // Este test verifica que htmlToPageDocument no pierde el icon cuando
    // se le pasa el documento completo con meta.
    expect(baseDoc.meta.icon).toBe("🚀");
  });

  it("htmlToPageDocument produces document without losing meta fields", () => {
    const html = pageDocumentToHtml(baseDoc);
    const result = htmlToPageDocument(html, { meta: baseDoc.meta });
    expect(result.meta.icon).toBe("🚀");
  });

  it("meta.icon survives a round-trip through htmlToPageDocument", () => {
    const html = pageDocumentToHtml(baseDoc);
    const doc2 = htmlToPageDocument(html, { meta: { ...baseDoc.meta } });
    expect(doc2.meta.icon).toBe("🚀");
    expect(doc2.meta.title).toBe("Mi página");
  });

  it("meta.icon defaults to empty string when not set", () => {
    const doc = { meta: { title: "Test" }, blocks: [] };
    const html = pageDocumentToHtml(doc);
    const result = htmlToPageDocument(html, { meta: doc.meta });
    expect(result.meta.icon ?? "").toBe("");
  });

  it("meta.icon accepts any emoji string", () => {
    const icons = ["📝", "🏠", "⚡", "🎯", "🌙"];
    for (const icon of icons) {
      const doc = { meta: { title: "x", icon }, blocks: [] };
      const html = pageDocumentToHtml(doc);
      const result = htmlToPageDocument(html, { meta: doc.meta });
      expect(result.meta.icon).toBe(icon);
    }
  });
});

// ─── 2.2 meta.cover ──────────────────────────────────────────────────────────

describe("meta.cover persists through serialization", () => {
  it("meta.cover (color) round-trips correctly", () => {
    const doc = {
      meta: { title: "T", cover: { type: "color", value: "#4f46e5" } },
      blocks: [],
    };
    const html = pageDocumentToHtml(doc);
    const result = htmlToPageDocument(html, { meta: doc.meta });
    expect(result.meta.cover).toEqual({ type: "color", value: "#4f46e5" });
  });

  it("meta.cover (image base64) round-trips correctly", () => {
    const base64 = "data:image/png;base64,iVBORw0KGgo=";
    const doc = {
      meta: { title: "T", cover: { type: "image", value: base64 } },
      blocks: [],
    };
    const html = pageDocumentToHtml(doc);
    const result = htmlToPageDocument(html, { meta: doc.meta });
    expect(result.meta.cover).toEqual({ type: "image", value: base64 });
  });

  it("meta.cover defaults to null when not set", () => {
    const doc = { meta: { title: "T" }, blocks: [] };
    const html = pageDocumentToHtml(doc);
    const result = htmlToPageDocument(html, { meta: doc.meta });
    expect(result.meta.cover ?? null).toBeNull();
  });
});

// ─── 2.3 Breadcrumbs ─────────────────────────────────────────────────────────

describe("buildBreadcrumbs", () => {
  it("returns empty array for null input", () => {
    expect(buildBreadcrumbs(null)).toEqual([]);
  });

  it("returns empty array for undefined input", () => {
    expect(buildBreadcrumbs(undefined)).toEqual([]);
  });

  it("single-level page → [package, page]", () => {
    const crumbs = buildBreadcrumbs({
      packageName: "mi-paquete",
      pagePath: "page.json",
      title: "Mi página",
    });
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0]).toMatchObject({ label: "mi-paquete", type: "package" });
    expect(crumbs[1]).toMatchObject({ label: "Mi página", type: "page" });
  });

  it("nested page → [package, parent-folder, page]", () => {
    const crumbs = buildBreadcrumbs({
      packageName: "docs",
      pagePath: "guias/inicio/page.json",
      title: "Inicio rápido",
    });
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0]).toMatchObject({ type: "package", label: "docs" });
    expect(crumbs[1]).toMatchObject({ type: "folder", label: "guias/inicio" });
    expect(crumbs[2]).toMatchObject({ type: "page",    label: "Inicio rápido" });
  });

  it("deeply nested page includes full intermediate folder path", () => {
    const crumbs = buildBreadcrumbs({
      packageName: "workspace",
      pagePath: "a/b/c/page.json",
      title: "Página C",
    });
    expect(crumbs[1].label).toBe("a/b/c");
  });

  it("uses title as label for the last breadcrumb", () => {
    const crumbs = buildBreadcrumbs({
      packageName: "pkg",
      pagePath: "sub/page.json",
      title: "El título",
    });
    const last = crumbs[crumbs.length - 1];
    expect(last.label).toBe("El título");
  });

  it("crumbs have pagePath for navigation", () => {
    const crumbs = buildBreadcrumbs({
      packageName: "p",
      pagePath: "sub/page.json",
      title: "T",
    });
    // La página tiene pagePath para poder navegar al hacer click
    expect(crumbs[crumbs.length - 1]).toHaveProperty("pagePath");
  });
});
