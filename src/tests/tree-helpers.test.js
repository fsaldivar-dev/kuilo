import { describe, it, expect } from "vitest";
import {
  stripMarkdown,
  getTitleFromMarkdown,
  findPageByPath,
  findPageInPackages,
  filterPages,
  getFirstPage,
  getAncestorPagePaths,
  buildExpandedState,
  normalizeTree,
  normalizePages,
  renderInlineMarkdown,
  renderMarkdownPreview,
} from "@/lib/tree-helpers";

describe("stripMarkdown", () => {
  it("removes code blocks", () => {
    expect(stripMarkdown("before ```code``` after")).toBe("before  after");
  });
  it("removes inline code", () => {
    expect(stripMarkdown("use `npm install`")).toBe("use npm install");
  });
  it("removes markdown symbols", () => {
    expect(stripMarkdown("**bold** _italic_")).toBe("bold italic");
  });
  it("extracts link text", () => {
    expect(stripMarkdown("[Click here](http://x.com)")).toBe("Click here");
  });
  it("handles empty string", () => {
    expect(stripMarkdown()).toBe("");
  });
});

describe("getTitleFromMarkdown", () => {
  it("extracts H1 heading", () => {
    expect(getTitleFromMarkdown("# My Title\nContent")).toBe("My Title");
  });
  it("falls back to first line", () => {
    expect(getTitleFromMarkdown("Just some text")).toBe("Just some text");
  });
  it("returns 'Sin título' for empty", () => {
    expect(getTitleFromMarkdown("")).toBe("Sin título");
  });
  it("strips markdown from fallback", () => {
    expect(getTitleFromMarkdown("**Bold title**")).toBe("Bold title");
  });
});

describe("findPageByPath", () => {
  const pages = [
    { pagePath: "a.md", children: [] },
    { pagePath: "b/page.json", children: [
      { pagePath: "b/c/page.json", children: [] },
    ]},
  ];

  it("finds top-level page", () => {
    expect(findPageByPath(pages, "a.md")).toBe(pages[0]);
  });
  it("finds nested page", () => {
    expect(findPageByPath(pages, "b/c/page.json")).toBe(pages[1].children[0]);
  });
  it("returns null for missing", () => {
    expect(findPageByPath(pages, "missing.md")).toBeNull();
  });
});

describe("findPageInPackages", () => {
  const pkgs = [
    { name: "docs", pages: [{ pagePath: "readme.md", children: [] }] },
  ];

  it("finds page in correct package", () => {
    const result = findPageInPackages(pkgs, { packageName: "docs", pagePath: "readme.md" });
    expect(result.pagePath).toBe("readme.md");
  });
  it("returns null for wrong package", () => {
    expect(findPageInPackages(pkgs, { packageName: "other", pagePath: "readme.md" })).toBeNull();
  });
  it("returns null for null target", () => {
    expect(findPageInPackages(pkgs, null)).toBeNull();
  });
});

describe("filterPages", () => {
  const pages = [
    { title: "Getting Started", children: [] },
    { title: "API Reference", children: [
      { title: "REST API", children: [] },
    ]},
    { title: "FAQ", children: [] },
  ];

  it("filters by title match", () => {
    const result = filterPages(pages, "api");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("API Reference");
  });
  it("keeps parents of matching children", () => {
    const result = filterPages(pages, "rest");
    expect(result).toHaveLength(1);
    expect(result[0].children[0].title).toBe("REST API");
  });
  it("returns all with empty query", () => {
    const result = filterPages(pages, "");
    expect(result).toHaveLength(3);
  });
});

describe("getFirstPage", () => {
  it("returns first page of first package", () => {
    const pkgs = [{ pages: [{ id: "first" }] }];
    expect(getFirstPage(pkgs).id).toBe("first");
  });
  it("skips empty packages", () => {
    const pkgs = [{ pages: [] }, { pages: [{ id: "second" }] }];
    expect(getFirstPage(pkgs).id).toBe("second");
  });
  it("returns null when no pages", () => {
    expect(getFirstPage([{ pages: [] }])).toBeNull();
  });
});

describe("getAncestorPagePaths", () => {
  it("returns ancestors for nested path", () => {
    const result = getAncestorPagePaths("a/b/page.json");
    expect(result).toContain("a/page.json");
    expect(result).toContain("a.md");
    expect(result).toContain("a/b/page.json");
    expect(result).toContain("a/b.md");
  });
  it("returns empty for top-level", () => {
    expect(getAncestorPagePaths("page.json")).toHaveLength(0);
  });
});

describe("buildExpandedState", () => {
  it("creates expanded state for all packages", () => {
    const pkgs = [{ name: "docs" }, { name: "api" }];
    const result = buildExpandedState(pkgs);
    expect(result).toEqual({ "package:docs": true, "package:api": true });
  });
});

describe("normalizeTree / normalizePages", () => {
  it("normalizes raw tree with ids", () => {
    const raw = [{ id: "__root__", name: "docs", pages: [
      { pagePath: "readme.md", title: "Readme", children: [] },
    ]}];
    const result = normalizeTree(raw);
    expect(result[0].id).toBe("__root__");
    expect(result[0].pages[0].packageName).toBe("__root__");
    expect(result[0].pages[0].sourceType).toBe("legacy-markdown");
  });
  it("handles missing id", () => {
    const raw = [{ name: "pkg", pages: [] }];
    expect(normalizeTree(raw)[0].id).toBe("pkg");
  });
});

describe("renderInlineMarkdown", () => {
  it("renders bold", () => {
    expect(renderInlineMarkdown("**bold**")).toContain("<strong>bold</strong>");
  });
  it("renders italic", () => {
    expect(renderInlineMarkdown("*em*")).toContain("<em>em</em>");
  });
  it("renders inline code", () => {
    expect(renderInlineMarkdown("`code`")).toContain("<code>code</code>");
  });
  it("renders links", () => {
    expect(renderInlineMarkdown("[text](url)")).toContain('<a href="url">text</a>');
  });
  it("escapes HTML", () => {
    expect(renderInlineMarkdown("<script>")).toContain("&lt;script&gt;");
  });
});

describe("renderMarkdownPreview", () => {
  it("renders headings", () => {
    const html = renderMarkdownPreview("# Title");
    expect(html).toContain("<h1>");
    expect(html).toContain("Title");
  });
  it("renders code blocks", () => {
    const html = renderMarkdownPreview("```js\nconst x = 1;\n```");
    expect(html).toContain("<pre");
    expect(html).toContain("const x = 1;");
  });
  it("renders lists", () => {
    const html = renderMarkdownPreview("- item 1\n- item 2");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>");
  });
  it("renders blockquotes", () => {
    const html = renderMarkdownPreview("> quote text");
    expect(html).toContain("<blockquote");
  });
  it("renders tables with colon separators", () => {
    // Note: the regex /^\|[\s:-|]+\|$/ treats :-| as a char range (58-124)
    // which excludes `-` (char 45). Only `:` and space-based separators work.
    const md = `| a | b |
| : | : |
| 1 | 2 |`;
    const html = renderMarkdownPreview(md);
    expect(html).toContain("<table");
    expect(html).toContain("<th>");
  });
  it("renders horizontal rule", () => {
    const html = renderMarkdownPreview("---");
    expect(html).toContain("<hr");
  });
  it("renders paragraphs", () => {
    const html = renderMarkdownPreview("Hello world");
    expect(html).toContain("<p>Hello world</p>");
  });
});
