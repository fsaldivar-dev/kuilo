import { describe, it, expect } from "vitest";
import { resolveWikiLink, extractWikiLinks, findBacklinks, buildLinkIndex } from "@/lib/wiki-links";

const packages = [
  { name: "docs", pages: [
    { title: "Getting Started", pagePath: "getting-started/page.json", children: [
      { title: "Installation", pagePath: "getting-started/installation/page.json", children: [] },
    ]},
    { title: "API Reference", pagePath: "api-reference/page.json", children: [] },
  ]},
  { name: "guides", pages: [
    { title: "Deployment", pagePath: "deployment/page.json", children: [] },
  ]},
];

describe("resolveWikiLink", () => {
  it("resolves exact title match", () => {
    const result = resolveWikiLink(packages, "API Reference");
    expect(result).toEqual({
      packageName: "docs",
      pagePath: "api-reference/page.json",
      title: "API Reference",
    });
  });

  it("resolves case-insensitively", () => {
    const result = resolveWikiLink(packages, "deployment");
    expect(result.title).toBe("Deployment");
    expect(result.packageName).toBe("guides");
  });

  it("resolves nested pages", () => {
    const result = resolveWikiLink(packages, "Installation");
    expect(result.pagePath).toBe("getting-started/installation/page.json");
  });

  it("returns null for non-existent page", () => {
    expect(resolveWikiLink(packages, "Nonexistent")).toBeNull();
  });

  it("trims whitespace", () => {
    const result = resolveWikiLink(packages, "  API Reference  ");
    expect(result).not.toBeNull();
  });
});

describe("extractWikiLinks", () => {
  it("extracts wiki link titles from blocks", () => {
    const blocks = [
      { type: "paragraph", content: [
        { type: "text", text: "See " },
        { type: "text", text: "Installation", marks: [{ type: "wikiLink", attrs: { title: "Installation" } }] },
        { type: "text", text: " for details." },
      ]},
      { type: "paragraph", content: [
        { type: "text", text: "Also check ", marks: [] },
        { type: "text", text: "API Reference", marks: [{ type: "wikiLink", attrs: { title: "API Reference" } }] },
      ]},
    ];
    const links = extractWikiLinks(blocks);
    expect(links).toEqual(["Installation", "API Reference"]);
  });

  it("deduplicates links", () => {
    const blocks = [
      { type: "paragraph", content: [
        { type: "text", text: "A", marks: [{ type: "wikiLink", attrs: { title: "Same" } }] },
        { type: "text", text: "B", marks: [{ type: "wikiLink", attrs: { title: "Same" } }] },
      ]},
    ];
    expect(extractWikiLinks(blocks)).toEqual(["Same"]);
  });

  it("returns empty for no links", () => {
    expect(extractWikiLinks([{ type: "paragraph", content: [{ type: "text", text: "plain" }] }])).toEqual([]);
  });

  it("handles empty blocks", () => {
    expect(extractWikiLinks([])).toEqual([]);
  });
});

describe("findBacklinks + buildLinkIndex", () => {
  it("finds pages that link to a target", () => {
    const docBlocks = {
      "docs/getting-started/page.json": [
        { type: "paragraph", content: [
          { type: "text", text: "API", marks: [{ type: "wikiLink", attrs: { title: "API Reference" } }] },
        ]},
      ],
      "guides/deployment/page.json": [
        { type: "paragraph", content: [
          { type: "text", text: "See ", marks: [] },
          { type: "text", text: "API Reference", marks: [{ type: "wikiLink", attrs: { title: "API Reference" } }] },
        ]},
      ],
      "docs/api-reference/page.json": [
        { type: "paragraph", content: [{ type: "text", text: "no links" }] },
      ],
    };

    const index = buildLinkIndex(packages, docBlocks);
    const backlinks = findBacklinks(index, "API Reference");

    expect(backlinks).toHaveLength(2);
    expect(backlinks.map((b) => b.title)).toContain("Getting Started");
    expect(backlinks.map((b) => b.title)).toContain("Deployment");
  });

  it("returns empty when no backlinks", () => {
    const index = buildLinkIndex(packages, {});
    expect(findBacklinks(index, "Anything")).toEqual([]);
  });
});
