/**
 * DiagramEditor — fullscreen visual editor for all Mermaid diagram types.
 * Opens as a portal overlay. Edits sync back to mermaid code on close.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ReactFlow, Background, Controls, MiniMap, Panel,
  addEdge, useNodesState, useEdgesState, MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { mermaidToFlow, flowToMermaid } from "@/lib/diagram-converter";
import { X, Trash2 } from "lucide-react";
import { nodeTypes } from "./DiagramNodes";
import "./diagram-editor.scss";

const SHAPES = [
  { type: "rect",    label: "Rectángulo", icon: "▭" },
  { type: "rounded", label: "Redondeado", icon: "▢" },
  { type: "diamond", label: "Decisión",   icon: "◇" },
  { type: "circle",  label: "Círculo",    icon: "○" },
];

const DIAGRAM_TYPES = [
  { value: "flowchart TD", label: "Flowchart ↓" },
  { value: "flowchart LR", label: "Flowchart →" },
  { value: "stateDiagram-v2", label: "State Diagram" },
  { value: "classDiagram", label: "Class Diagram" },
  { value: "erDiagram", label: "ER Diagram" },
  { value: "mindmap", label: "Mindmap" },
];

const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { strokeWidth: 2 },
};

let nodeIdCounter = 0;

export function DiagramEditor({ code, isDark, onSave, onClose }) {
  const initial = useMemo(() => mermaidToFlow(code || "flowchart TD"), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [diagramType, setDiagramType] = useState(() => {
    const m = (code || "").match(/^\s*(\S+(?:\s+(?:TD|LR|RL|TB|BT))?)/im);
    return m ? m[1] : "flowchart TD";
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);

  // ── Actions ──

  const onConnect = useCallback((connection) => {
    setEdges((eds) => addEdge({ ...connection, ...defaultEdgeOptions }, eds));
  }, [setEdges]);

  const addNode = useCallback((type = "rect") => {
    const id = `n${++nodeIdCounter}_${Date.now().toString(36)}`;
    setNodes((nds) => [...nds, {
      id, type,
      data: { label: "Nuevo" },
      position: { x: 200 + Math.random() * 300, y: 100 + Math.random() * 300 },
    }]);
  }, [setNodes]);

  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setNodes, setEdges]);

  const updateNodeLabel = useCallback((id, label) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label } } : n));
  }, [setNodes]);

  const updateNodeType = useCallback((id, type) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, type } : n));
  }, [setNodes]);

  const updateEdgeLabel = useCallback((id, label) => {
    setEdges((eds) => eds.map((e) => e.id === id ? { ...e, label: label || undefined } : e));
  }, [setEdges]);

  const handleSave = useCallback(() => {
    const dir = diagramType.includes(" ") ? diagramType.split(" ")[1] : "TD";
    const mermaid = flowToMermaid(nodes, edges, dir);
    // Prepend the diagram type header if not flowchart
    const header = diagramType.startsWith("flowchart") ? "" : diagramType + "\n";
    onSave(header ? `${diagramType}\n${mermaid.split("\n").slice(1).join("\n")}` : mermaid);
    onClose();
  }, [nodes, edges, diagramType, onSave, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") { handleSave(); return; }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (document.activeElement?.tagName === "INPUT") return;
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, deleteSelected]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((_, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  return createPortal(
    <div className="diagram-editor-overlay">
      <div className="diagram-editor-container" data-theme={isDark ? "dark" : "light"}>

        {/* ── Top bar ── */}
        <div className="de-topbar">
          <div className="de-topbar-left">
            <select
              className="de-select"
              value={diagramType}
              onChange={(e) => setDiagramType(e.target.value)}
            >
              {DIAGRAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="de-topbar-center">
            {SHAPES.map((s) => (
              <button key={s.type} className="de-shape-btn" onClick={() => addNode(s.type)} title={s.label}>
                <span className="de-shape-icon">{s.icon}</span>
                <span className="de-shape-label">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="de-topbar-right">
            <button className="de-action-btn danger" onClick={deleteSelected} title="Eliminar seleccionado">
              <Trash2 size={14} />
            </button>
            <button className="de-action-btn primary" onClick={handleSave} title="Guardar y cerrar (Esc)">
              Guardar
            </button>
            <button className="de-action-btn" onClick={onClose} title="Cerrar sin guardar">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Canvas ── */}
        <div className="de-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            defaultEdgeOptions={defaultEdgeOptions}
            nodeTypes={nodeTypes}
            fitView
            colorMode={isDark ? "dark" : "light"}
          >
            <Background gap={20} size={1} />
            <Controls />
            <MiniMap pannable zoomable style={{ height: 80, width: 120 }} />
          </ReactFlow>
        </div>

        {/* ── Properties panel ── */}
        {(selectedNode || selectedEdge) && (
          <div className="de-properties">
            {selectedNode && (
              <>
                <h4>Nodo</h4>
                <label>
                  <span>Texto</span>
                  <input
                    value={selectedNode.data.label}
                    onChange={(e) => {
                      updateNodeLabel(selectedNode.id, e.target.value);
                      setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label: e.target.value } });
                    }}
                    autoFocus
                  />
                </label>
                <label>
                  <span>Forma</span>
                  <select
                    value={selectedNode.type || "rect"}
                    onChange={(e) => {
                      updateNodeType(selectedNode.id, e.target.value);
                      setSelectedNode({ ...selectedNode, type: e.target.value });
                    }}
                  >
                    {SHAPES.map((s) => <option key={s.type} value={s.type}>{s.icon} {s.label}</option>)}
                  </select>
                </label>
              </>
            )}
            {selectedEdge && (
              <>
                <h4>Conexión</h4>
                <label>
                  <span>Etiqueta</span>
                  <input
                    value={selectedEdge.label || ""}
                    onChange={(e) => {
                      updateEdgeLabel(selectedEdge.id, e.target.value);
                      setSelectedEdge({ ...selectedEdge, label: e.target.value });
                    }}
                    placeholder="Texto de la flecha"
                    autoFocus
                  />
                </label>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
