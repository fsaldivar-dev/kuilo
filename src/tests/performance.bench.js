/**
 * Performance benchmarks — serialización page.json ↔ HTML
 * Corre con: npm run test:run (vitest detecta .bench.js automáticamente)
 *
 * Umbrales de aceptación (SLA):
 *   - Documento pequeño  (<10 bloques):   < 1ms
 *   - Documento mediano  (50 bloques):    < 5ms
 *   - Documento grande   (200 bloques):   < 20ms
 *   - Documento extremo  (1000 bloques):  < 100ms
 */

import { bench, describe, expect, it } from "vitest";
import { pageDocumentToHtml, htmlToPageDocument } from "@/lib/page-document";

// ─── Generadores de documentos de prueba ─────────────────────────────────────

const makeParagraph = (i) => ({
  id: `blk-${i}`,
  type: "paragraph",
  content: `Párrafo de prueba número ${i} con contenido representativo`,
});

const makeParagraphRich = (i) => ({
  id: `blk-${i}`,
  type: "paragraph",
  content: `Párrafo ${i} con formato`,
  html: `Párrafo <strong>${i}</strong> con <em>formato</em> y <a href="https://example.com">link</a>`,
});

const makeHeading = (i) => ({
  id: `blk-h${i}`,
  type: "heading",
  props: { level: (i % 3) + 1 },
  content: `Sección ${i}`,
});

const makeList = (i) => ({
  id: `blk-l${i}`,
  type: "bullet_list",
  content: [`Item A-${i}`, `Item B-${i}`, `Item C-${i}`],
});

const makeDoc = (size, richText = false) => ({
  meta: { title: "Benchmark doc" },
  blocks: Array.from({ length: size }, (_, i) => {
    if (i % 10 === 0) return makeHeading(i);
    if (i % 5 === 0) return makeList(i);
    return richText ? makeParagraphRich(i) : makeParagraph(i);
  }),
  document_version: 1,
});

// ─── SLA tests — correctness + timing ────────────────────────────────────────

describe("SLA — tiempo máximo de serialización", () => {
  it("documento pequeño (10 bloques) serializa en < 1ms", () => {
    const doc = makeDoc(10);
    const start = performance.now();
    pageDocumentToHtml(doc);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1);
  });

  it("documento mediano (50 bloques) serializa en < 5ms", () => {
    const doc = makeDoc(50);
    const start = performance.now();
    pageDocumentToHtml(doc);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
  });

  it("documento grande (200 bloques) serializa en < 20ms", () => {
    const doc = makeDoc(200);
    const start = performance.now();
    pageDocumentToHtml(doc);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(20);
  });

  it("documento extremo (1000 bloques) serializa en < 100ms", () => {
    const doc = makeDoc(1000);
    const start = performance.now();
    pageDocumentToHtml(doc);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});

describe("SLA — tiempo máximo de parseo HTML → page.json", () => {
  it("html pequeño (10 bloques) parsea en < 5ms", () => {
    const html = pageDocumentToHtml(makeDoc(10));
    const start = performance.now();
    htmlToPageDocument(html, {});
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
  });

  it("html mediano (50 bloques) parsea en < 20ms", () => {
    const html = pageDocumentToHtml(makeDoc(50));
    const start = performance.now();
    htmlToPageDocument(html, {});
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(20);
  });

  it("html grande (200 bloques) parsea en < 50ms", () => {
    const html = pageDocumentToHtml(makeDoc(200));
    const start = performance.now();
    htmlToPageDocument(html, {});
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});

describe("SLA — roundtrip completo (serializar + parsear)", () => {
  it("roundtrip de 100 bloques en < 30ms", () => {
    const doc = makeDoc(100);
    const start = performance.now();
    const html = pageDocumentToHtml(doc);
    htmlToPageDocument(html, doc);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(30);
  });

  it("roundtrip con rich text (100 bloques) en < 30ms", () => {
    const doc = makeDoc(100, true);
    const start = performance.now();
    const html = pageDocumentToHtml(doc);
    htmlToPageDocument(html, doc);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(30);
  });
});

// ─── Benchmarks detallados (vitest bench) ────────────────────────────────────

describe("Benchmarks — operaciones/segundo", () => {
  const docSmall  = makeDoc(10);
  const docMedium = makeDoc(50);
  const docLarge  = makeDoc(200);
  const docRich   = makeDoc(50, true);

  const htmlSmall  = pageDocumentToHtml(docSmall);
  const htmlMedium = pageDocumentToHtml(docMedium);
  const htmlLarge  = pageDocumentToHtml(docLarge);

  bench("pageDocumentToHtml — 10 bloques", () => {
    pageDocumentToHtml(docSmall);
  });

  bench("pageDocumentToHtml — 50 bloques", () => {
    pageDocumentToHtml(docMedium);
  });

  bench("pageDocumentToHtml — 200 bloques", () => {
    pageDocumentToHtml(docLarge);
  });

  bench("pageDocumentToHtml — 50 bloques rich text", () => {
    pageDocumentToHtml(docRich);
  });

  bench("htmlToPageDocument — 10 bloques", () => {
    htmlToPageDocument(htmlSmall, {});
  });

  bench("htmlToPageDocument — 50 bloques", () => {
    htmlToPageDocument(htmlMedium, {});
  });

  bench("htmlToPageDocument — 200 bloques", () => {
    htmlToPageDocument(htmlLarge, {});
  });

  bench("roundtrip completo — 50 bloques", () => {
    htmlToPageDocument(pageDocumentToHtml(docMedium), docMedium);
  });
});
