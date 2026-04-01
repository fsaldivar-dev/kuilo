import { describe, it, expect } from "vitest";
import { diffBlocks, blockToText } from "@/lib/block-diff";

const p = (text) => ({ type: "paragraph", content: [{ type: "text", text }] });
const h = (text, level = 1) => ({ type: "heading", attrs: { level }, content: [{ type: "text", text }] });

describe("diffBlocks", () => {
  it("returns all equal for identical arrays", () => {
    const blocks = [p("Hello"), p("World")];
    const result = diffBlocks(blocks, blocks);
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.status === "equal")).toBe(true);
  });

  it("detects added blocks", () => {
    const old = [p("A")];
    const cur = [p("A"), p("B")];
    const result = diffBlocks(old, cur);
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe("equal");
    expect(result[1].status).toBe("added");
  });

  it("detects removed blocks", () => {
    const old = [p("A"), p("B")];
    const cur = [p("A")];
    const result = diffBlocks(old, cur);
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe("equal");
    expect(result[1].status).toBe("removed");
  });

  it("detects modified blocks (same type, different content)", () => {
    const old = [p("Before")];
    const cur = [p("After")];
    const result = diffBlocks(old, cur);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("modified");
    expect(blockToText(result[0].block)).toBe("After");
    expect(blockToText(result[0].oldBlock)).toBe("Before");
  });

  it("handles empty arrays", () => {
    expect(diffBlocks([], [])).toHaveLength(0);
    expect(diffBlocks([], [p("A")])).toEqual([{ status: "added", block: p("A") }]);
    expect(diffBlocks([p("A")], [])).toEqual([{ status: "removed", block: p("A") }]);
  });

  it("handles mixed additions, removals, and modifications", () => {
    const old = [h("Title"), p("Intro"), p("Body"), p("Footer")];
    const cur = [h("Title"), p("New intro"), p("Body"), p("Extra"), p("Footer")];
    const result = diffBlocks(old, cur);

    const statuses = result.map((e) => e.status);
    expect(statuses).toContain("equal");
    expect(statuses).toContain("modified"); // Intro → New intro
    expect(statuses).toContain("added");    // Extra
  });

  it("different block types are not marked as modified", () => {
    const old = [p("Text")];
    const cur = [h("Text")];
    const result = diffBlocks(old, cur);
    // p→h is type change, so it's removed + added, not modified
    expect(result.some((e) => e.status === "removed")).toBe(true);
    expect(result.some((e) => e.status === "added")).toBe(true);
    expect(result.every((e) => e.status !== "modified")).toBe(true);
  });
});

describe("blockToText", () => {
  it("extracts text from tiptap content array", () => {
    expect(blockToText(p("Hello"))).toBe("Hello");
  });

  it("extracts from plain string content", () => {
    expect(blockToText({ content: "Plain text" })).toBe("Plain text");
  });

  it("handles empty/null", () => {
    expect(blockToText(null)).toBe("");
    expect(blockToText({})).toBe("");
  });
});
