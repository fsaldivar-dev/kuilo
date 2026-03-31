import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

afterEach(() => {
  cleanup();
});

// Tiptap / ProseMirror requires Range in JSDOM
global.Range = class Range {
  getBoundingClientRect() {
    return { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, x: 0, y: 0 };
  }
  getClientRects() {
    return { length: 0, item: () => null, [Symbol.iterator]: function* () {} };
  }
};

// Required by Tiptap internals
if (typeof Document !== "undefined") {
  Document.prototype.elementFromPoint = vi.fn(() => null);
}

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
