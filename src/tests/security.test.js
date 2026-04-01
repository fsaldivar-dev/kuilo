/**
 * Security tests — sanitization, IPC validation, XSS prevention.
 */

import { describe, it, expect } from "vitest";
import DOMPurify from "dompurify";

describe("SVG Sanitization", () => {
  it("removes script tags from SVG", () => {
    const dirty = '<svg><script>alert("xss")</script><rect width="100"/></svg>';
    const clean = DOMPurify.sanitize(dirty, { USE_PROFILES: { svg: true } });
    expect(clean).not.toContain("<script>");
    expect(clean).toContain("<rect");
  });

  it("removes onload handlers from SVG", () => {
    const dirty = '<svg onload="alert(1)"><rect width="100"/></svg>';
    const clean = DOMPurify.sanitize(dirty, { USE_PROFILES: { svg: true } });
    expect(clean).not.toContain("onload");
  });

  it("removes onerror handlers", () => {
    const dirty = '<svg><image onerror="alert(1)" href="x"/></svg>';
    const clean = DOMPurify.sanitize(dirty, { USE_PROFILES: { svg: true } });
    expect(clean).not.toContain("onerror");
  });

  it("removes javascript: URIs", () => {
    const dirty = '<svg><a href="javascript:alert(1)"><text>click</text></a></svg>';
    const clean = DOMPurify.sanitize(dirty, { USE_PROFILES: { svg: true } });
    expect(clean).not.toContain("javascript:");
  });

  it("preserves valid SVG content", () => {
    const valid = '<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="blue"/><text x="50" y="50">Hello</text></svg>';
    const clean = DOMPurify.sanitize(valid, { USE_PROFILES: { svg: true } });
    expect(clean).toContain("rect");
    expect(clean).toContain("Hello");
    expect(clean).toContain('fill="blue"');
  });
});

describe("IPC Payload Validation", () => {
  // Test the validation helper we'll create
  const validatePayload = (schema, data) => {
    for (const [key, type] of Object.entries(schema)) {
      if (type === "required" && (data[key] === undefined || data[key] === null || data[key] === "")) return false;
      if (type === "string" && typeof data[key] !== "string") return false;
      if (type === "object" && typeof data[key] !== "object") return false;
    }
    return true;
  };

  it("rejects missing required fields", () => {
    expect(validatePayload({ name: "required" }, {})).toBe(false);
    expect(validatePayload({ name: "required" }, { name: "" })).toBe(false);
  });

  it("accepts valid payloads", () => {
    expect(validatePayload({ name: "required" }, { name: "test" })).toBe(true);
  });

  it("rejects wrong types", () => {
    expect(validatePayload({ name: "string" }, { name: 123 })).toBe(false);
  });

  it("accepts correct types", () => {
    expect(validatePayload({ name: "string", doc: "object" }, { name: "test", doc: {} })).toBe(true);
  });
});
