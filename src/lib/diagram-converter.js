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
  if (!lines.length) return { nodes: [], edges: [], direction: "TD" };

  const firstLine = lines[0].toLowerCase();

  // Delegate to specialized parsers
  if (firstLine.startsWith("statediagram")) return parseStateDiagram(lines);
  if (firstLine.startsWith("classdiagram")) return parseClassDiagram(lines);
  if (firstLine.startsWith("erdiagram")) return parseERDiagram(lines);
  if (firstLine.startsWith("mindmap")) return parseMindmap(mermaid);
  if (firstLine.startsWith("sequencediagram")) return parseSequenceDiagram(lines);
  if (firstLine.startsWith("gantt")) return parseGantt(lines);
  if (firstLine.startsWith("pie")) return parsePie(lines);
  if (firstLine.startsWith("journey")) return parseJourney(lines);
  if (firstLine.startsWith("timeline")) return parseTimeline(lines);
  if (firstLine.startsWith("gitgraph")) return parseGitGraph(lines);
  if (firstLine.startsWith("c4")) return parseGenericLines(lines, "LR");
  if (firstLine.startsWith("block")) return parseGenericLines(lines, "TD");
  if (firstLine.startsWith("requirement")) return parseGenericLines(lines, "LR");

  // Default: flowchart parser
  const nodesMap = new Map();
  const edges = [];
  let direction = "TD";

  const headerMatch = lines[0]?.match(/^(?:flowchart|graph)\s+(TD|TB|LR|RL|BT)/i);
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

// ── State Diagram parser ─────────────────────────────────────────────────────
// stateDiagram-v2
//   [*] --> Idle
//   Idle --> Processing : start
//   Processing --> Done : complete

function parseStateDiagram(lines) {
  const nodesMap = new Map();
  const edges = [];

  const ensure = (id) => {
    if (nodesMap.has(id)) return;
    const isStart = id === "[*]";
    nodesMap.set(id, {
      id: id.replace(/[[\]*]/g, "_star_"),
      type: isStart ? "circle" : "rounded",
      data: { label: isStart ? "●" : id },
      position: { x: 0, y: 0 },
    });
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // State --> State : label
    const m = line.match(/^(\S+)\s*-->\s*(\S+)\s*(?::\s*(.+))?$/);
    if (m) {
      ensure(m[1]); ensure(m[2]);
      const srcId = m[1].replace(/[[\]*]/g, "_star_");
      const tgtId = m[2].replace(/[[\]*]/g, "_star_");
      edges.push({ id: `e${edges.length}`, source: srcId, target: tgtId, label: m[3] || undefined });
    }
  }

  const nodes = [...nodesMap.values()];
  autoLayout(nodes, edges, "TD");
  return { nodes, edges, direction: "TD" };
}

// ── Class Diagram parser ─────────────────────────────────────────────────────
// classDiagram
//   Animal <|-- Duck
//   Animal : +int age
//   class Duck { +String beakColor; +swim(); }

function parseClassDiagram(lines) {
  const nodesMap = new Map();
  const edges = [];

  const ensure = (id) => {
    if (nodesMap.has(id)) return;
    nodesMap.set(id, { id, type: "rect", data: { label: id }, position: { x: 0, y: 0 } });
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Inheritance: A <|-- B, A *-- B, A o-- B, A --> B
    const rel = line.match(/^(\w+)\s*(<\|--|<\.\.|\*--|o--|-->|-->\s)\s*(\w+)(?:\s*:\s*(.+))?$/);
    if (rel) {
      ensure(rel[1]); ensure(rel[3]);
      edges.push({ id: `e${edges.length}`, source: rel[1], target: rel[3], label: rel[4] || undefined });
      continue;
    }
    // Class attribute: ClassName : +method()
    const attr = line.match(/^(\w+)\s*:\s*(.+)$/);
    if (attr) {
      ensure(attr[1]);
      const node = nodesMap.get(attr[1]);
      node.data.label = `${attr[1]}\n${attr[2]}`;
      continue;
    }
    // class ClassName { ... } — just capture the name
    const cls = line.match(/^class\s+(\w+)/);
    if (cls) ensure(cls[1]);
  }

  const nodes = [...nodesMap.values()];
  autoLayout(nodes, edges, "TD");
  return { nodes, edges, direction: "TD" };
}

// ── ER Diagram parser ────────────────────────────────────────────────────────
// erDiagram
//   CUSTOMER ||--o{ ORDER : places
//   ORDER ||--|{ LINE-ITEM : contains

