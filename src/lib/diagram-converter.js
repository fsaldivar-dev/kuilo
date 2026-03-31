/**
 * diagram-converter.js
 * Bidirectional conversion: Mermaid flowchart ↔ React Flow nodes/edges.
 *
 * Supported Mermaid subset:
 *   flowchart TD|LR
 *   A["text"]     → rect
 *   A("text")     → rounded
 *   A{"text"}     → diamond
 *   A(("text"))   → circle
 *   A --> B       → edge
 *   A -->|"label"| B → labeled edge
 */

// ── flowToMermaid ────────────────────────────────────────────────────────────

const SHAPE_MAP = {
  rect:    (id, label) => `${id}["${label}"]`,
  rounded: (id, label) => `${id}("${label}")`,
  diamond: (id, label) => `${id}{"${label}"}`,
  circle:  (id, label) => `${id}(("${label}"))`,
};

export function flowToMermaid(nodes = [], edges = [], direction = "TD") {
  const lines = [`flowchart ${direction}`];

  for (const node of nodes) {
    const shape = SHAPE_MAP[node.type] || SHAPE_MAP.rect;
    lines.push(`    ${shape(node.id, node.data?.label || node.id)}`);
  }

  for (const edge of edges) {
    if (edge.label) {
      lines.push(`    ${edge.source} -->|"${edge.label}"| ${edge.target}`);
    } else {
      lines.push(`    ${edge.source} --> ${edge.target}`);
    }
  }

  return lines.join("\n");
}

// ── mermaidToFlow ────────────────────────────────────────────────────────────

// Parse node definition: A["text"], A("text"), A{"text"}, A(("text")), A[text]
const NODE_PATTERNS = [
  { regex: /^(\w+)\(\("([^"]*?)"\)\)/, type: "circle" },
  { regex: /^(\w+)\(\(([^)]*?)\)\)/,  type: "circle" },
  { regex: /^(\w+)\{"([^"]*?)"\}/,     type: "diamond" },
  { regex: /^(\w+)\{([^}]*?)\}/,       type: "diamond" },
  { regex: /^(\w+)\("([^"]*?)"\)/,     type: "rounded" },
  { regex: /^(\w+)\(([^)]*?)\)/,       type: "rounded" },
  { regex: /^(\w+)\["([^"]*?)"\]/,     type: "rect" },
  { regex: /^(\w+)\[([^\]]*?)\]/,      type: "rect" },
];

// Parse edge: A --> B, A -->|"label"| B, A -->|label| B
const EDGE_REGEX = /^(\w+)\s*-->\|?"?([^"|]*?)"?\|?\s*(\w+)(.*)$/;
const EDGE_SIMPLE_REGEX = /^(\w+)\s*-->\s*(\w+)(.*)$/;

function parseNode(segment) {
  const trimmed = segment.trim();
  for (const { regex, type } of NODE_PATTERNS) {
    const match = trimmed.match(regex);
    if (match) return { id: match[1], label: match[2], type };
  }
  // Plain ID without shape
  const plainMatch = trimmed.match(/^(\w+)$/);
  if (plainMatch) return { id: plainMatch[1], label: plainMatch[1], type: "rect" };
  return null;
}

