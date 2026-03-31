import { describe, it, expect } from "vitest";
import { blocksToMarkdown } from "../lib/blocks-to-markdown.js";

describe("blocksToMarkdown", () => {
  it("converts headings", () => {
    const md = blocksToMarkdown([
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Title" }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Sub" }] },
    ]);
    expect(md).toContain("# Title");
    expect(md).toContain("## Sub");
  });

  it("converts paragraphs with marks", () => {
    const md = blocksToMarkdown([
      { type: "paragraph", content: [
        { type: "text", text: "bold", marks: [{ type: "bold" }] },
        { type: "text", text: " normal" },
      ]},
    ]);
    expect(md).toContain("**bold** normal");
  });

  it("converts callouts to GFM", () => {
    const md = blocksToMarkdown([
      { type: "callout", attrs: { type: "warning" }, content: [
        { type: "paragraph", content: [{ type: "text", text: "Careful!" }] },
      ]},
    ]);
    expect(md).toContain("> [!WARNING]");
    expect(md).toContain("> Careful!");
  });

  it("converts chartBlock to mermaid", () => {
    const md = blocksToMarkdown([
      { type: "chartBlock", attrs: { chartType: "bar", title: "Sales", data: '[{"name":"Jan","value":10}]', xKey: "name", yKey: "value" } },
    ]);
    expect(md).toContain("```mermaid");
    expect(md).toContain("xychart-beta");
  });

  it("converts chartBlock pie to mermaid pie", () => {
    const md = blocksToMarkdown([
      { type: "chartBlock", attrs: { chartType: "pie", data: '[{"name":"A","value":30}]', xKey: "name", yKey: "value" } },
    ]);
    expect(md).toContain("```mermaid");
    expect(md).toContain("pie");
  });

  it("converts kanbanBlock to task lists", () => {
    const md = blocksToMarkdown([
      { type: "kanbanBlock", attrs: { board: JSON.stringify({
        columns: [
          { id: "a", title: "Todo", cards: [{ id: "c1", title: "Task 1" }] },
          { id: "b", title: "Done", cards: [] },
        ],
      })}},
    ]);
    expect(md).toContain("### Todo");
    expect(md).toContain("- [ ] Task 1");
    expect(md).toContain("### Done");
  });

  it("converts apiEndpoint to table", () => {
    const md = blocksToMarkdown([
      { type: "apiEndpoint", attrs: {
        method: "GET", path: "/users", description: "List users",
        params: JSON.stringify([{ name: "page", type: "number", required: false, description: "Page" }]),
        responses: JSON.stringify([{ status: "200", description: "OK", body: '{}' }]),
      }},
    ]);
    expect(md).toContain("### GET `/users`");
    expect(md).toContain("| page |");
    expect(md).toContain("**200**");
  });

  it("converts metadataCard to table", () => {
    const md = blocksToMarkdown([
      { type: "metadataCard", attrs: { fields: JSON.stringify([
        { key: "Status", value: "Draft" },
        { key: "Author", value: "Juan" },
      ])}},
    ]);
    expect(md).toContain("| Status | Draft |");
    expect(md).toContain("| Author | Juan |");
  });

  it("converts diagramBlock to mermaid", () => {
    const md = blocksToMarkdown([
      { type: "diagramBlock", attrs: { mermaid: "flowchart TD\n    A --> B" } },
    ]);
    expect(md).toContain("```mermaid");
    expect(md).toContain("flowchart TD");
  });

  it("converts mathBlock", () => {
    const md = blocksToMarkdown([
      { type: "mathBlock", content: [{ type: "text", text: "E = mc^2" }] },
    ]);
    expect(md).toContain("$$");
    expect(md).toContain("E = mc^2");
  });

  it("converts whiteboardBlock", () => {
    const md = blocksToMarkdown([
      { type: "whiteboardBlock", attrs: { data: JSON.stringify({ elements: [{}, {}, {}] }) } },
    ]);
    expect(md).toContain("[Whiteboard: 3 elementos]");
  });

  it("handles empty blocks array", () => {
    expect(blocksToMarkdown([])).toBe("");
  });

  it("handles pageDocument format (content as string)", () => {
    const md = blocksToMarkdown([
      { type: "heading", props: { level: 1 }, content: "Hello" },
      { type: "paragraph", content: "World" },
    ]);
    expect(md).toContain("Hello");
    expect(md).toContain("World");
  });
});
