/**
 * Tests for drag handle feature — Sprint 1.3
 * TDD: written before implementation
 */

import { describe, it, expect, vi } from "vitest";
import { createDragHandleElement } from "@/components/tiptap-ui/drag-handle/drag-handle";

// ─── Unit: createDragHandleElement ───────────────────────────────────────────

describe("createDragHandleElement", () => {
  it("returns an HTMLElement", () => {
    const el = createDragHandleElement();
    expect(el).toBeInstanceOf(HTMLElement);
  });

  it("has class drag-handle", () => {
    const el = createDragHandleElement();
    expect(el.classList.contains("drag-handle")).toBe(true);
  });

  it("has draggable attribute set to true", () => {
    const el = createDragHandleElement();
    expect(el.draggable).toBe(true);
  });

  it("has aria-hidden attribute", () => {
    const el = createDragHandleElement();
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  it("has non-empty innerHTML (icon content)", () => {
    const el = createDragHandleElement();
    expect(el.innerHTML.trim().length).toBeGreaterThan(0);
  });

  it("returns a new element on each call (no shared reference)", () => {
    const a = createDragHandleElement();
    const b = createDragHandleElement();
    expect(a).not.toBe(b);
  });
});

// ─── Unit: buildDragHandleExtension ──────────────────────────────────────────

describe("buildDragHandleExtension", () => {
  it("can be imported without throwing", async () => {
    await expect(
      import("@/components/tiptap-ui/drag-handle/drag-handle")
    ).resolves.toBeDefined();
  });

  it("exports buildDragHandleExtension function", async () => {
    const mod = await import("@/components/tiptap-ui/drag-handle/drag-handle");
    expect(typeof mod.buildDragHandleExtension).toBe("function");
  });

  it("buildDragHandleExtension returns a Tiptap extension object", async () => {
    const { buildDragHandleExtension } = await import(
      "@/components/tiptap-ui/drag-handle/drag-handle"
    );
    const ext = buildDragHandleExtension();
    // Tiptap extensions have a `name` property
    expect(ext).toHaveProperty("name");
    expect(typeof ext.name).toBe("string");
  });

  it("extension name is 'dragHandle'", async () => {
    const { buildDragHandleExtension } = await import(
      "@/components/tiptap-ui/drag-handle/drag-handle"
    );
    const ext = buildDragHandleExtension();
    expect(ext.name).toBe("dragHandle");
  });
});

// ─── Integration: element lifecycle ──────────────────────────────────────────

describe("drag handle element lifecycle", () => {
  it("can be appended to and removed from the DOM", () => {
    const el = createDragHandleElement();
    document.body.appendChild(el);
    expect(document.body.contains(el)).toBe(true);
    el.remove();
    expect(document.body.contains(el)).toBe(false);
  });

  it("has cursor-grab style via class (CSS-driven, not inline)", () => {
    const el = createDragHandleElement();
    // Inline style should NOT set cursor — let CSS class handle it
    expect(el.style.cursor).toBe("");
  });
});
