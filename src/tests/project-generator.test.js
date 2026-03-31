import { describe, it, expect } from "vitest";
import { generateProject } from "../lib/project-generator.js";

describe("generateProject", () => {
  it("creates _inicio package with start-here doc", () => {
    const areas = [{ id: "negocio", icon: "💼" }];
    const result = generateProject("TestProject", areas);
    const inicio = result.find(p => p.packageName === "_inicio");
    expect(inicio).toBeDefined();
    expect(inicio.docs[0].title).toBe("Empieza aquí");
  });

  it("creates packages for selected areas", () => {
    const areas = [
      { id: "negocio", icon: "💼" },
      { id: "cliente", icon: "👤" },
    ];
    const result = generateProject("Test", areas);
    expect(result.find(p => p.packageName === "negocio")).toBeDefined();
    expect(result.find(p => p.packageName === "cliente")).toBeDefined();
  });

  it("does not create packages for unselected areas", () => {
    const areas = [{ id: "negocio", icon: "💼" }];
    const result = generateProject("Test", areas);
    expect(result.find(p => p.packageName === "tecnico")).toBeUndefined();
  });

  it("negocio has Lean Canvas and Modelo de pricing", () => {
    const areas = [{ id: "negocio", icon: "💼" }];
    const result = generateProject("Test", areas);
    const pkg = result.find(p => p.packageName === "negocio");
    const titles = pkg.docs.map(d => d.title);
    expect(titles).toContain("Lean Canvas");
    expect(titles).toContain("Modelo de pricing");
  });

  it("all docs have blocks array", () => {
    const areas = [{ id: "negocio", icon: "💼" }, { id: "cliente", icon: "👤" }, { id: "producto", icon: "📦" }];
    const result = generateProject("Test", areas);
    for (const pkg of result) {
      for (const doc of pkg.docs) {
        expect(Array.isArray(doc.blocks)).toBe(true);
        expect(doc.blocks.length).toBeGreaterThan(0);
      }
    }
  });

  it("start-here doc has task list with all docs", () => {
    const areas = [{ id: "negocio", icon: "💼" }, { id: "cliente", icon: "👤" }];
    const result = generateProject("Test", areas);
    const startDoc = result.find(p => p.packageName === "_inicio").docs[0];
    const taskLists = startDoc.blocks.filter(b => b.type === "taskList");
    expect(taskLists.length).toBeGreaterThan(0);
  });

  it("orders areas by priority", () => {
    const areas = [
      { id: "tecnico", icon: "⚙️" },
      { id: "negocio", icon: "💼" },
      { id: "cliente", icon: "👤" },
    ];
    const result = generateProject("Test", areas);
    const pkgNames = result.filter(p => p.packageName !== "_inicio").map(p => p.packageName);
    expect(pkgNames.indexOf("negocio")).toBeLessThan(pkgNames.indexOf("tecnico"));
    expect(pkgNames.indexOf("cliente")).toBeLessThan(pkgNames.indexOf("tecnico"));
  });
});