function parseERDiagram(lines) {
  const nodesMap = new Map();
  const edges = [];

  const ensure = (id) => {
    if (nodesMap.has(id)) return;
    nodesMap.set(id, { id, type: "rect", data: { label: id }, position: { x: 0, y: 0 } });
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // ENTITY1 ||--o{ ENTITY2 : label
    const m = line.match(/^(\S+)\s+(\|[|o}{\s\-]+)\s+(\S+)\s*(?::\s*(.+))?$/);
    if (m) {
      ensure(m[1]); ensure(m[3]);
      edges.push({ id: `e${edges.length}`, source: m[1], target: m[3], label: m[4] || undefined });
      continue;
    }
    // Entity attributes block: ENTITY { type name }
    const entityMatch = line.match(/^(\w[\w-]*)\s*\{/);
    if (entityMatch) ensure(entityMatch[1]);
  }

  const nodes = [...nodesMap.values()];
  autoLayout(nodes, edges, "LR");
  return { nodes, edges, direction: "LR" };
}

// ── Mindmap parser ───────────────────────────────────────────────────────────
// mindmap
//   root((Central))
//     Topic A
//       Sub A1
//     Topic B

function parseMindmap(rawMermaid) {
  const nodes = [];
  const edges = [];
  const stack = [];
  const rawLines = rawMermaid.split("\n");

  for (let i = 1; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const match = raw.match(/^(\s*)(.*)/);
    if (!match || !match[2]) continue;

    const indent = match[1].length;
    let text = match[2].trim();
    const id = `mm${i}`;

    // Parse shape: root((text)), Topic(text), [text], etc.
    let type = "rounded";
    const shapes = [
      { regex: /^\w+\(\((.+)\)\)$/, type: "circle" },
      { regex: /^\w+\((.+)\)$/, type: "rounded" },
      { regex: /^\[(.+)\]$/, type: "rect" },
    ];
    for (const s of shapes) {
      const sm = text.match(s.regex);
      if (sm) { text = sm[1]; type = s.type; break; }
    }

    nodes.push({ id, type, data: { label: text }, position: { x: 0, y: 0 } });

    // Find parent: last node in stack with smaller indent
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    if (stack.length) {
      edges.push({ id: `e${edges.length}`, source: stack[stack.length - 1].id, target: id });
    }
    stack.push({ id, indent });
  }

  autoLayout(nodes, edges, "LR");
  return { nodes, edges, direction: "LR" };
}

// ── Sequence Diagram parser ──────────────────────────────────────────────────
// sequenceDiagram
//   Alice->>Bob: Hello
//   Bob-->>Alice: Hi

function parseSequenceDiagram(lines) {
  const nodesMap = new Map();
  const edges = [];

  const ensure = (id) => {
    const clean = id.replace(/[^a-zA-Z0-9_]/g, "_");
    if (nodesMap.has(clean)) return clean;
    nodesMap.set(clean, { id: clean, type: "rect", data: { label: id }, position: { x: 0, y: 0 } });
    return clean;
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // participant/actor declarations
    const part = line.match(/^(?:participant|actor)\s+(\w+)(?:\s+as\s+(.+))?$/i);
    if (part) { const id = ensure(part[1]); if (part[2]) nodesMap.get(id).data.label = part[2]; continue; }
    // Messages: A->>B: text, A-->>B: text, A->>+B: text
    const msg = line.match(/^(\S+?)\s*(->>|-->>|->|-->)\+?\s*(\S+?)\s*:\s*(.+)$/);
    if (msg) {
      const src = ensure(msg[1]);
      const tgt = ensure(msg[3]);
      edges.push({ id: `e${edges.length}`, source: src, target: tgt, label: msg[4] });
    }
  }

  const nodes = [...nodesMap.values()];
  // Layout: actors side by side
  nodes.forEach((n, i) => { n.position = { x: i * 200, y: 0 }; });
  // Stagger edges vertically
  edges.forEach((e, i) => { e.data = { yOffset: (i + 1) * 60 }; });

  return { nodes, edges, direction: "LR" };
}

// ── Gantt parser ─────────────────────────────────────────────────────────────
// gantt
//   title Project
//   section Phase 1
//   Task A : a1, 2024-01-01, 30d

function parseGantt(lines) {
  const nodes = [];
  let section = "";

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const secMatch = line.match(/^section\s+(.+)$/i);
    if (secMatch) { section = secMatch[1]; continue; }
    const taskMatch = line.match(/^(.+?)\s*:/);
    if (taskMatch && !line.match(/^title/i) && !line.match(/^dateFormat/i)) {
      const label = section ? `${section} / ${taskMatch[1].trim()}` : taskMatch[1].trim();
      nodes.push({ id: `g${nodes.length}`, type: "rect", data: { label }, position: { x: 0, y: 0 } });
    }
  }

  // Chain tasks sequentially
  const edges = [];
  for (let i = 1; i < nodes.length; i++) {
    edges.push({ id: `e${i}`, source: nodes[i - 1].id, target: nodes[i].id });
  }

  autoLayout(nodes, edges, "LR");
  return { nodes, edges, direction: "LR" };
}

