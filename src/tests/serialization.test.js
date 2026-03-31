/**
 * TDD — Serialización page.json ↔ HTML
 * Importa directamente desde src/lib/page-document.js
 */

import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  blockToHtml,
  pageDocumentToHtml,
  htmlToPageDocument,
} from "@/lib/page-document";

// ─── escapeHtml ───────────────────────────────────────────────────────────────

describe("escapeHtml", () => {
  it("escapa < > & \"", () => {
    expect(escapeHtml('<script>alert("xss")&</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&amp;&lt;/script&gt;"
    );
  });
  it("cadena vacía retorna vacío", () => {
    expect(escapeHtml("")).toBe("");
    expect(escapeHtml()).toBe("");
  });
});

// ─── blockToHtml — tipos básicos ──────────────────────────────────────────────

describe("blockToHtml — básicos", () => {
  it("heading h1", () =>
    expect(blockToHtml({ type: "heading", props: { level: 1 }, content: "Título" })).toBe("<h1>Título</h1>"));

  it("heading h2", () =>
    expect(blockToHtml({ type: "heading", props: { level: 2 }, content: "Sub" })).toBe("<h2>Sub</h2>"));

  it("heading clamp a [1,3]", () => {
    expect(blockToHtml({ type: "heading", props: { level: 5 }, content: "x" })).toBe("<h3>x</h3>");
    expect(blockToHtml({ type: "heading", props: { level: 0 }, content: "x" })).toBe("<h1>x</h1>");
  });

  it("paragraph simple", () =>
    expect(blockToHtml({ type: "paragraph", content: "Hola" })).toBe("<p>Hola</p>"));

  it("paragraph vacío", () =>
    expect(blockToHtml({ type: "paragraph", content: "" })).toBe("<p></p>"));

  it("divider", () =>
    expect(blockToHtml({ type: "divider" })).toBe("<hr>"));

  it("code_block escapa HTML", () => {
    const html = blockToHtml({ type: "code_block", content: "<div>test</div>" });
    expect(html).toContain("&lt;div&gt;");
    expect(html).not.toContain("<div>");
  });

  it("quote", () =>
    expect(blockToHtml({ type: "quote", content: "Una cita" })).toBe(
      "<blockquote><p>Una cita</p></blockquote>"
    ));

  it("bullet_list string[]", () => {
    const html = blockToHtml({ type: "bullet_list", content: ["A", "B"] });
    expect(html).toContain("<ul>");
    expect(html).toContain("<li><p>A</p></li>");
    expect(html).toContain("<li><p>B</p></li>");
  });

  it("ordered_list string[]", () => {
    const html = blockToHtml({ type: "ordered_list", content: ["Uno", "Dos"] });
    expect(html).toContain("<ol>");
    expect(html).toContain("<li><p>Uno</p></li>");
  });

  it("task_list con checked", () => {
    const html = blockToHtml({
      type: "task_list",
      content: [
        { label: "Hecho", checked: true },
        { label: "Pendiente", checked: false },
      ],
    });
    expect(html).toContain('data-type="taskList"');
    expect(html).toContain('data-checked="true"');
    expect(html).toContain('data-checked="false"');
  });

  it("tabla con header y rows", () => {
    const html = blockToHtml({
      type: "table",
      props: { columns: ["Nombre", "Rol"], rows: [["Alice", "Dev"]] },
    });
    expect(html).toContain("<th>Nombre</th>");
    expect(html).toContain("<td>Alice</td>");
  });

  it("tipo desconocido → párrafo", () =>
    expect(blockToHtml({ type: "xyz_custom", content: "texto" })).toBe("<p>texto</p>"));
});

// ─── blockToHtml — rich text (campo html) ────────────────────────────────────

describe("blockToHtml — rich text con campo html", () => {
  it("paragraph con html usa campo html", () => {
    const block = {
      type: "paragraph",
      content: "texto bold",
      html: "<strong>texto</strong> bold",
    };
    expect(blockToHtml(block)).toBe("<p><strong>texto</strong> bold</p>");
  });

  it("heading con html preserva marks", () => {
    const block = {
      type: "heading",
      props: { level: 1 },
      content: "Mi título",
      html: "<strong>Mi</strong> título",
    };
    expect(blockToHtml(block)).toBe("<h1><strong>Mi</strong> título</h1>");
  });

  it("paragraph sin campo html escapa el content", () => {
    const block = { type: "paragraph", content: "<b>no escapes</b>" };
    const result = blockToHtml(block);
    expect(result).toContain("&lt;b&gt;");
  });

  it("quote con html preserva formato", () => {
    const block = {
      type: "quote",
      content: "cita importante",
      html: "<em>cita</em> importante",
    };
    expect(blockToHtml(block)).toBe(
      "<blockquote><p><em>cita</em> importante</p></blockquote>"
    );
  });

  it("bullet_list con items ricos", () => {
    const html = blockToHtml({
      type: "bullet_list",
      content: [
        { text: "bold item", html: "<strong>bold item</strong>" },
        { text: "plain item" },
      ],
    });
    expect(html).toContain("<strong>bold item</strong>");
    expect(html).toContain("<p>plain item</p>");
  });
});

// ─── pageDocumentToHtml ───────────────────────────────────────────────────────

describe("pageDocumentToHtml", () => {
  it("documento vacío → cadena vacía", () =>
    expect(pageDocumentToHtml({ blocks: [] })).toBe(""));

  it("null/undefined → cadena vacía", () => {
    expect(pageDocumentToHtml(null)).toBe("");
    expect(pageDocumentToHtml(undefined)).toBe("");
  });

  it("serializa bloques en orden", () => {
    const doc = {
      blocks: [
        { id: "1", type: "heading", props: { level: 1 }, content: "Doc" },
        { id: "2", type: "paragraph", content: "Intro" },
      ],
    };
    expect(pageDocumentToHtml(doc)).toBe("<h1>Doc</h1><p>Intro</p>");
  });
});

// ─── htmlToPageDocument ───────────────────────────────────────────────────────

describe("htmlToPageDocument — básicos", () => {
  it("parsea h1", () => {
    const doc = htmlToPageDocument("<h1>Título</h1>", {});
    expect(doc.blocks[0].type).toBe("heading");
    expect(doc.blocks[0].props.level).toBe(1);
    expect(doc.blocks[0].content).toBe("Título");
  });

  it("extrae título del primer heading", () => {
    const doc = htmlToPageDocument("<h2>Mi página</h2><p>texto</p>", {});
    expect(doc.meta.title).toBe("Mi página");
  });

  it("el título es texto plano aunque el heading tenga marks", () => {
    const doc = htmlToPageDocument("<h1><strong>Negrita</strong> título</h1>", {});
    expect(doc.meta.title).toBe("Negrita título");
  });

  it("mantiene título previo si no hay heading", () => {
    const doc = htmlToPageDocument("<p>solo párrafo</p>", { meta: { title: "Previo" } });
    expect(doc.meta.title).toBe("Previo");
  });

  it("parsea párrafo vacío — se omite", () => {
    const doc = htmlToPageDocument("<p></p><p>Contenido</p>", {});
    expect(doc.blocks.length).toBe(1);
  });

  it("parsea bullet list", () => {
    const doc = htmlToPageDocument("<ul><li><p>A</p></li><li><p>B</p></li></ul>", {});
    expect(doc.blocks[0].type).toBe("bullet_list");
  });

  it("parsea ordered list", () => {
    const doc = htmlToPageDocument("<ol><li><p>Uno</p></li><li><p>Dos</p></li></ol>", {});
    expect(doc.blocks[0].type).toBe("ordered_list");
  });

  it("parsea task list con checked", () => {
    const html = `<ul data-type="taskList">
      <li data-type="taskItem" data-checked="true"><label></label><div><p>Hecho</p></div></li>
      <li data-type="taskItem" data-checked="false"><label></label><div><p>Pendiente</p></div></li>
    </ul>`;
    const doc = htmlToPageDocument(html, {});
    expect(doc.blocks[0].type).toBe("task_list");
    expect(doc.blocks[0].content[0].checked).toBe(true);
    expect(doc.blocks[0].content[1].checked).toBe(false);
  });

  it("parsea blockquote", () => {
    const doc = htmlToPageDocument("<blockquote><p>Cita</p></blockquote>", {});
    expect(doc.blocks[0].type).toBe("quote");
  });

  it("parsea hr como divider", () => {
    const doc = htmlToPageDocument("<hr>", {});
    expect(doc.blocks[0].type).toBe("divider");
  });

  it("parsea tabla — formato TipTap (all rows in tbody, th en primera fila)", () => {
    const html = `<table><tbody>
      <tr><th>Col A</th><th>Col B</th></tr>
      <tr><td>1</td><td>2</td></tr>
    </tbody></table>`;
    const doc = htmlToPageDocument(html, {});
    expect(doc.blocks[0].type).toBe("table");
    expect(doc.blocks[0].props.columns).toEqual(["Col A", "Col B"]);
    expect(doc.blocks[0].props.rows[0]).toEqual(["1", "2"]);
  });

  it("preserva document_version del doc previo", () => {
    const doc = htmlToPageDocument("<p>x</p>", { document_version: 5 });
    expect(doc.document_version).toBe(5);
  });

  it("retorna un bloque vacío si html es vacío", () => {
    const doc = htmlToPageDocument("", {});
    expect(doc.blocks.length).toBeGreaterThan(0);
  });
});

// ─── htmlToPageDocument — rich text preservation (bug crítico corregido) ─────

describe("htmlToPageDocument — preservación de rich text", () => {
  it("párrafo con <strong> guarda campo html", () => {
    const doc = htmlToPageDocument("<p><strong>Negrita</strong> normal</p>", {});
    expect(doc.blocks[0].html).toBe("<strong>Negrita</strong> normal");
  });

  it("párrafo con <em> guarda campo html", () => {
    const doc = htmlToPageDocument("<p>texto <em>cursiva</em></p>", {});
    expect(doc.blocks[0].html).toBe("texto <em>cursiva</em>");
  });

  it("párrafo con link guarda campo html", () => {
    const doc = htmlToPageDocument('<p><a href="https://example.com">link</a></p>', {});
    expect(doc.blocks[0].html).toContain("<a");
    expect(doc.blocks[0].html).toContain("link");
  });

  it("párrafo plain text NO guarda campo html innecesario", () => {
    const doc = htmlToPageDocument("<p>solo texto</p>", {});
    expect(doc.blocks[0].html).toBeUndefined();
  });

  it("content es siempre texto plano aunque html tenga marks", () => {
    const doc = htmlToPageDocument("<p><strong>bold</strong> texto</p>", {});
    expect(doc.blocks[0].content).toBe("bold texto");
    expect(doc.blocks[0].html).toBe("<strong>bold</strong> texto");
  });

  it("heading con marks — content plano, html con marks", () => {
    const doc = htmlToPageDocument("<h1><em>Título</em> Doc</h1>", {});
    expect(doc.blocks[0].content).toBe("Título Doc");
    expect(doc.blocks[0].html).toBe("<em>Título</em> Doc");
    expect(doc.meta.title).toBe("Título Doc"); // título limpio
  });
});

// ─── Roundtrip — blockToHtml → htmlToPageDocument ────────────────────────────

describe("roundtrip — preserva rich text end-to-end", () => {
  it("bold en párrafo sobrevive el roundtrip", () => {
    const original = {
      blocks: [
        {
          id: "1",
          type: "paragraph",
          content: "texto bold",
          html: "<strong>texto</strong> bold",
        },
      ],
    };
    const html = pageDocumentToHtml(original);
    const restored = htmlToPageDocument(html, original);
    expect(restored.blocks[0].html).toBe("<strong>texto</strong> bold");
    expect(restored.blocks[0].content).toBe("texto bold");
  });

  it("texto plano sin marks sobrevive el roundtrip", () => {
    const original = {
      blocks: [
        { id: "1", type: "heading", props: { level: 1 }, content: "Título" },
        { id: "2", type: "paragraph", content: "Texto plano" },
        { id: "3", type: "bullet_list", content: ["Alpha", "Beta"] },
        { id: "4", type: "ordered_list", content: ["Uno", "Dos"] },
      ],
    };
    const restored = htmlToPageDocument(pageDocumentToHtml(original), original);
    expect(restored.blocks[0].content).toBe("Título");
    expect(restored.blocks[1].content).toBe("Texto plano");
    expect(restored.blocks[2].type).toBe("bullet_list");
    expect(restored.blocks[3].type).toBe("ordered_list");
  });

  it("múltiples formatos en el mismo párrafo", () => {
    const original = {
      blocks: [{
        id: "1",
        type: "paragraph",
        content: "bold italic link",
        html: '<strong>bold</strong> <em>italic</em> <a href="http://x.com">link</a>',
      }],
    };
    const restored = htmlToPageDocument(pageDocumentToHtml(original), {});
    expect(restored.blocks[0].html).toContain("<strong>bold</strong>");
    expect(restored.blocks[0].html).toContain("<em>italic</em>");
    expect(restored.blocks[0].html).toContain("<a");
  });
});
