import { useCallback } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { Plus, Trash2 } from "lucide-react";
import "./api-endpoint-node.scss";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const METHOD_COLORS = {
  GET: "#34c759", POST: "#0071e3", PUT: "#ff9500",
  PATCH: "#af52de", DELETE: "#ff3b30",
};

function safeParse(val, fallback = []) {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val || "[]"); } catch { return fallback; }
}

export function ApiEndpointView({ node, updateAttributes }) {
  const { method, path, description, auth, requestBody } = node.attrs;
  const params = safeParse(node.attrs.params, []);
  const responses = safeParse(node.attrs.responses, [{ status: "200", description: "OK", body: "" }]);

  const set = useCallback((key, val) => updateAttributes({ [key]: val }), [updateAttributes]);

  const updateParam = (i, field, val) => {
    const next = [...params];
    next[i] = { ...next[i], [field]: val };
    set("params", JSON.stringify(next));
  };
  const addParam = () => set("params", JSON.stringify([...params, { name: "", type: "string", required: false, description: "" }]));
  const removeParam = (i) => set("params", JSON.stringify(params.filter((_, j) => j !== i)));

  const updateResponse = (i, field, val) => {
    const next = [...responses];
    next[i] = { ...next[i], [field]: val };
    set("responses", JSON.stringify(next));
  };
  const addResponse = () => set("responses", JSON.stringify([...responses, { status: "", description: "", body: "" }]));
  const removeResponse = (i) => set("responses", JSON.stringify(responses.filter((_, j) => j !== i)));

  return (
    <NodeViewWrapper className="api-endpoint" contentEditable={false}>
      {/* Header */}
      <div className="api-header">
        <select
          className="api-method-badge"
          value={method}
          onChange={(e) => set("method", e.target.value)}
          style={{ background: METHOD_COLORS[method] || "#8e8e93" }}
        >
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input
          className="api-path"
          value={path}
          onChange={(e) => set("path", e.target.value)}
          placeholder="/api/resource/:id"
        />
      </div>

      {/* Description */}
      <input
        className="api-desc"
        value={description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Descripción del endpoint"
      />

      {/* Auth */}
      <div className="api-section">
        <span className="api-section-label">Auth</span>
        <input
          className="api-section-input"
          value={auth}
          onChange={(e) => set("auth", e.target.value)}
          placeholder="Bearer {token}, API Key, None"
        />
      </div>

      {/* Parameters */}
      <div className="api-section">
        <span className="api-section-label">
          Parameters
          <button className="api-add-btn" onClick={addParam} title="Agregar parámetro"><Plus size={12} /></button>
        </span>
        {params.length > 0 && (
          <div className="api-params-table">
            <div className="api-params-header">
              <span>Nombre</span><span>Tipo</span><span>Req</span><span>Descripción</span><span></span>
            </div>
            {params.map((p, i) => (
              <div className="api-params-row" key={i}>
                <input value={p.name} onChange={(e) => updateParam(i, "name", e.target.value)} placeholder="id" />
                <select value={p.type} onChange={(e) => updateParam(i, "type", e.target.value)}>
                  {["string", "number", "boolean", "object", "array"].map(t => <option key={t}>{t}</option>)}
                </select>
                <input type="checkbox" checked={p.required} onChange={(e) => updateParam(i, "required", e.target.checked)} />
                <input value={p.description} onChange={(e) => updateParam(i, "description", e.target.value)} placeholder="Descripción" />
                <button className="api-remove-btn" onClick={() => removeParam(i)}><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Body */}
      {(method === "POST" || method === "PUT" || method === "PATCH") && (
        <div className="api-section">
          <span className="api-section-label">Request Body</span>
          <textarea
            className="api-code"
            value={requestBody}
            onChange={(e) => set("requestBody", e.target.value)}
            placeholder='{ "key": "value" }'
            rows={3}
          />
        </div>
      )}

      {/* Responses */}
      <div className="api-section">
        <span className="api-section-label">
          Responses
          <button className="api-add-btn" onClick={addResponse} title="Agregar respuesta"><Plus size={12} /></button>
        </span>
        <div className="api-responses">
          {responses.map((r, i) => (
            <div className="api-response" key={i}>
              <div className="api-response-header">
                <input
                  className="api-status-input"
                  value={r.status}
                  onChange={(e) => updateResponse(i, "status", e.target.value)}
                  placeholder="200"
                  style={{ color: r.status?.startsWith("2") ? "#34c759" : r.status?.startsWith("4") ? "#ff9500" : r.status?.startsWith("5") ? "#ff3b30" : undefined }}
                />
                <input
                  className="api-response-desc"
                  value={r.description}
                  onChange={(e) => updateResponse(i, "description", e.target.value)}
                  placeholder="OK"
                />
                {responses.length > 1 && (
                  <button className="api-remove-btn" onClick={() => removeResponse(i)}><Trash2 size={11} /></button>
                )}
              </div>
              <textarea
                className="api-code"
                value={r.body}
                onChange={(e) => updateResponse(i, "body", e.target.value)}
                placeholder='{ "data": ... }'
                rows={3}
              />
            </div>
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
