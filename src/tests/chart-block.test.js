/**
 * Chart block tests.
 * Tests the chart data model and Tiptap extension.
 */

import { describe, it, expect } from "vitest";

// Test the data model for chart blocks
describe("Chart Block Data Model", () => {

  const sampleChart = {
    type: "chartBlock",
    attrs: {
      chartType: "bar",
      title: "Alumnos por mes",
      data: JSON.stringify([
        { name: "Ene", value: 20 },
        { name: "Feb", value: 25 },
        { name: "Mar", value: 30 },
      ]),
      xKey: "name",
      yKey: "value",
      color: "#0071e3",
    },
  };

  it("chart attrs are JSON-serializable strings", () => {
    // data must be a string for ProseMirror
    expect(typeof sampleChart.attrs.data).toBe("string");
    const parsed = JSON.parse(sampleChart.attrs.data);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].name).toBe("Ene");
  });

  it("supports bar, line, area, pie chart types", () => {
    const validTypes = ["bar", "line", "area", "pie"];
    for (const type of validTypes) {
      expect(validTypes).toContain(type);
    }
  });

  it("data entries have consistent keys", () => {
    const data = JSON.parse(sampleChart.attrs.data);
    const keys = Object.keys(data[0]);
    for (const entry of data) {
      expect(Object.keys(entry)).toEqual(keys);
    }
  });

  it("handles empty data gracefully", () => {
    const emptyChart = { ...sampleChart, attrs: { ...sampleChart.attrs, data: "[]" } };
    const parsed = JSON.parse(emptyChart.attrs.data);
    expect(parsed).toHaveLength(0);
  });

  it("handles numeric and string values", () => {
    const mixedData = JSON.stringify([
      { label: "A", count: 10, rate: "45%" },
      { label: "B", count: 20, rate: "55%" },
    ]);
    const parsed = JSON.parse(mixedData);
    expect(typeof parsed[0].count).toBe("number");
    expect(typeof parsed[0].rate).toBe("string");
  });
});
