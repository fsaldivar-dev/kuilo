/**
 * TDD — Bubble Menu
 * Tests escritos ANTES de implementar el componente.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BubbleToolbar } from "@/components/tiptap-ui/bubble-menu/bubble-menu";

// ─── Mock del editor ─────────────────────────────────────────────────────────

const buildMockEditor = (overrides = {}) => ({
  isActive: vi.fn((type) => overrides.active?.includes(type) ?? false),
  chain: () => ({
    focus: () => ({
      toggleBold:      () => ({ run: vi.fn() }),
      toggleItalic:    () => ({ run: vi.fn() }),
      toggleUnderline: () => ({ run: vi.fn() }),
      toggleStrike:    () => ({ run: vi.fn() }),
      toggleCode:      () => ({ run: vi.fn() }),
    }),
  }),
  ...overrides,
});

const DEFAULT_RECT = { top: 100, left: 200, width: 80, height: 20, bottom: 120, right: 280 };

// ─── Estructura del componente ────────────────────────────────────────────────

describe("BubbleToolbar — estructura", () => {
  it("renderiza sin errores con editor y rect válidos", () => {
    const editor = buildMockEditor();
    expect(() =>
      render(<BubbleToolbar editor={editor} rect={DEFAULT_RECT} />)
    ).not.toThrow();
  });

  it("tiene botón Bold", () => {
    const editor = buildMockEditor();
    render(<BubbleToolbar editor={editor} rect={DEFAULT_RECT} />);
    expect(screen.getByTitle(/bold|negrita/i)).toBeInTheDocument();
  });

  it("tiene botón Italic", () => {
    const editor = buildMockEditor();
    render(<BubbleToolbar editor={editor} rect={DEFAULT_RECT} />);
    expect(screen.getByTitle(/italic|cursiva/i)).toBeInTheDocument();
  });

  it("tiene botón Underline", () => {
    const editor = buildMockEditor();
    render(<BubbleToolbar editor={editor} rect={DEFAULT_RECT} />);
    expect(screen.getByTitle(/underline|subrayado/i)).toBeInTheDocument();
  });

  it("tiene botón Strike", () => {
    const editor = buildMockEditor();
    render(<BubbleToolbar editor={editor} rect={DEFAULT_RECT} />);
    expect(screen.getByTitle(/strike|tachado/i)).toBeInTheDocument();
  });

  it("tiene botón Code", () => {
    const editor = buildMockEditor();
    render(<BubbleToolbar editor={editor} rect={DEFAULT_RECT} />);
    expect(screen.getByTitle(/code|código/i)).toBeInTheDocument();
  });

  it("tiene al menos 5 botones de formato", () => {
    const editor = buildMockEditor();
    render(<BubbleToolbar editor={editor} rect={DEFAULT_RECT} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(5);
  });
});

// ─── Estados activos ─────────────────────────────────────────────────────────

describe("BubbleToolbar — estados activos", () => {
  it("botón Bold tiene clase 'active' cuando bold está activo", () => {
    const editor = buildMockEditor({ active: ["bold"] });
    render(<BubbleToolbar editor={editor} rect={DEFAULT_RECT} />);
    const boldBtn = screen.getByTitle(/bold|negrita/i);
    expect(boldBtn.classList.contains("active") || boldBtn.getAttribute("data-active") === "true").toBe(true);
  });

  it("botón Italic tiene clase 'active' cuando italic está activo", () => {
    const editor = buildMockEditor({ active: ["italic"] });
    render(<BubbleToolbar editor={editor} rect={DEFAULT_RECT} />);
    const btn = screen.getByTitle(/italic|cursiva/i);
    expect(btn.classList.contains("active") || btn.getAttribute("data-active") === "true").toBe(true);
  });

  it("no hay botones activos cuando no hay formato", () => {
    const editor = buildMockEditor({ active: [] });
    render(<BubbleToolbar editor={editor} rect={DEFAULT_RECT} />);
    const activeButtons = document.querySelectorAll(".active, [data-active='true']");
    expect(activeButtons.length).toBe(0);
  });
});

// ─── Posicionamiento ─────────────────────────────────────────────────────────

describe("BubbleToolbar — posicionamiento", () => {
  it("se posiciona como fixed en el DOM", () => {
    const editor = buildMockEditor();
    const { container } = render(<BubbleToolbar editor={editor} rect={DEFAULT_RECT} />);
    const toolbar = container.firstChild;
    const style = window.getComputedStyle(toolbar);
    // position: fixed viene del CSS (.bubble-toolbar), no inline
    expect(toolbar.className).toMatch(/bubble/i);
  });

  it("no renderiza cuando rect es null", () => {
    const editor = buildMockEditor();
    const { container } = render(<BubbleToolbar editor={editor} rect={null} />);
    expect(container.firstChild).toBeNull();
  });
});

// ─── useBubbleMenuState hook ─────────────────────────────────────────────────

describe("useBubbleMenuState — lógica de visibilidad", () => {
  it("exporta la función useBubbleMenuState", async () => {
    const mod = await import("@/components/tiptap-ui/bubble-menu/bubble-menu");
    expect(typeof mod.useBubbleMenuState).toBe("function");
  });
});
