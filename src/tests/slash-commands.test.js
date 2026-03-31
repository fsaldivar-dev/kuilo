/**
 * TDD — Slash Commands
 * Tests escritos ANTES de implementar src/lib/slash-commands.js
 */

import { describe, it, expect } from "vitest";
import { SLASH_COMMANDS, filterCommands } from "@/lib/slash-commands";

// ─── Estructura de comandos ───────────────────────────────────────────────────

describe("SLASH_COMMANDS — estructura", () => {
  it("tiene al menos 10 comandos definidos", () => {
    expect(SLASH_COMMANDS.length).toBeGreaterThanOrEqual(10);
  });

  it("cada comando tiene id, title, description, keywords y execute", () => {
    SLASH_COMMANDS.forEach((cmd) => {
      expect(cmd, `comando sin id`).toHaveProperty("id");
      expect(cmd, `${cmd.id} sin title`).toHaveProperty("title");
      expect(cmd, `${cmd.id} sin description`).toHaveProperty("description");
      expect(cmd, `${cmd.id} sin keywords`).toHaveProperty("keywords");
      expect(Array.isArray(cmd.keywords), `${cmd.id} keywords no es array`).toBe(true);
      expect(cmd, `${cmd.id} sin execute`).toHaveProperty("execute");
      expect(typeof cmd.execute, `${cmd.id} execute no es función`).toBe("function");
    });
  });

  it("no hay ids duplicados", () => {
    const ids = SLASH_COMMANDS.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("incluye headings h1, h2, h3", () => {
    const ids = SLASH_COMMANDS.map((c) => c.id);
    expect(ids).toContain("h1");
    expect(ids).toContain("h2");
    expect(ids).toContain("h3");
  });

  it("incluye bullet-list, ordered-list, task-list", () => {
    const ids = SLASH_COMMANDS.map((c) => c.id);
    expect(ids).toContain("bullet-list");
    expect(ids).toContain("ordered-list");
    expect(ids).toContain("task-list");
  });

  it("incluye quote, code-block, divider", () => {
    const ids = SLASH_COMMANDS.map((c) => c.id);
    expect(ids).toContain("quote");
    expect(ids).toContain("code-block");
    expect(ids).toContain("divider");
  });

  it("incluye image", () => {
    const ids = SLASH_COMMANDS.map((c) => c.id);
    expect(ids).toContain("image");
  });
});

// ─── filterCommands ───────────────────────────────────────────────────────────

describe("filterCommands — filtrado", () => {
  it("query vacía retorna todos los comandos", () => {
    expect(filterCommands("")).toHaveLength(SLASH_COMMANDS.length);
    expect(filterCommands(null)).toHaveLength(SLASH_COMMANDS.length);
    expect(filterCommands(undefined)).toHaveLength(SLASH_COMMANDS.length);
  });

  it("filtra por título (case insensitive)", () => {
    const results = filterCommands("HEADING");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      const matchesTitle = r.title.toLowerCase().includes("heading");
      const matchesKeyword = r.keywords.some((k) => k.includes("heading"));
      expect(matchesTitle || matchesKeyword).toBe(true);
    });
  });

  it("'h1' retorna el comando h1 como primer resultado", () => {
    const results = filterCommands("h1");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe("h1");
  });

  it("'h2' retorna h2 primero", () => {
    const results = filterCommands("h2");
    expect(results[0].id).toBe("h2");
  });

  it("'todo' retorna task-list", () => {
    const results = filterCommands("todo");
    expect(results.map((r) => r.id)).toContain("task-list");
  });

  it("'check' retorna task-list", () => {
    const results = filterCommands("check");
    expect(results.map((r) => r.id)).toContain("task-list");
  });

  it("'code' retorna code-block", () => {
    const results = filterCommands("code");
    expect(results.map((r) => r.id)).toContain("code-block");
  });

  it("'ul' o 'bullet' retorna bullet-list", () => {
    expect(filterCommands("ul").map((r) => r.id)).toContain("bullet-list");
    expect(filterCommands("bullet").map((r) => r.id)).toContain("bullet-list");
  });

  it("'ol' o 'numbered' retorna ordered-list", () => {
    expect(filterCommands("ol").map((r) => r.id)).toContain("ordered-list");
    expect(filterCommands("numbered").map((r) => r.id)).toContain("ordered-list");
  });

  it("'divider' o 'hr' retorna divider", () => {
    expect(filterCommands("divider").map((r) => r.id)).toContain("divider");
    expect(filterCommands("hr").map((r) => r.id)).toContain("divider");
  });

  it("query sin match retorna array vacío", () => {
    expect(filterCommands("xyznotfoundever")).toHaveLength(0);
  });

  it("retorna instancias del array original (no copias profundas)", () => {
    const results = filterCommands("h1");
    const original = SLASH_COMMANDS.find((c) => c.id === "h1");
    expect(results[0]).toBe(original);
  });
});

// ─── execute — smoke test (mock de editor) ────────────────────────────────────

describe("SLASH_COMMANDS — execute smoke test", () => {
  const buildMockEditor = (activeCommands = []) => {
    const chain = {};
    const noop = () => chain;
    chain.focus = noop;
    chain.deleteRange = noop;
    chain.setHeading = noop;
    chain.setParagraph = noop;
    chain.toggleBulletList = noop;
    chain.toggleOrderedList = noop;
    chain.toggleTaskList = noop;
    chain.toggleBlockquote = noop;
    chain.toggleCodeBlock = noop;
    chain.setHorizontalRule = noop;
    chain.run = () => true;
    return { chain: () => chain };
  };

  const mockRange = { from: 0, to: 1 };

  it("h1.execute no lanza error con editor mock", () => {
    const cmd = SLASH_COMMANDS.find((c) => c.id === "h1");
    expect(() => cmd.execute({ editor: buildMockEditor(), range: mockRange })).not.toThrow();
  });

  it("bullet-list.execute no lanza error con editor mock", () => {
    const cmd = SLASH_COMMANDS.find((c) => c.id === "bullet-list");
    expect(() => cmd.execute({ editor: buildMockEditor(), range: mockRange })).not.toThrow();
  });

  it("task-list.execute no lanza error con editor mock", () => {
    const cmd = SLASH_COMMANDS.find((c) => c.id === "task-list");
    expect(() => cmd.execute({ editor: buildMockEditor(), range: mockRange })).not.toThrow();
  });

  it("divider.execute no lanza error con editor mock", () => {
    const cmd = SLASH_COMMANDS.find((c) => c.id === "divider");
    expect(() => cmd.execute({ editor: buildMockEditor(), range: mockRange })).not.toThrow();
  });
});
