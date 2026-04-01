import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportMarkdown, exportHtml } from "@/lib/export-utils";

describe("exportMarkdown", () => {
  let originalCreateElement;

  beforeEach(() => {
    originalCreateElement = document.createElement.bind(document);
    const mockAnchor = originalCreateElement("a");
    mockAnchor.click = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "a") return mockAnchor;
      return originalCreateElement(tag);
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it("creates a downloadable .md file", () => {
    exportMarkdown("<p>Hello</p>", "Test Doc");
    const anchor = document.createElement("a");
    expect(anchor.click).toHaveBeenCalled();
    expect(anchor.download).toMatch(/test-doc\.md$/);
  });
});

describe("exportHtml", () => {
  let originalCreateElement;

  beforeEach(() => {
    originalCreateElement = document.createElement.bind(document);
    const mockAnchor = originalCreateElement("a");
    mockAnchor.click = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "a") return mockAnchor;
      return originalCreateElement(tag);
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it("creates a downloadable .html file", () => {
    exportHtml("<p>Hello</p>", "My Page");
    const anchor = document.createElement("a");
    expect(anchor.click).toHaveBeenCalled();
    expect(anchor.download).toMatch(/my-page\.html$/);
  });
});
