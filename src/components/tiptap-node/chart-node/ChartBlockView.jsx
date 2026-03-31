/**
 * React NodeView for Chart blocks.
 * Renders Recharts + editable data table.
 */

import { useCallback, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Plus, Trash2 } from "lucide-react";
import "./chart-node.scss";

const CHART_TYPES = ["bar", "line", "area", "pie"];
const COLORS = ["#0071e3", "#34c759", "#ff9500", "#ff3b30", "#af52de", "#5ac8fa", "#ffcc00", "#8e8e93"];

function safeParse(val) {
  try { return JSON.parse(val || "[]"); } catch { return []; }
}

export function ChartBlockView({ node, updateAttributes }) {
  const { chartType, title, xKey, yKey, color } = node.attrs;
  const data = safeParse(node.attrs.data);
  const [editing, setEditing] = useState(false);

  const set = useCallback((key, val) => updateAttributes({ [key]: val }), [updateAttributes]);
  const setData = useCallback((newData) => set("data", JSON.stringify(newData)), [set]);

  const updateRow = (i, field, val) => {
    const next = [...data];
    next[i] = { ...next[i], [field]: field === yKey ? (Number(val) || 0) : val };
    setData(next);
  };

  const addRow = () => setData([...data, { [xKey]: "", [yKey]: 0 }]);
  const removeRow = (i) => setData(data.filter((_, j) => j !== i));

  // ── Render chart ──
  const renderChart = () => {
    if (!data.length) return <div className="chart-empty">Sin datos</div>;

    const commonProps = { data, margin: { top: 5, right: 20, bottom: 5, left: 0 } };

    if (chartType === "pie") {
      return (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={80} label>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    const ChartComponent = chartType === "line" ? LineChart : chartType === "area" ? AreaChart : BarChart;
    const DataComponent = chartType === "line" ? Line : chartType === "area" ? Area : Bar;

    return (
      <ResponsiveContainer width="100%" height={240}>
        <ChartComponent {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <DataComponent
            type="monotone"
            dataKey={yKey}
            fill={color}
            stroke={color}
            fillOpacity={chartType === "area" ? 0.3 : 1}
            strokeWidth={2}
            radius={chartType === "bar" ? [4, 4, 0, 0] : undefined}
          />
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <NodeViewWrapper className="chart-block" contentEditable={false}>
      {/* Header */}
      <div className="chart-header">
        <input
          className="chart-title"
          value={title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Titulo del chart"
        />
        <div className="chart-controls">
          <select
            className="chart-type-select"
            value={chartType}
            onChange={(e) => set("chartType", e.target.value)}
          >
            {CHART_TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <input
            type="color"
            className="chart-color"
            value={color}
            onChange={(e) => set("color", e.target.value)}
            title="Color"
          />
          <button
            className={`chart-edit-btn ${editing ? "active" : ""}`}
            onClick={() => setEditing(!editing)}
          >
            {editing ? "Cerrar" : "Datos"}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-canvas">
        {renderChart()}
      </div>

      {/* Data table (editable) */}
      {editing && (
        <div className="chart-data-table">
          <div className="chart-data-header">
            <span>{xKey}</span>
            <span>{yKey}</span>
            <span></span>
          </div>
          {data.map((row, i) => (
            <div className="chart-data-row" key={i}>
              <input
                value={row[xKey] || ""}
                onChange={(e) => updateRow(i, xKey, e.target.value)}
                placeholder="Label"
              />
              <input
                type="number"
                value={row[yKey] || 0}
                onChange={(e) => updateRow(i, yKey, e.target.value)}
              />
              <button className="chart-remove-btn" onClick={() => removeRow(i)}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button className="chart-add-btn" onClick={addRow}>
            <Plus size={12} /> Agregar fila
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
