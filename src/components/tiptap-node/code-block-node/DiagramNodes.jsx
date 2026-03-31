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
  return (
    <div className={`diagram-node dn-diamond-wrapper ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Top} />
      <div className="dn-diamond-shape">
        <span>{data?.label || ""}</span>
      </div>
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
