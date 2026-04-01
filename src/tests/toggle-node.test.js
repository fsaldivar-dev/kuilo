/**
 * Tests for Toggle Node — Sprint 1.4
 * TDD: written before implementation
 *
 * ToggleList = bloque colapsable estilo AppFlowy
 * - Tiene un summary (título) siempre visible
 * - Tiene contenido hijo que se oculta/muestra
 * - Se inserta via slash command "/toggle"
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { ToggleListNode, ToggleSummaryNode } from "@/components/tiptap-node/toggle-node/toggle-node-extension";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEditor(content = "") {
  return new Editor({
    extensions: [StarterKit, ToggleListNode, ToggleSummaryNode],
    content: content || "<p></p>",
  });
}

// ─── Extension registration ───────────────────────────────────────────────────

describe("ToggleListNode extension", () => {
  it("can be imported without throwing", async () => {
    await expect(
      import("@/components/tiptap-node/toggle-node/toggle-node-extension")
    ).resolves.toBeDefined();
  });

  it("exports ToggleListNode and ToggleSummaryNode", async () => {
    const mod = await import("@/components/tiptap-node/toggle-node/toggle-node-extension");
    expect(typeof mod.ToggleListNode).toBe("object");
    expect(typeof mod.ToggleSummaryNode).toBe("object");
  });

  it("ToggleListNode has name 'toggleList'", () => {
    expect(ToggleListNode.name).toBe("toggleList");
  });

  it("ToggleSummaryNode has name 'toggleSummary'", () => {
    expect(ToggleSummaryNode.name).toBe("toggleSummary");
  });
});

// ─── Editor integration ───────────────────────────────────────────────────────

describe("toggle node in editor", () => {
  let editor;
  beforeEach(() => {
    editor = makeEditor();
  });
  afterEach(() => {
    editor?.destroy();
  });

  it("editor initializes with toggle extensions registered", () => {
    expect(editor.schema.nodes.toggleList).toBeDefined();
    expect(editor.schema.nodes.toggleSummary).toBeDefined();
  });

  it("can insert a toggle list block", () => {
    editor.commands.insertToggleList();
    const html = editor.getHTML();
    expect(html).toContain("toggle-list");
  });

  it("inserted toggle block contains a summary child", () => {
    editor.commands.insertToggleList();
    const html = editor.getHTML();
    expect(html).toContain("toggle-summary");
  });

  it("isActive('toggleList') returns true after insertion", () => {
    editor.commands.insertToggleList();
    // Move cursor inside summary
    editor.commands.focus("start");
    expect(editor.isActive("toggleList")).toBe(true);
  });

  it("can set and retrieve summary text content", () => {
    editor.commands.insertToggleList();
    editor.commands.focus("start");
    editor.commands.insertContent("Mi toggle");
    const html = editor.getHTML();
    expect(html).toContain("Mi toggle");
  });
});

// ─── Open/closed state ────────────────────────────────────────────────────────

describe("toggle open/closed state", () => {
  let editor;
  beforeEach(() => {
    editor = makeEditor();
    editor.commands.insertToggleList();
  });
  afterEach(() => {
    editor?.destroy();
  });

  it("toggle is open by default", () => {
    const html = editor.getHTML();
    // open attribute on details element
    expect(html).toMatch(/open/);
  });

  it("toggleOpen command closes an open toggle", () => {
    editor.commands.focus("start");
    editor.commands.toggleOpen();
    const html = editor.getHTML();
    expect(html).not.toMatch(/data-open="true"/);
  });

  it("toggleOpen command re-opens a closed toggle", () => {
    editor.commands.focus("start");
    editor.commands.toggleOpen(); // close
    editor.commands.toggleOpen(); // re-open
    const html = editor.getHTML();
    expect(html).toMatch(/data-open="true"/);
  });
});

// ─── HTML serialization ───────────────────────────────────────────────────────

describe("toggle HTML serialization", () => {
  it("renders as a div with data-type='toggle-list'", () => {
    const editor = makeEditor();
    editor.commands.insertToggleList();
    const html = editor.getHTML();
    expect(html).toContain('data-type="toggle-list"');
  });

  it("summary renders with data-type='toggle-summary'", () => {
    const editor = makeEditor();
    editor.commands.insertToggleList();
    const html = editor.getHTML();
    expect(html).toContain('data-type="toggle-summary"');
  });

  it("can be parsed back from HTML", () => {
    const editor = makeEditor();
    editor.commands.insertToggleList();
    const html = editor.getHTML();

    const editor2 = makeEditor(html);
    expect(editor2.schema.nodes.toggleList).toBeDefined();
    expect(editor2.getHTML()).toContain('data-type="toggle-list"');
  });
});
