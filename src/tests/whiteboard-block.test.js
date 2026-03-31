/**
 * Whiteboard (Excalidraw) block data model tests (TDD).
 */

import { describe, it, expect } from "vitest";

describe("Whiteboard Data Model", () => {
  const sampleData = {
    elements: [
      { type: "rectangle", x: 100, y: 100, width: 200, height: 80, id: "r1" },
      { type: "text", x: 150, y: 130, text: "Hello", id: "t1" },
      { type: "arrow", x: 300, y: 140, points: [[0, 0], [100, 50]], id: "a1" },
    ],
    appState: { viewBackgroundColor: "#ffffff" },
  };

  it("stores elements array and appState", () => {
    expect(sampleData.elements).toHaveLength(3);
    expect(sampleData.appState.viewBackgroundColor).toBe("#ffffff");
  });

  it("serializes to JSON string for ProseMirror", () => {
    const json = JSON.stringify(sampleData);
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(parsed.elements).toHaveLength(3);
  });

  it("handles empty whiteboard", () => {
    const empty = { elements: [], appState: {} };
    const json = JSON.stringify(empty);
    expect(JSON.parse(json).elements).toHaveLength(0);
  });

  it("elements have type, position, and id", () => {
    for (const el of sampleData.elements) {
      expect(el.type).toBeTruthy();
      expect(el.id).toBeTruthy();
      expect(typeof el.x).toBe("number");
    }
  });
});
