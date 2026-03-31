/**
 * chart-to-mermaid.js
 * Converts chart block attrs to Mermaid syntax.
 *
 * Mermaid supports:
 *   - pie chart: `pie title "..." "A": 10 "B": 20`
 *   - xychart (bar/line): `xychart-beta ...`
 */

export function chartToMermaid(attrs) {
  const data = safeParse(attrs.data);
  const xKey = attrs.xKey || "name";
  const yKey = attrs.yKey || "value";
  const title = attrs.title || "";

  if (!data.length) return "pie\n    title Sin datos";

  if (attrs.chartType === "pie") {
    const lines = data.map((d) => `    "${d[xKey] || ""}" : ${d[yKey] || 0}`);
    return `pie${title ? ` title ${title}` : ""}\n${lines.join("\n")}`;
  }

  // bar, line, area → xychart-beta
  const labels = data.map((d) => `"${d[xKey] || ""}"`).join(", ");
  const values = data.map((d) => d[yKey] || 0).join(", ");
  const chartCmd = attrs.chartType === "line" ? "line" : "bar";

  return [
    `xychart-beta${title ? `\n    title "${title}"` : ""}`,
    `    x-axis [${labels}]`,
    `    y-axis "Valor"`,
    `    ${chartCmd} [${values}]`,
  ].join("\n");
}

function safeParse(val) {
  try { return JSON.parse(val || "[]"); } catch { return []; }
}
