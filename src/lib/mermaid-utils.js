/**
 * mermaid-utils.js
 * Utilidades puras para detección y sanitización de código Mermaid.
 * Sin dependencias de React ni del DOM.
 */

const MERMAID_KEYWORDS = [
  "graph", "flowchart", "sequenceDiagram", "classDiagram",
  "erDiagram", "gantt", "pie", "stateDiagram", "stateDiagram-v2",
  "gitGraph", "journey", "quadrantChart", "requirementDiagram",
  "mindmap", "timeline", "xychart-beta", "block-beta",
];

/**
 * Detecta si un string de código corresponde a un diagrama Mermaid.
 */
export function isMermaidCode(code = "") {
  if (!code.trim()) return false;
  const firstLine = code.trim().split("\n")[0].trim().toLowerCase();
  return MERMAID_KEYWORDS.some((kw) => firstLine.startsWith(kw.toLowerCase()));
}

/**
 * Sanitiza el código Mermaid eliminando tags HTML potencialmente peligrosos,
 * preservando el contenido de texto y caracteres unicode.
 */
export function sanitizeMermaidCode(code = "") {
  if (!code) return "";
  // Elimina solo tags HTML (< seguido de letra o /) preservando el resto
  return code.replace(/<\/?[a-zA-Z][^>]*>/g, "");
}
