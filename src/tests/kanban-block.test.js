/**
 * Kanban block data model tests (TDD).
 */

import { describe, it, expect } from "vitest";

describe("Kanban Data Model", () => {
  const sampleBoard = {
    columns: [
      { id: "todo", title: "Por hacer", cards: [
        { id: "c1", title: "Diseñar landing", color: "" },
        { id: "c2", title: "Configurar CI/CD", color: "blue" },
      ]},
      { id: "doing", title: "En progreso", cards: [
        { id: "c3", title: "Implementar login", color: "green" },
      ]},
      { id: "done", title: "Hecho", cards: [] },
    ],
  };

  it("board has columns with cards", () => {
    expect(sampleBoard.columns).toHaveLength(3);
    expect(sampleBoard.columns[0].cards).toHaveLength(2);
  });

  it("columns have id and title", () => {
    for (const col of sampleBoard.columns) {
      expect(col.id).toBeTruthy();
      expect(col.title).toBeTruthy();
    }
  });

  it("cards have id and title", () => {
    const allCards = sampleBoard.columns.flatMap(c => c.cards);
    for (const card of allCards) {
      expect(card.id).toBeTruthy();
      expect(card.title).toBeTruthy();
    }
  });

  it("serializes to JSON string for ProseMirror attrs", () => {
    const json = JSON.stringify(sampleBoard);
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(parsed.columns).toHaveLength(3);
  });

  it("handles empty board", () => {
    const empty = { columns: [] };
    expect(JSON.stringify(empty)).toBe('{"columns":[]}');
  });

  it("card can have optional color", () => {
    const cards = sampleBoard.columns[0].cards;
    expect(cards[0].color).toBe("");
    expect(cards[1].color).toBe("blue");
  });
});
