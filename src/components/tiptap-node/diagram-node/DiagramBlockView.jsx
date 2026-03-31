/**
 * React NodeView for visual diagram editing.
 * Selected → React Flow editor. Unselected → Mermaid preview.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { mermaidToFlow, flowToMermaid } from "@/lib/diagram-converter";
import { MermaidPreview } from "@/components/tiptap-node/code-block-node/MermaidPreview";
import "./diagram-node.scss";

const NODE_TYPES_CONFIG = [
  { type: "rect", label: "Rectángulo", symbol: "[ ]" },
  { type: "rounded", label: "Redondeado", symbol: "( )" },
  { type: "diamond", label: "Diamante", symbol: "{ }" },
  { type: "circle", label: "Círculo", symbol: "(( ))" },
];

const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { strokeWidth: 2 },
};

export function DiagramBlockView({ node, updateAttributes, selected }) {
  const mermaidCode = node.attrs.mermaid || "";
  const direction = node.attrs.direction || "TD";

  // Parse mermaid → React Flow on mount
  const initial = useMemo(() => mermaidToFlow(mermaidCode), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [dir, setDir] = useState(direction);

  // Sync React Flow → Mermaid on changes
  const syncToMermaid = useCallback(() => {
    const mermaid = flowToMermaid(nodes, edges, dir);
    updateAttributes({ mermaid, direction: dir });
  }, [nodes, edges, dir, updateAttributes]);

  useEffect(() => {
    if (selected) syncToMermaid();
  }, [nodes, edges, dir]); // eslint-disable-line react-hooks/exhaustive-deps

  const onConnect = useCallback((connection) => {
    setEdges((eds) => addEdge({ ...connection, ...defaultEdgeOptions }, eds));
  }, [setEdges]);

  // Add new node
  const addNode = useCallback((type = "rect") => {
    const id = `n${Date.now().toString(36)}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type,
        data: { label: "Nuevo" },
        position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      },
    ]);
  }, [setNodes]);

  // Edit node label
  const onNodeDoubleClick = useCallback((_, node) => {
    const label = prompt("Texto del nodo:", node.data.label);
    if (label !== null) {
      setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, label } } : n));
    }
  }, [setNodes]);

  // Edit edge label
  const onEdgeDoubleClick = useCallback((_, edge) => {
    const label = prompt("Etiqueta de la conexión:", edge.label || "");
    if (label !== null) {
      setEdges((eds) => eds.map((e) => e.id === edge.id ? { ...e, label: label || undefined } : e));
    }
  }, [setEdges]);

  // Delete selected
  const onKeyDown = useCallback((e) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      setNodes((nds) => nds.filter((n) => !n.selected));
      setEdges((eds) => eds.filter((e) => !e.selected));
    }
  }, [setNodes, setEdges]);

  const isDark = document.documentElement.classList.contains("dark");

  // ── Read-only: Mermaid preview ──
  if (!selected) {
    return (
      <NodeViewWrapper className="diagram-block" contentEditable={false}>
        <MermaidPreview code={mermaidCode} isDark={isDark} />
      </NodeViewWrapper>
    );
  }

  // ── Editing: React Flow ──
  return (
    <NodeViewWrapper className="diagram-block editing" contentEditable={false}>
      {/* Toolbar */}
      <div className="diagram-toolbar">
        <span className="diagram-toolbar-label">Diagrama visual</span>
        <div className="diagram-toolbar-actions">
          {NODE_TYPES_CONFIG.map(({ type, label, symbol }) => (
            <button key={type} className="diagram-add-btn" onClick={() => addNode(type)} title={`Agregar ${label}`}>
              {symbol}
            </button>
          ))}
          <select className="diagram-dir-select" value={dir} onChange={(e) => setDir(e.target.value)}>
            <option value="TD">↓ Top-Down</option>
            <option value="LR">→ Left-Right</option>
          </select>
        </div>
      </div>

      {/* Canvas */}
      <div className="diagram-canvas" onKeyDown={onKeyDown} tabIndex={0}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          colorMode={isDark ? "dark" : "light"}
        >
          <Background gap={16} size={1} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable style={{ height: 60, width: 100 }} />
        </ReactFlow>
      </div>
    </NodeViewWrapper>
  );
}