export function mermaidToFlow(mermaid = "") {
  const lines = mermaid.split("\n").map(l => l.trim()).filter(Boolean);
  const nodesMap = new Map();
  const edges = [];
  let direction = "TD";

  // Parse header
  const headerMatch = lines[0]?.match(/^flowchart\s+(TD|TB|LR|RL|BT)/i);
  if (headerMatch) direction = headerMatch[1].toUpperCase();

  // Layout positioning
  let col = 0;

  const ensureNode = (id, label, type) => {
    if (nodesMap.has(id)) {
      // Update label/type if we get more info
      const existing = nodesMap.get(id);
      if (label && label !== id) existing.data.label = label;
      if (type && type !== "rect") existing.type = type;
      return;
    }
    nodesMap.set(id, {
      id,
      type: type || "rect",
      data: { label: label || id },
      position: { x: (col % 4) * 200, y: Math.floor(col / 4) * 120 },
    });
    col++;
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Try edge with label: A -->|"label"| B or A -->|label| B
    const edgeLabelMatch = line.match(/^(\w+)(?:\[.*?\]|\(.*?\)|\{.*?\})?\s*-->\|"?([^"|]*?)"?\|\s*(.+)$/);
    if (edgeLabelMatch) {
      const sourceId = edgeLabelMatch[1];
      const label = edgeLabelMatch[2];
      const targetSegment = edgeLabelMatch[3];
      // Parse source shape if defined on this line
      const fullSrc = line.match(/^(\w+(?:\[.*?\]|\(.*?\)|\{.*?\})?)\s*-->/);
      if (fullSrc) { const s = parseNode(fullSrc[1]); if (s) ensureNode(s.id, s.label, s.type); }

      // Parse target node (might have shape definition)
      const targetNode = parseNode(targetSegment);
      if (targetNode) {
        ensureNode(sourceId, null, null);
        ensureNode(targetNode.id, targetNode.label, targetNode.type);
        edges.push({
          id: `e${edges.length}`,
          source: sourceId,
          target: targetNode.id,
          label,
        });
      }
      continue;
    }

    // Try simple edge: A --> B[text] or A --> B
    // Also handle: A["Source"] --> B["Target"] (source has shape def too)
    const edgeMatch = line.match(/^(\w+)(?:\[.*?\]|\(.*?\)|\{.*?\})?\s*-->\s*(.+)$/);
    if (edgeMatch) {
      // Re-parse source in case it has a shape def on this line
      const fullSource = line.match(/^(\w+(?:\[.*?\]|\(.*?\)|\{.*?\})?)\s*-->/);
      if (fullSource) {
        const srcNode = parseNode(fullSource[1]);
        if (srcNode) ensureNode(srcNode.id, srcNode.label, srcNode.type);
      }
      const sourceId = edgeMatch[1];
      const targetSegment = edgeMatch[2].trim();
      const targetNode = parseNode(targetSegment);
      if (targetNode) {
        ensureNode(sourceId, null, null);
        ensureNode(targetNode.id, targetNode.label, targetNode.type);
        edges.push({
          id: `e${edges.length}`,
          source: sourceId,
          target: targetNode.id,
        });
      }
      continue;
    }

    // Try standalone node definition
    const node = parseNode(line);
    if (node) {
      ensureNode(node.id, node.label, node.type);
    }
  }

  // Auto-layout: simple top-down based on edges
  const nodes = [...nodesMap.values()];
  autoLayout(nodes, edges, direction);

  return { nodes, edges, direction };
}

// ── Auto-layout ──────────────────────────────────────────────────────────────

function autoLayout(nodes, edges, direction = "TD") {
  if (!nodes.length) return;

  // Build adjacency: find levels by BFS from roots
  const children = new Map();
  const parents = new Map();

  for (const edge of edges) {
    if (!children.has(edge.source)) children.set(edge.source, []);
    children.get(edge.source).push(edge.target);
    if (!parents.has(edge.target)) parents.set(edge.target, []);
    parents.get(edge.target).push(edge.source);
  }

  // Roots = nodes with no parents
  const roots = nodes.filter(n => !parents.has(n.id)).map(n => n.id);
  if (!roots.length && nodes.length) roots.push(nodes[0].id);

  const levels = new Map();
  const visited = new Set();
  const queue = roots.map(id => ({ id, level: 0 }));

  while (queue.length) {
    const { id, level } = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    levels.set(id, level);
    for (const child of (children.get(id) || [])) {
      queue.push({ id: child, level: level + 1 });
    }
  }

  // Assign positions not covered by BFS
  for (const node of nodes) {
    if (!levels.has(node.id)) levels.set(node.id, 0);
  }

  // Group by level
  const byLevel = new Map();
  for (const [id, level] of levels) {
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level).push(id);
  }

  const isHorizontal = direction === "LR" || direction === "RL";
  const spacing = { x: isHorizontal ? 220 : 180, y: isHorizontal ? 100 : 120 };

  for (const [level, ids] of byLevel) {
    ids.forEach((id, idx) => {
      const node = nodes.find(n => n.id === id);
      if (!node) return;
      const offset = (idx - (ids.length - 1) / 2);
      if (isHorizontal) {
        node.position = { x: level * spacing.x, y: offset * spacing.y + 200 };
      } else {
        node.position = { x: offset * spacing.x + 400, y: level * spacing.y };
      }
    });
  }
}
