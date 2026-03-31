/**
 * Tests — Mermaid controls + modo lectura
 */
import { describe, it, expect } from "vitest";
import { clampScale, computePanBounds } from "@/lib/mermaid-controls";

// ─── clampScale ───────────────────────────────────────────────────────────────

describe("clampScale", () => {
  it("no baja del mínimo (0.25)", () => {
    expect(clampScale(0.1)).toBe(0.25);
  });

  it("no sube del máximo (4)", () => {
    expect(clampScale(10)).toBe(4);
  });

  it("devuelve el valor exacto si está dentro del rango", () => {
    expect(clampScale(1)).toBe(1);
    expect(clampScale(2)).toBe(2);
    expect(clampScale(0.5)).toBe(0.5);
  });

  it("redondea a 2 decimales", () => {
    expect(clampScale(1.333333)).toBe(1.33);
  });
});

// ─── computePanBounds ─────────────────────────────────────────────────────────

describe("computePanBounds", () => {
  it("sin zoom (scale=1) → pan limitado a 0", () => {
    const bounds = computePanBounds({ containerW: 600, containerH: 400, contentW: 600, contentH: 400, scale: 1 });
    expect(bounds.maxX).toBe(0);
    expect(bounds.maxY).toBe(0);
  });

  it("con zoom (scale=2) → pan positivo disponible", () => {
    const bounds = computePanBounds({ containerW: 600, containerH: 400, contentW: 600, contentH: 400, scale: 2 });
    expect(bounds.maxX).toBeGreaterThan(0);
    expect(bounds.maxY).toBeGreaterThan(0);
  });

  it("devuelve bounds simétricos (maxX = -minX)", () => {
    const bounds = computePanBounds({ containerW: 600, containerH: 400, contentW: 600, contentH: 400, scale: 2 });
    expect(bounds.minX).toBe(-bounds.maxX);
    expect(bounds.minY).toBe(-bounds.maxY);
  });

  it("sin scroll cuando el contenido cabe en el contenedor", () => {
    const bounds = computePanBounds({ containerW: 800, containerH: 600, contentW: 400, contentH: 300, scale: 1 });
    expect(bounds.maxX).toBe(0);
    expect(bounds.maxY).toBe(0);
  });
});
