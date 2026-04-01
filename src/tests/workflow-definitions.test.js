import { describe, it, expect } from "vitest";
import {
  WORKFLOW_TEMPLATES,
  STATUSES,
  generateWorkflow,
  generateCustomWorkflow,
  resolveDependencies,
  listWorkflowTemplates,
} from "@/lib/workflow-definitions";

describe("WORKFLOW_TEMPLATES", () => {
  it("has 9 area templates", () => {
    expect(Object.keys(WORKFLOW_TEMPLATES)).toHaveLength(9);
  });

  const areas = ["tecnico", "producto", "negocio", "marketing", "cliente", "legal", "franquicia", "operaciones", "bitacora"];
  it.each(areas)("has template for %s with stages and docs", (area) => {
    const t = WORKFLOW_TEMPLATES[area];
    expect(t.framework).toBeDefined();
    expect(t.author).toBeDefined();
    expect(t.stages.length).toBeGreaterThanOrEqual(4);
    for (const stage of t.stages) {
      expect(stage.id).toBeDefined();
      expect(stage.title).toBeDefined();
      expect(stage.color).toMatch(/^#/);
      expect(stage.docs.length).toBeGreaterThan(0);
      for (const doc of stage.docs) {
        expect(doc.docType).toBeDefined();
        expect(Array.isArray(doc.dependsOn)).toBe(true);
      }
    }
  });
});

describe("STATUSES", () => {
  it("has 4 statuses in order", () => {
    expect(STATUSES).toHaveLength(4);
    expect(STATUSES.map((s) => s.id)).toEqual(["not-started", "draft", "review", "done"]);
  });
});

describe("generateWorkflow", () => {
  it("generates workflow with docs having status and dependencies", () => {
    const wf = generateWorkflow("tecnico");
    expect(wf.workflowVersion).toBe(2);
    expect(wf.areaId).toBe("tecnico");
    expect(wf.stages).toHaveLength(4);

    const prd = wf.stages[0].docs[0];
    expect(prd.docType).toBe("PRD");
    expect(prd.status).toBe("not-started");
    expect(prd.pagePath).toBeNull();
    expect(prd.dependsOn).toHaveLength(1);
    expect(prd.dependsOn[0].area).toBe("negocio");
  });

  it("returns null for unknown area", () => {
    expect(generateWorkflow("unknown")).toBeNull();
  });
});

describe("resolveDependencies", () => {
  it("reports unmet when dependency is not-started", () => {
    const doc = { dependsOn: [{ area: "negocio", docType: "Lean Canvas", requiredStatus: "draft" }] };
    const workflows = {
      negocio: {
        stages: [{ docs: [{ docType: "Lean Canvas", status: "not-started" }] }],
      },
    };
    const { met, unmet } = resolveDependencies(doc, workflows);
    expect(met).toHaveLength(0);
    expect(unmet).toHaveLength(1);
    expect(unmet[0].currentStatus).toBe("not-started");
  });

  it("reports met when dependency meets required status", () => {
    const doc = { dependsOn: [{ area: "tecnico", docType: "PRD", requiredStatus: "review" }] };
    const workflows = {
      tecnico: {
        stages: [{ docs: [{ docType: "PRD", status: "done" }] }],
      },
    };
    const { met, unmet } = resolveDependencies(doc, workflows);
    expect(met).toHaveLength(1);
    expect(unmet).toHaveLength(0);
  });

  it("reports not-found when area missing", () => {
    const doc = { dependsOn: [{ area: "missing", docType: "X", requiredStatus: "draft" }] };
    const { unmet } = resolveDependencies(doc, {});
    expect(unmet).toHaveLength(1);
    expect(unmet[0].currentStatus).toBe("not-found");
  });

  it("handles docs with no dependencies", () => {
    const { met, unmet } = resolveDependencies({ dependsOn: [] }, {});
    expect(met).toHaveLength(0);
    expect(unmet).toHaveLength(0);
  });

  it("cross-area dependency works", () => {
    const doc = { dependsOn: [
      { area: "negocio", docType: "Lean Canvas", requiredStatus: "draft" },
      { area: "legal", docType: "Aviso de Privacidad", requiredStatus: "done" },
    ]};
    const workflows = {
      negocio: { stages: [{ docs: [{ docType: "Lean Canvas", status: "review" }] }] },
      legal: { stages: [{ docs: [{ docType: "Aviso de Privacidad", status: "review" }] }] },
    };
    const { met, unmet } = resolveDependencies(doc, workflows);
    expect(met).toHaveLength(1); // Lean Canvas review >= draft
    expect(unmet).toHaveLength(1); // Aviso review < done
  });
});

describe("listWorkflowTemplates", () => {
  it("lists all templates with doc counts", () => {
    const list = listWorkflowTemplates();
    expect(list).toHaveLength(9);
    const tecnico = list.find((t) => t.id === "tecnico");
    expect(tecnico.totalDocs).toBeGreaterThan(0);
  });
});