// ── Pie parser ───────────────────────────────────────────────────────────────
// pie title Pets
//   "Dogs" : 40
//   "Cats" : 30

function parsePie(lines) {
  const nodes = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^title/i)) continue;
    const m = line.match(/^\s*"?([^":]+)"?\s*:\s*(\d+)/);
    if (m) {
      nodes.push({
        id: `p${nodes.length}`,
        type: "circle",
        data: { label: `${m[1].trim()} (${m[2]})` },
        position: { x: 0, y: 0 },
      });
    }
  }

  // Radial layout around center
  const cx = 300, cy = 200, r = 150;
  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    n.position = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  return { nodes, edges: [], direction: "TD" };
}

// ── Journey parser ───────────────────────────────────────────────────────────
// journey
//   title My day
//   section Morning
//   Wake up: 5: Me

function parseJourney(lines) {
  const nodes = [];
  const edges = [];
  let section = "";

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^title/i)) continue;
    const secMatch = line.match(/^section\s+(.+)$/i);
    if (secMatch) { section = secMatch[1]; continue; }
    const step = line.match(/^(.+?):\s*(\d+)/);
    if (step) {
      const label = `${step[1].trim()} (${step[2]}/5)`;
      nodes.push({ id: `j${nodes.length}`, type: "rounded", data: { label }, position: { x: 0, y: 0 } });
    }
  }

  for (let i = 1; i < nodes.length; i++) {
    edges.push({ id: `e${i}`, source: nodes[i - 1].id, target: nodes[i].id });
  }

  autoLayout(nodes, edges, "LR");
  return { nodes, edges, direction: "LR" };
}

// ── Timeline parser ──────────────────────────────────────────────────────────
// timeline
//   title History
//   2020 : Event A : Event B
//   2021 : Event C

function parseTimeline(lines) {
  const nodes = [];
  const edges = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^title/i)) continue;
    const m = line.match(/^(.+?)\s*:\s*(.+)$/);
    if (m) {
      const period = m[1].trim();
      const events = m[2].split(":").map(e => e.trim()).filter(Boolean);
      const label = `${period}\n${events.join(", ")}`;
      nodes.push({ id: `t${nodes.length}`, type: "rect", data: { label }, position: { x: 0, y: 0 } });
    }
  }

  for (let i = 1; i < nodes.length; i++) {
    edges.push({ id: `e${i}`, source: nodes[i - 1].id, target: nodes[i].id });
  }

  autoLayout(nodes, edges, "LR");
  return { nodes, edges, direction: "LR" };
}

// ── Git Graph parser ─────────────────────────────────────────────────────────
// gitGraph
//   commit
//   branch develop
//   commit

function parseGitGraph(lines) {
  const nodes = [];
  const edges = [];
  let commitCount = 0;
  let currentBranch = "main";

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const commitMatch = line.match(/^commit(?:\s+id:\s*"?(.+?)"?)?/i);
    if (commitMatch) {
      const id = `c${commitCount++}`;
      const label = commitMatch[1] || `commit ${commitCount}`;
      nodes.push({ id, type: "circle", data: { label: `${currentBranch}\n${label}` }, position: { x: 0, y: 0 } });
      if (nodes.length > 1) edges.push({ id: `e${edges.length}`, source: nodes[nodes.length - 2].id, target: id });
      continue;
    }
    const branchMatch = line.match(/^branch\s+(\S+)/i);
    if (branchMatch) currentBranch = branchMatch[1];
    const mergeMatch = line.match(/^merge\s+(\S+)/i);
    if (mergeMatch) {
      const id = `c${commitCount++}`;
      nodes.push({ id, type: "circle", data: { label: `merge ${mergeMatch[1]}` }, position: { x: 0, y: 0 } });
      if (nodes.length > 1) edges.push({ id: `e${edges.length}`, source: nodes[nodes.length - 2].id, target: id });
    }
  }

  autoLayout(nodes, edges, "LR");
  return { nodes, edges, direction: "LR" };
}

// ── Generic parser (for types with --> relationships) ────────────────────────

function parseGenericLines(lines, dir = "LR") {
  const nodesMap = new Map();
  const edges = [];

  const ensure = (id) => {
    const clean = id.replace(/[^a-zA-Z0-9_]/g, "_");
    if (nodesMap.has(clean)) return clean;
    nodesMap.set(clean, { id: clean, type: "rect", data: { label: id }, position: { x: 0, y: 0 } });
    return clean;
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^(\S+)\s*(?:-->|->|--)\s*(\S+)(?:\s*:\s*(.+))?$/);
    if (m) {
      const src = ensure(m[1]);
      const tgt = ensure(m[2]);
      edges.push({ id: `e${edges.length}`, source: src, target: tgt, label: m[3] || undefined });
    }
  }

  const nodes = [...nodesMap.values()];
  autoLayout(nodes, edges, dir);
  return { nodes, edges, direction: dir };
}
