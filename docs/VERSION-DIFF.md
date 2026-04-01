# Version Diff

Compara visualmente dos versiones de un documento bloque a bloque.

## Uso

1. Abre el panel **Historial** (botón en el header del doc)
2. Click **Comparar** en cualquier versión
3. El diff reemplaza el editor mostrando:
   - **Verde** — bloques agregados (en la versión actual pero no en la anterior)
   - **Rojo** — bloques eliminados (en la anterior pero no en la actual)
   - **Amarillo** — bloques modificados (mismo tipo, contenido diferente)
   - **Gris tenue** — bloques sin cambios
4. Click **Cerrar** para volver al editor

## Algoritmo

Usa LCS (Longest Common Subsequence) sobre los bloques serializados como JSON. O(n*m) — eficiente para documentos típicos (<200 bloques).

Post-procesamiento: `removed` + `added` consecutivos del mismo tipo → `modified`.

## Archivos

- `src/lib/block-diff.js` — lógica pura de diff
- `src/components/workspace/DiffView.jsx` — componente visual
- `src/hooks/use-editor-state.js` — `compareVersion()`, `closeDiff()`
