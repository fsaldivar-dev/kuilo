import { describe, it, expect } from "vitest";
import {
  WORKFLOW_TEMPLATES,
  generateWorkflow,
  generateCustomWorkflow,
  listWorkflowTemplates,
} from "@/lib/workflow-definitions";

describe("WORKFLOW_TEMPLATES", () => {
  it("has 9 area templates", () => {
    expect(Object.keys(WORKFLOW_TEMPLATES)).toHaveLength(9);
  });

  it("each template has framework, author, and stages", () => {
    for (const [id, template] of Object.entries(WORKFLOW_TEMPLATES)) {
      expect(template.framework).toBeDefined();
      expect(template.author).toBeDefined();
      expect(template.stages.length).toBeGreaterThanOrEqual(4);
      for (const stage of template.stages) {
        expect(stage.id).toBeDefined();
        expect(stage.title).toBeDefined();
        expect(stage.color).toMatch(/^#/);
        expect(stage.docTypes.length).toBeGreaterThan(0);
      }
    }
  });

  const areas = ["tecnico", "producto", "negocio", "marketing", "cliente", "legal", "franquicia", "operaciones", "bitacora"];
  it.each(areas)("has template for %s", (area) => {
    expect(WORKFLOW_TEMPLATES[area]).toBeDefined();
  });
});

describe("generateWorkflow", () => {
  it("generates workflow for tecnico with Shape Up stages", () => {
    const wf = generateWorkflow("tecnico");
    expect(wf.areaId).toBe("tecnico");
    expect(wf.framework).toContain("Shape Up");
    expect(wf.stages).toHaveLength(4);
    expect(wf.stages[0].title).toBe("Pitch");
    expect(wf.stages[3].title).toBe("Cool-down");
    expect(wf.initiatives).toEqual([]);
    expect(wf.editable).toBe(true);
  });

  it("generates workflow for producto with Stage-Gate stages", () => {
    const wf = generateWorkflow("producto");
    expect(wf.stages).toHaveLength(6);
    expect(wf.stages[0].title).toBe("Discovery");
    expect(wf.stages[5].title).toBe("Launch");
  });

  it("returns null for unknown area", () => {
    expect(generateWorkflow("unknown")).toBeNull();
  });

  it("stages have correct order numbers", () => {
    const wf = generateWorkflow("legal");
    wf.stages.forEach((s, i) => expect(s.order).toBe(i));
  });
});

describe("generateCustomWorkflow", () => {
  it("creates editable custom workflow", () => {
    const wf = generateCustomWorkflow("My Flow", [
      { title: "Todo", color: "#ff0000" },
      { title: "Doing", color: "#00ff00" },
      { title: "Done", color: "#0000ff" },
    ]);
    expect(wf.areaId).toBe("custom");
    expect(wf.framework).toBe("Personalizado");
    expect(wf.stages).toHaveLength(3);
    expect(wf.stages[0].id).toBeDefined();
    expect(wf.stages[1].title).toBe("Doing");
  });
});

describe("listWorkflowTemplates", () => {
  it("lists all templates with metadata", () => {
    const list = listWorkflowTemplates();
    expect(list).toHaveLength(9);
    const tecnico = list.find((t) => t.id === "tecnico");
    expect(tecnico.framework).toContain("Shape Up");
    expect(tecnico.stageCount).toBe(4);
    expect(tecnico.stages).toContain("Pitch");
  });
});
