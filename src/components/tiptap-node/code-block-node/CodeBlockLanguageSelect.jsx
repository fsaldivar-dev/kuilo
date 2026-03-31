/**
 * Code block node view.
 *
 * Mermaid + selected   → split layout: Monaco (left) | live diagram (right)
 * Mermaid + unselected → clean diagram preview only (no code visible)
 * Other + selected     → Monaco editor (full width)
 * Other + unselected   → lowlight-highlighted <pre> (read-only)
 *
 * NodeViewContent is always in the DOM (hidden when needed) so Tiptap
 * keeps node.textContent in sync with the document.
 */

import { useCallback, useState } from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import Editor from "@monaco-editor/react";
import { Trash2 } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "./code-block-lowlight-extension";
import { FlowchartReadOnly } from "./FlowchartView";
import { DiagramEditor } from "./DiagramEditor";
import { isMermaidCode } from "@/lib/mermaid-utils";
import "./code-block-split.scss";

// ── Monaco language map ───────────────────────────────────────────────────────

const MONACO_LANG_MAP = {
  javascript: "javascript", js: "javascript",
  typescript: "typescript", ts: "typescript",
  jsx: "javascript", tsx: "typescript",
  python: "python", py: "python",
  css: "css", scss: "scss", html: "html", xml: "xml",
  json: "json", markdown: "markdown", md: "markdown",
  bash: "shell", sh: "shell", sql: "sql",
  rust: "rust", go: "go", java: "java",
  cpp: "cpp", "c++": "cpp", c: "c",
  csharp: "csharp", "c#": "csharp",
  ruby: "ruby", php: "php", swift: "swift",
  kotlin: "kotlin", yaml: "yaml", toml: "ini",
  mermaid: "plaintext",
};

const toMonacoLang = (lang) => MONACO_LANG_MAP[lang?.toLowerCase()] ?? "plaintext";

// ── Monaco default options ────────────────────────────────────────────────────

const MONACO_OPTIONS = {
  minimap:              { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers:          "on",
  folding:              true,
  wordWrap:             "off",
  fontSize:             13,
  tabSize:              2,
  renderLineHighlight:  "none",
  overviewRulerLanes:   0,
  hideCursorInOverviewRuler: true,
  scrollbar: {
    vertical:                "auto",
    horizontal:              "auto",
    alwaysConsumeMouseWheel: false,
  },
  padding: { top: 12, bottom: 12 },
};

// ── Language selector header ──────────────────────────────────────────────────

function BlockHeader({ language, onChange }) {
  return (
    <div className="code-block-header">
      <div className="code-block-dots">
        <span /><span /><span />
      </div>
      <select
        className="code-block-lang-select"
        value={language}
        onChange={(e) => onChange(e.target.value)}
        contentEditable={false}
      >
        {SUPPORTED_LANGUAGES.map(({ label, value }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CodeBlockLanguageSelect({ node, updateAttributes, selected, editor, getPos }) {
  const language = node.attrs.language || "";
  const code     = node.textContent || "";

  const isMermaid = language === "mermaid" || (language === "" && isMermaidCode(code));
  const isDark    = document.documentElement.classList.contains("dark");

  // Auto-resize Monaco to content height
  const handleEditorMount = useCallback((monacoEditor) => {
    const resize = () => {
      const h = Math.max(80, monacoEditor.getContentHeight());
      monacoEditor.layout({ width: monacoEditor.getLayoutInfo().width, height: h });
    };
    resize();
    monacoEditor.onDidContentSizeChange(resize);
  }, []);

  // Sync Monaco → Tiptap document
  const handleMonacoChange = useCallback((value) => {
    if (!editor || getPos == null) return;
    const pos     = getPos();
    const docNode = editor.state.doc.nodeAt(pos);
    if (!docNode) return;
    editor.chain()
      .command(({ tr }) => {
        const start = pos + 1;
        const end   = pos + docNode.nodeSize - 1;
        tr.replaceWith(start, end, value ? editor.schema.text(value) : []);
        return true;
      })
      .run();
  }, [editor, getPos]);

  const onLangChange = (val) => updateAttributes({ language: val });

  const [editorOpen, setEditorOpen] = useState(false);

  // ── Mermaid — preview + click opens fullscreen editor ──
  if (isMermaid) {
    return (
      <NodeViewWrapper className="code-block-wrapper code-block-wrapper--diagram">
        <pre style={{ display: "none" }}>
          <NodeViewContent as="code" />
        </pre>

        {/* Click overlay — opens fullscreen editor */}
        <div className="diagram-edit-overlay" onClick={() => setEditorOpen(true)}>
          <span className="diagram-edit-hint">Click para editar diagrama</span>
        </div>
        {/* Delete button */}
        <button
          className="diagram-delete-btn"
          onClick={(e) => { e.stopPropagation(); if (editor && getPos != null) editor.chain().focus().deleteRange({ from: getPos(), to: getPos() + node.nodeSize }).run(); }}
          title="Eliminar diagrama"
        >
          <Trash2 size={14} />
        </button>

        {/* React Flow read-only preview */}
        <FlowchartReadOnly code={code} isDark={isDark} />

        {/* Fullscreen editor portal */}
        {editorOpen && (
          <DiagramEditor
            code={code}
            isDark={isDark}
            onSave={(newCode) => handleMonacoChange(newCode)}
            onClose={() => setEditorOpen(false)}
          />
        )}
      </NodeViewWrapper>
    );
  }

  // ── Regular code — selected: Monaco full width ──────────────────────────────
  if (selected) {
    return (
      <NodeViewWrapper className="code-block-wrapper">
        <BlockHeader language={language} onChange={onLangChange} />
        <pre style={{ display: "none" }}>
          <NodeViewContent as="code" />
        </pre>
        <div className="code-block-monaco-wrapper" contentEditable={false}>
          <Editor
            value={code}
            language={toMonacoLang(language)}
            theme={isDark ? "vs-dark" : "light"}
            options={MONACO_OPTIONS}
            onMount={handleEditorMount}
            onChange={handleMonacoChange}
          />
        </div>
      </NodeViewWrapper>
    );
  }

  // ── Regular code — unselected: lowlight <pre> ───────────────────────────────
  return (
    <NodeViewWrapper className="code-block-wrapper">
      <BlockHeader language={language} onChange={onLangChange} />
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
