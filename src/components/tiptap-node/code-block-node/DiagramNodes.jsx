/**
 * Custom React Flow node components for different shapes.
 */

import { Handle, Position } from "@xyflow/react";
import "./diagram-nodes.scss";

function BaseNode({ data, selected, className, children }) {
  return (
    <div className={`diagram-node ${className} ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Top} />
      {children || <span>{data?.label || ""}</span>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export function RectNode({ data, selected }) {
  return <BaseNode data={data} selected={selected} className="dn-rect" />;
}

export function RoundedNode({ data, selected }) {
  return <BaseNode data={data} selected={selected} className="dn-rounded" />;
}

export function DiamondNode({ data, selected }) {
  const color = selected ? "#ff9500" : "#ff9500";
  return (
    <div className={`diagram-node dn-diamond ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Top} />
      <svg className="dn-diamond-bg" viewBox="0 0 120 80" preserveAspectRatio="none">
        <polygon points="60,2 118,40 60,78 2,40" fill="var(--dn-bg)" stroke={color} strokeWidth="2" />
      </svg>
      <span className="dn-diamond-label">{data?.label || ""}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export function CircleNode({ data, selected }) {
  return <BaseNode data={data} selected={selected} className="dn-circle" />;
}

export const nodeTypes = {
  rect: RectNode,
  rounded: RoundedNode,
  diamond: DiamondNode,
  circle: CircleNode,
  default: RectNode,
};
