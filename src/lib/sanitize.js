/**
 * sanitize.js
 * Centralized SVG/HTML sanitization with DOMPurify.
 * Configured to preserve Mermaid's foreignObject + div/span for text labels.
 */

import DOMPurify from "dompurify";

// Mermaid uses foreignObject with nested HTML (div/span) for node labels.
// DOMPurify strips foreignObject by default — we need to allow it.
const SVG_CONFIG = {
  USE_PROFILES: { svg: true, svgFilters: true },
  ADD_TAGS: ["foreignObject"],
  ADD_ATTR: ["xmlns", "dominant-baseline", "marker-end", "marker-start"],
};

/**
 * Sanitize SVG string — safe for dangerouslySetInnerHTML.
 * Removes: script, event handlers (onload, onerror), javascript: URIs.
 * Preserves: all SVG elements, foreignObject, Mermaid text labels.
 */
export function sanitizeSvg(svgString) {
  if (!svgString) return "";
  return DOMPurify.sanitize(svgString, SVG_CONFIG);
}
