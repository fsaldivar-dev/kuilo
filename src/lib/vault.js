/**
 * vault.js
 * Lógica pura de resolución de rutas del vault — sin dependencias de Electron.
 * Usada tanto en el renderer (tests) como referenciada desde main.cjs.
 */

import path from "path";

const DEFAULT_VAULT = path.resolve(process.cwd(), "docs");
const ROOT_PACKAGE_ID = "__root__";

/**
 * Devuelve el vault root activo.
 * @param {string|null} configuredPath  — ruta guardada en settings
 * @returns {string}
 */
export function resolveVaultRoot(configuredPath) {
  if (configuredPath && typeof configuredPath === "string" && configuredPath.trim()) {
    return configuredPath.trim();
  }
  return DEFAULT_VAULT;
}

/**
 * Resuelve el directorio de un package dentro del vault.
 * Previene path traversal asegurando que el resultado quede dentro del vault.
 * @param {string} vaultRoot
 * @param {string} packageName
 * @returns {string}
 */
export function resolvePackageDir(vaultRoot, packageName) {
  if (packageName === ROOT_PACKAGE_ID) return vaultRoot;

  // Normaliza y previene traversal
  const safe = packageName.replace(/\.\./g, "").replace(/\/+/g, "/").replace(/^\//, "");
  const resolved = path.join(vaultRoot, safe);

  // Garantiza que queda dentro del vault
  if (!resolved.startsWith(vaultRoot)) return vaultRoot;
  return resolved;
}

/**
 * Normaliza una ruta de vault: elimina trailing slash, slashes dobles.
 * @param {string|null} vaultPath
 * @returns {string|null}
 */
export function normalizeVaultPath(vaultPath) {
  if (!vaultPath || typeof vaultPath !== "string" || !vaultPath.trim()) return null;
  return path.normalize(vaultPath).replace(/\/$/, "");
}
