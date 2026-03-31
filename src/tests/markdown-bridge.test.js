/**
 * Tests — Markdown Bridge (Sprint 3)
 * Verifica la conversión bidireccional markdown ↔ HTML del editor
 */

import { describe, it, expect } from "vitest";
import { markdownToHtml, htmlToMarkdown } from "@/lib/markdown-bridge";

// ─── markdownToHtml ───────────────────────────────────────────────────────────

describe("markdownToHtml", () => {
  it("convierte heading # a <h1>", () => {
    const html = markdownToHtml("# Título principal");
    expect(html).toContain("<h1");
    expect(html).toContain("Título principal");
  });

  it("convierte ## a <h2>", () => {
    expect(markdownToHtml("## Subtítulo")).toContain("<h2");
  });

  it("convierte ### a <h3>", () => {
    expect(markdownToHtml("### H3")).toContain("<h3");
  });

  it("convierte párrafo plano a <p>", () => {
    expect(markdownToHtml("Hola mundo")).toContain("<p");
  });

  it("convierte **bold** a <strong>", () => {
    const html = markdownToHtml("**negrita**");
    expect(html).toMatch(/<strong>negrita<\/strong>/);
  });

  it("convierte _italic_ a <em>", () => {
    const html = markdownToHtml("_cursiva_");
    expect(html).toMatch(/<em>cursiva<\/em>/);
  });

  it("convierte bullet list - a <ul><li>", () => {
    const html = markdownToHtml("- item uno\n- item dos");
    expect(html).toContain("<ul");
    expect(html).toContain("<li");
    expect(html).toContain("item uno");
  });

  it("convierte ordered list 1. a <ol><li>", () => {
    const html = markdownToHtml("1. primero\n2. segundo");
    expect(html).toContain("<ol");
    expect(html).toContain("primero");
  });

  it("convierte - [ ] a task list", () => {
    const html = markdownToHtml("- [ ] pendiente\n- [x] hecho");
    expect(html).toContain("pendiente");
    expect(html).toContain("hecho");
  });

  it("convierte > blockquote", () => {
    const html = markdownToHtml("> esto es una cita");
    expect(html).toContain("<blockquote");
    expect(html).toContain("esto es una cita");
  });

  it("convierte bloque de código con lenguaje", () => {
    const md = "```kotlin\nfun main() { println(\"Hello\") }\n```";
    const html = markdownToHtml(md);
    expect(html).toContain("<pre");
    expect(html).toContain("<code");
    expect(html).toContain("fun main");
  });

  it("convierte tabla markdown a <table>", () => {
    const md = "| Col A | Col B |\n|---|---|\n| 1 | 2 |";
    const html = markdownToHtml(md);
    expect(html).toContain("<table");
    expect(html).toContain("Col A");
    expect(html).toContain("<td");
  });

  it("convierte --- a <hr>", () => {
    expect(markdownToHtml("---")).toContain("<hr");
  });

  it("no rompe con string vacío", () => {
    expect(() => markdownToHtml("")).not.toThrow();
  });
});

// ─── htmlToMarkdown ───────────────────────────────────────────────────────────

describe("htmlToMarkdown", () => {
  it("convierte <h1> a # Título", () => {
    const md = htmlToMarkdown("<h1>Título</h1>");
    expect(md.trim()).toBe("# Título");
  });

  it("convierte <h2> a ## Subtítulo", () => {
    expect(htmlToMarkdown("<h2>Sub</h2>").trim()).toBe("## Sub");
  });

  it("convierte <strong> a **bold**", () => {
    expect(htmlToMarkdown("<p><strong>bold</strong></p>")).toContain("**bold**");
  });

  it("convierte <em> a _italic_", () => {
    expect(htmlToMarkdown("<p><em>cursiva</em></p>")).toMatch(/_cursiva_|\*cursiva\*/);
  });

  it("convierte <ul><li> a - item", () => {
    const md = htmlToMarkdown("<ul><li>alpha</li><li>beta</li></ul>");
    expect(md).toContain("alpha");
    expect(md).toContain("beta");
    expect(md).toMatch(/^-\s+alpha/m);
  });

  it("convierte <blockquote> a >", () => {
    const md = htmlToMarkdown("<blockquote><p>cita</p></blockquote>");
    expect(md).toContain("> cita");
  });

  it("convierte <pre><code> a bloque ```", () => {
    const md = htmlToMarkdown('<pre><code class="language-kotlin">fun main() {}</code></pre>');
    expect(md).toContain("```");
    expect(md).toContain("fun main");
  });

  it("convierte <hr> a ---", () => {
    expect(htmlToMarkdown("<hr>")).toContain("---");
  });

  it("no rompe con string vacío", () => {
    expect(() => htmlToMarkdown("")).not.toThrow();
  });
});

// ─── Round-trip ───────────────────────────────────────────────────────────────

describe("round-trip md → html → md", () => {
  const cases = [
    "# Título",
    "## Subtítulo con **negrita**",
    "Párrafo normal con _cursiva_ y `código`",
    "- item uno\n- item dos\n- item tres",
    "> Esta es una cita importante",
    "---",
  ];

  for (const original of cases) {
    it(`preserva estructura: "${original.slice(0, 40)}"`, () => {
      const html = markdownToHtml(original);
      const back = htmlToMarkdown(html);
      // El contenido textual debe estar presente
      const plainText = original.replace(/[#*_>`-]/g, "").trim();
      if (plainText) {
        expect(back).toContain(plainText.split(" ")[0]);
      }
    });
  }
});
