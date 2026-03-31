/**
 * Tests para tablas — bug fix
 * Verifica que las extensiones de tabla estén registradas y
 * que los comandos básicos funcionen.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";

function makeEditor() {
  return new Editor({
    extensions: [StarterKit, Table.configure({ resizable: true }), TableRow, TableHeader, TableCell],
    content: "<p></p>",
  });
}

// ─── Registro de extensiones ─────────────────────────────────────────────────

describe("table extensions registered", () => {
  it("schema has table node", () => {
    const ed = makeEditor();
    expect(ed.schema.nodes.table).toBeDefined();
  });

  it("schema has tableRow node", () => {
    const ed = makeEditor();
    expect(ed.schema.nodes.tableRow).toBeDefined();
  });

  it("schema has tableCell node", () => {
    const ed = makeEditor();
    expect(ed.schema.nodes.tableCell).toBeDefined();
  });

  it("schema has tableHeader node", () => {
    const ed = makeEditor();
    expect(ed.schema.nodes.tableHeader).toBeDefined();
  });
});

// ─── Inserción ────────────────────────────────────────────────────────────────

describe("insertTable command", () => {
  let editor;
  beforeEach(() => { editor = makeEditor(); });

  it("insertTable produces HTML with <table", () => {
    editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
    expect(editor.getHTML()).toContain("<table");
  });

  it("insertTable with header row includes <th>", () => {
    editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
    expect(editor.getHTML()).toContain("<th");
  });

  it("insertTable without header uses only <td>", () => {
    editor.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: false });
    const html = editor.getHTML();
    expect(html).not.toContain("<th");
    expect(html).toContain("<td");
  });

  it("isActive('table') returns true after insertion", () => {
    editor.commands.insertTable({ rows: 2, cols: 2 });
    editor.commands.focus("start");
    expect(editor.isActive("table")).toBe(true);
  });
});

// ─── Operaciones de filas ─────────────────────────────────────────────────────

describe("row operations", () => {
  let editor;
  beforeEach(() => {
    editor = makeEditor();
    editor.commands.insertTable({ rows: 2, cols: 3, withHeaderRow: true });
    editor.commands.focus("start");
  });

  it("addRowAfter command is available", () => {
    expect(typeof editor.commands.addRowAfter).toBe("function");
  });

  it("addRowBefore command is available", () => {
    expect(typeof editor.commands.addRowBefore).toBe("function");
  });

  it("deleteRow command is available", () => {
    expect(typeof editor.commands.deleteRow).toBe("function");
  });

  it("addRowAfter increases row count", () => {
    const before = editor.getHTML().split("<tr").length;
    editor.commands.addRowAfter();
    const after = editor.getHTML().split("<tr").length;
    expect(after).toBeGreaterThan(before);
  });
});

// ─── Operaciones de columnas ──────────────────────────────────────────────────

describe("column operations", () => {
  let editor;
  beforeEach(() => {
    editor = makeEditor();
    editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
    editor.commands.focus("start");
  });

  it("addColumnAfter command is available", () => {
    expect(typeof editor.commands.addColumnAfter).toBe("function");
  });

  it("addColumnBefore command is available", () => {
    expect(typeof editor.commands.addColumnBefore).toBe("function");
  });

  it("deleteColumn command is available", () => {
    expect(typeof editor.commands.deleteColumn).toBe("function");
  });

  it("addColumnAfter increases column count in header row", () => {
    const before = editor.getHTML().split("<th").length;
    editor.commands.addColumnAfter();
    const after = editor.getHTML().split("<th").length;
    expect(after).toBeGreaterThan(before);
  });
});

// ─── Serialización ────────────────────────────────────────────────────────────

describe("table HTML serialization round-trip", () => {
  it("htmlToPageDocument parses table correctly", async () => {
    const { htmlToPageDocument } = await import("@/lib/page-document");
    const html = `<table>
      <thead><tr><th>Col A</th><th>Col B</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>2</td></tr>
        <tr><td>3</td><td>4</td></tr>
      </tbody>
    </table>`;
    const doc = htmlToPageDocument(html);
    const table = doc.blocks.find((b) => b.type === "table");
    expect(table).toBeDefined();
    expect(table.props.columns).toEqual(["Col A", "Col B"]);
    expect(table.props.rows).toHaveLength(2);
    expect(table.props.rows[0]).toEqual(["1", "2"]);
  });
});
