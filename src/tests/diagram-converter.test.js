/**
 * Diagram converter tests (TDD).
 * Tests bidirectional conversion: Mermaid ↔ React Flow nodes/edges.
 */

import { describe, it, expect } from "vitest";
import { mermaidToFlow, flowToMermaid } from "../lib/diagram-converter.js";

describe("flowToMermaid", () => {
  it("converts simple nodes + edges to flowchart", () => {
    const nodes = [
      { id: "a", data: { label: "Start" }, type: "rect" },
      { id: "b", data: { label: "End" }, type: "rect" },
    ];
    const edges = [{ id: "e1", source: "a", target: "b" }];
    const result = flowToMermaid(nodes, edges, "TD");

    expect(result).toContain("flowchart TD");
    expect(result).toContain('a["Start"]');
    expect(result).toContain('b["End"]');
    expect(result).toContain("a --> b");
  });

  it("handles diamond (decision) nodes", () => {
    const nodes = [
      { id: "a", data: { label: "Check" }, type: "diamond" },
    ];
    const result = flowToMermaid(nodes, [], "TD");
    expect(result).toContain('a{"Check"}');
  });

  it("handles rounded nodes", () => {
    const nodes = [
      { id: "a", data: { label: "Process" }, type: "rounded" },
    ];
    const result = flowToMermaid(nodes, [], "TD");
    expect(result).toContain('a("Process")');
  });

  it("handles circle nodes", () => {
    const nodes = [
      { id: "a", data: { label: "Event" }, type: "circle" },
    ];
    const result = flowToMermaid(nodes, [], "TD");
    expect(result).toContain('a(("Event"))');
  });

  it("handles edge labels", () => {
    const nodes = [
      { id: "a", data: { label: "A" }, type: "rect" },
      { id: "b", data: { label: "B" }, type: "rect" },
    ];
    const edges = [{ id: "e1", source: "a", target: "b", label: "Yes" }];
    const result = flowToMermaid(nodes, edges, "TD");
    expect(result).toContain('a -->|"Yes"| b');
  });

  it("supports LR direction", () => {
    const result = flowToMermaid([], [], "LR");
    expect(result).toContain("flowchart LR");
  });
});

describe("mermaidToFlow", () => {
  it("parses simple flowchart", () => {
    const mermaid = `flowchart TD
    A["Start"] --> B["End"]`;
    const { nodes, edges, direction } = mermaidToFlow(mermaid);

    expect(direction).toBe("TD");
    expect(nodes).toHaveLength(2);
    expect(nodes[0].id).toBe("A");
    expect(nodes[0].data.label).toBe("Start");
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe("A");
    expect(edges[0].target).toBe("B");
  });

  it("parses node shapes", () => {
    const mermaid = `flowchart TD
    A["Rect"]
    B("Rounded")
    C{"Diamond"}
    D(("Circle"))`;
    const { nodes } = mermaidToFlow(mermaid);

    expect(nodes.find(n => n.id === "A").type).toBe("rect");
    expect(nodes.find(n => n.id === "B").type).toBe("rounded");
    expect(nodes.find(n => n.id === "C").type).toBe("diamond");
    expect(nodes.find(n => n.id === "D").type).toBe("circle");
  });

  it("parses edge labels", () => {
    const mermaid = `flowchart TD
    A["Start"] -->|"Yes"| B["End"]`;
    const { edges } = mermaidToFlow(mermaid);

    expect(edges[0].label).toBe("Yes");
  });

  it("parses nodes without quotes", () => {
    const mermaid = `flowchart TD
    A[Start] --> B[End]`;
    const { nodes } = mermaidToFlow(mermaid);

    expect(nodes[0].data.label).toBe("Start");
    expect(nodes[1].data.label).toBe("End");
  });

  it("handles multiple edges from same node", () => {
    const mermaid = `flowchart TD
    A[Start] --> B[Left]
    A --> C[Right]`;
    const { edges } = mermaidToFlow(mermaid);

    expect(edges).toHaveLength(2);
    expect(edges[0].source).toBe("A");
    expect(edges[1].source).toBe("A");
  });

  it("roundtrip: flowToMermaid → mermaidToFlow preserves structure", () => {
    const originalNodes = [
      { id: "a", data: { label: "Start" }, type: "rect" },
      { id: "b", data: { label: "Decision" }, type: "diamond" },
      { id: "c", data: { label: "End" }, type: "rounded" },
    ];
    const originalEdges = [
      { id: "e1", source: "a", target: "b" },
      { id: "e2", source: "b", target: "c", label: "Yes" },
    ];

    const mermaid = flowToMermaid(originalNodes, originalEdges, "TD");
    const { nodes, edges } = mermaidToFlow(mermaid);

    expect(nodes).toHaveLength(3);
    expect(edges).toHaveLength(2);
    expect(nodes.find(n => n.id === "b").type).toBe("diamond");
    expect(edges.find(e => e.label === "Yes")).toBeDefined();
  });
});
