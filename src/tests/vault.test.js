/**
 * Tests — Sprint 3.1 Vault
 * Lógica de resolución de rutas cuando el vault es configurable
 */

import { describe, it, expect } from "vitest";
import path from "path";
import {
  resolvePackageDir,
  resolveVaultRoot,
  normalizeVaultPath,
} from "@/lib/vault";

const FIXED_VAULT = "/tmp/test-vault";
const DEFAULT_ROOT = path.resolve(process.cwd(), "docs");

// ─── resolveVaultRoot ─────────────────────────────────────────────────────────

describe("resolveVaultRoot", () => {
  it("devuelve el vault configurado cuando existe", () => {
    expect(resolveVaultRoot(FIXED_VAULT)).toBe(FIXED_VAULT);
  });

  it("devuelve el default docs/ cuando no hay vault configurado", () => {
    expect(resolveVaultRoot(null)).toBe(DEFAULT_ROOT);
    expect(resolveVaultRoot(undefined)).toBe(DEFAULT_ROOT);
    expect(resolveVaultRoot("")).toBe(DEFAULT_ROOT);
  });
});

// ─── resolvePackageDir ────────────────────────────────────────────────────────

describe("resolvePackageDir", () => {
  it("root package (__root__) → retorna el vault root", () => {
    const dir = resolvePackageDir(FIXED_VAULT, "__root__");
    expect(dir).toBe(FIXED_VAULT);
  });

  it("package nombrado → subcarpeta del vault", () => {
    const dir = resolvePackageDir(FIXED_VAULT, "knowledge");
    expect(dir).toBe(path.join(FIXED_VAULT, "knowledge"));
  });

  it("no permite path traversal (..)", () => {
    const dir = resolvePackageDir(FIXED_VAULT, "../evil");
    // La ruta resuelta debe permanecer dentro del vault
    expect(dir.startsWith(FIXED_VAULT)).toBe(true);
  });
});

// ─── normalizeVaultPath ───────────────────────────────────────────────────────

describe("normalizeVaultPath", () => {
  it("normaliza slashes", () => {
    const result = normalizeVaultPath("/some//path//to/vault");
    expect(result).not.toContain("//");
  });

  it("elimina trailing slash", () => {
    expect(normalizeVaultPath("/some/path/")).toBe("/some/path");
  });

  it("devuelve null para string vacío", () => {
    expect(normalizeVaultPath("")).toBeNull();
    expect(normalizeVaultPath(null)).toBeNull();
  });

  it("conserva ruta absoluta válida", () => {
    const input = "/Users/fsaldivar/Documents/SajaruBoxApp/sajarubox-mcp";
    expect(normalizeVaultPath(input)).toBe(input);
  });
});
