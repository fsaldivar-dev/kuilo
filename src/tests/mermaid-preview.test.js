/**
 * Tests — Mermaid Preview (Sprint 3 extra)
 * Verifica la lógica de detección y utilidad del preview
 */

import { describe, it, expect } from "vitest";
import { isMermaidCode, sanitizeMermaidCode } from "@/lib/mermaid-utils";

// ─── isMermaidCode ────────────────────────────────────────────────────────────

describe("isMermaidCode", () => {
  it("detecta graph TD", () => {
    expect(isMermaidCode("graph TD\nA --> B")).toBe(true);
  });

  it("detecta flowchart", () => {
    expect(isMermaidCode("flowchart LR\nA --> B")).toBe(true);
  });

  it("detecta sequenceDiagram", () => {
    expect(isMermaidCode("sequenceDiagram\nAlice->>Bob: Hola")).toBe(true);
  });

  it("detecta classDiagram", () => {
    expect(isMermaidCode("classDiagram\nAnimal <|-- Duck")).toBe(true);
  });

  it("detecta erDiagram", () => {
    expect(isMermaidCode("erDiagram\nCUSTOMER ||--o{ ORDER : places")).toBe(true);
  });

  it("detecta gantt", () => {
    expect(isMermaidCode("gantt\ntitle Mi Gantt")).toBe(true);
  });

  it("detecta pie chart", () => {
    expect(isMermaidCode("pie title Mascotas\n\"Perros\" : 386")).toBe(true);
  });

  it("detecta stateDiagram", () => {
    expect(isMermaidCode("stateDiagram-v2\n[*] --> Still")).toBe(true);
  });

  it("detecta gitGraph", () => {
    expect(isMermaidCode("gitGraph\ncommit")).toBe(true);
  });

  it("no detecta código JS", () => {
    expect(isMermaidCode("const x = 1;")).toBe(false);
  });

  it("no detecta string vacío", () => {
    expect(isMermaidCode("")).toBe(false);
  });

  it("no detecta texto plano", () => {
    expect(isMermaidCode("Esto es un párrafo normal")).toBe(false);
  });
});

// ─── sanitizeMermaidCode ──────────────────────────────────────────────────────

describe("sanitizeMermaidCode", () => {
  it("elimina tags HTML maliciosos", () => {
    const result = sanitizeMermaidCode('graph TD\nA["<script>alert(1)</script>"] --> B');
    expect(result).not.toContain("<script>");
  });

  it("conserva el código mermaid válido", () => {
    const code = "graph TD\nA --> B --> C";
    expect(sanitizeMermaidCode(code)).toBe(code);
  });

  it("maneja string vacío", () => {
    expect(sanitizeMermaidCode("")).toBe("");
  });

  it("conserva acentos y caracteres unicode", () => {
    const code = 'graph TD\nA["Autenticación"] --> B["Éxito"]';
    expect(sanitizeMermaidCode(code)).toContain("Autenticación");
  });
});
