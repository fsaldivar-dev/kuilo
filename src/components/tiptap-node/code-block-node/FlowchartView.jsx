/**
 * FlowchartView — renders flowcharts with React Flow, falls back to Mermaid.
 *
 * Flowchart keywords: flowchart, graph
 * Everything else (sequence, ER, gantt, pie, etc.) → Mermaid SVG fallback
 */

import { useCallback, useMemo } from "react";
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
import { MermaidPreview } from "./MermaidPreview";
import "./flowchart-view.scss";

const FLOWCHART_REGEX = /^\s*(flowchart|graph)\s+(TD|TB|LR|RL|BT)/im;

export function isFlowchart(code) {
  return FLOWCHART_REGEX.test(code || "");
}

const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { strokeWidth: 2 },
};

// ── Read-only React Flow view ────────────────────────────────────────────────

export function FlowchartReadOnly({ code, isDark }) {
  const { nodes, edges, direction } = useMemo(() => mermaidToFlow(code), [code]);

  if (!nodes.length) return <MermaidPreview code={code} isDark={isDark} />;

  return (
    <div className="flowchart-readonly">
      <ReactFlow
        nodes={nodes}
        edges={edges.map(e => ({ ...e, ...defaultEdgeOptions }))}
        fitView
        colorMode={isDark ? "dark" : "light"}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
      >
        <Background gap={16} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

// ── Editable React Flow view ─────────────────────────────────────────────────

export function FlowchartEditor({ code, isDark, onCodeChange }) {
  const initial = useMemo(() => mermaidToFlow(code), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const dir = initial.direction || "TD";

  // Sync to mermaid on every change
  const syncCode = useCallback((nextNodes, nextEdges) => {
    const mermaid = flowToMermaid(nextNodes || nodes, nextEdges || edges, dir);
    onCodeChange?.(mermaid);
  }, [nodes, edges, dir, onCodeChange]);

  const onConnect = useCallback((connection) => {
    setEdges((eds) => {
      const next = addEdge({ ...connection, ...defaultEdgeOptions }, eds);
      setTimeout(() => syncCode(nodes, next), 0);
      return next;
    });
  }, [setEdges, syncCode, nodes]);

  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    // Sync after drag end
    const hasDragEnd = changes.some(c => c.type === "position" && c.dragging === false);
    if (hasDragEnd) setTimeout(() => syncCode(), 50);
  }, [onNodesChange, syncCode]);

  const onNodeDoubleClick = useCallback((_, node) => {
    const label = prompt("Texto del nodo:", node.data.label);
    if (label !== null) {
      setNodes((nds) => {
        const next = nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, label } } : n);
        setTimeout(() => syncCode(next, edges), 0);
        return next;
      });
    }
  }, [setNodes, syncCode, edges]);

  const onEdgeDoubleClick = useCallback((_, edge) => {
    const label = prompt("Etiqueta:", edge.label || "");
    if (label !== null) {
      setEdges((eds) => {
        const next = eds.map(e => e.id === edge.id ? { ...e, label: label || undefined } : e);
        setTimeout(() => syncCode(nodes, next), 0);
        return next;
      });
    }
  }, [setEdges, syncCode, nodes]);

  const addNode = useCallback((type = "rect") => {
    const id = `n${Date.now().toString(36)}`;
    setNodes((nds) => {
      const next = [...nds, {
        id, type, data: { label: "Nuevo" },
        position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      }];
      setTimeout(() => syncCode(next, edges), 0);
      return next;
    });
  }, [setNodes, syncCode, edges]);

  return (
    <div className="flowchart-editor">
      <div className="flowchart-toolbar">
        <button className="fc-btn" onClick={() => addNode("rect")} title="Rectángulo">[ ]</button>
        <button className="fc-btn" onClick={() => addNode("rounded")} title="Redondeado">( )</button>
        <button className="fc-btn" onClick={() => addNode("diamond")} title="Diamante">{"{ }"}</button>
        <button className="fc-btn" onClick={() => addNode("circle")} title="Círculo">(( ))</button>
      </div>
      <div className="flowchart-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
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
          <MiniMap pannable zoomable style={{ height: 50, width: 80 }} />
        </ReactFlow>
      </div>
    </div>
  );
}
