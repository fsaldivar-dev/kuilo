/**
 * mermaid-controls.js
 * Lógica pura de zoom y pan para el preview de Mermaid.
 */

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;

export function clampScale(value) {
  const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));
  return Math.round(clamped * 100) / 100;
}

/**
 * Calcula los límites de desplazamiento (pan) dado el tamaño del contenedor,
 * del contenido y el zoom actual.
 */
export function computePanBounds({ containerW, containerH, contentW, contentH, scale }) {
  const scaledW = contentW * scale;
  const scaledH = contentH * scale;
  const maxX = Math.max(0, (scaledW - containerW) / 2);
  const maxY = Math.max(0, (scaledH - containerH) / 2);
  return { minX: -maxX, maxX, minY: -maxY, maxY };
}
