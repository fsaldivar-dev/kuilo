import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock window.notesApi before importing
window.notesApi = {
  readDoc: vi.fn().mockResolvedValue({
    sourceType: "page-json",
    document: {
      meta: { title: "Test" },
      blocks: [{ type: "paragraph", content: "Hello" }],
    },
  }),
};

const { generateSite } = await import("@/lib/publish-site");

describe("generateSite", () => {
  beforeEach(() => {
    window.notesApi.readDoc.mockClear();
  });

  const packages = [
    {
      id: "docs", name: "docs",
      pages: [
        { title: "Getting Started", pagePath: "getting-started/page.json", sourceType: "page-json", packageName: "docs", children: [] },
        { title: "API Reference", pagePath: "api-reference/page.json", sourceType: "page-json", packageName: "docs", children: [] },
      ],
    },
  ];

  it("generates one HTML file per page + index", async () => {
    const { files, totalPages } = await generateSite(packages, "Test Vault");
    expect(totalPages).toBe(2);
    expect(files).toHaveLength(3); // 2 pages + index.html
    expect(files.find((f) => f.path === "index.html")).toBeDefined();
    expect(files.find((f) => f.path.includes("getting-started"))).toBeDefined();
    expect(files.find((f) => f.path.includes("api-reference"))).toBeDefined();
  });

  it("index.html redirects to first page", async () => {
    const { files } = await generateSite(packages, "Test");
    const index = files.find((f) => f.path === "index.html");
    expect(index.content).toContain("meta http-equiv");
    expect(index.content).toContain("getting-started.html");
  });

  it("each page has navigation sidebar", async () => {
    const { files } = await generateSite(packages, "Test");
    const page = files.find((f) => f.path.includes("getting-started"));
    expect(page.content).toContain("site-nav");
    expect(page.content).toContain("API Reference");
    expect(page.content).toContain("Getting Started");
  });

  it("includes vault name in title", async () => {
    const { files } = await generateSite(packages, "My Docs");
    const page = files.find((f) => f.path.includes("getting-started"));
    expect(page.content).toContain("<title>Getting Started — My Docs</title>");
  });

  it("calls onProgress for each page", async () => {
    const progress = vi.fn();
    await generateSite(packages, "Test", progress);
    expect(progress).toHaveBeenCalledTimes(2);
    expect(progress).toHaveBeenCalledWith(1, 2, "Getting Started");
    expect(progress).toHaveBeenCalledWith(2, 2, "API Reference");
  });

  it("includes responsive CSS and dark mode", async () => {
    const { files } = await generateSite(packages, "Test");
    const page = files[0];
    expect(page.content).toContain("@media (max-width: 768px)");
    expect(page.content).toContain("prefers-color-scheme: dark");
  });
});
