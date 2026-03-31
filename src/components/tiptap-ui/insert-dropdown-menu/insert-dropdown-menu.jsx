/**
 * InsertDropdownMenu — toolbar dropdown with all insertable components.
 * Same visual style as the slash command menu.
 */

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Table2, GitBranch, ChevronRight, Sigma, Columns2, Columns3, ListTree,
  Info, Lightbulb, AlertTriangle, ShieldAlert, AlertCircle,
  FileText, Minus, Code2, Globe, BarChart3, Workflow,
} from "lucide-react";
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon";
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";
import { Button } from "@/components/tiptap-ui-primitive/button";
import { PAGE_TEMPLATES } from "@/lib/page-templates";
import "./insert-dropdown-menu.scss";

const GROUPS = [
  {
    label: "Bloques",
    items: [
      { id: "table",   label: "Tabla",             desc: "Filas y columnas editables",           icon: Table2,       action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { id: "code",    label: "Code Block",         desc: "Código con syntax highlighting",       icon: Code2,        action: (e) => e.chain().focus().toggleCodeBlock().run() },
      { id: "mermaid", label: "Mermaid Diagram",     desc: "Diagrama con preview visual",          icon: GitBranch,    action: (e) => e.chain().focus().insertContent({ type: "codeBlock", attrs: { language: "mermaid" }, content: [{ type: "text", text: "flowchart TD\n    A[Inicio] --> B[Fin]" }] }).run() },
      { id: "toggle",  label: "Toggle",              desc: "Bloque colapsable",                    icon: ChevronRight, action: (e) => e.chain().focus().insertToggleList().run() },
      { id: "math",    label: "Math (LaTeX)",        desc: "Ecuación con renderizado KaTeX",       icon: Sigma,        action: (e) => e.chain().focus().insertMathBlock({ latex: "E = mc^2" }).run() },
      { id: "divider", label: "Divider",             desc: "Línea divisora horizontal",            icon: Minus,        action: (e) => e.chain().focus().setHorizontalRule().run() },
      { id: "toc",     label: "Table of Contents",   desc: "Índice automático de headings",        icon: ListTree,     action: (e) => e.chain().focus().insertTableOfContents().run() },
      { id: "api",     label: "API Endpoint",        desc: "Endpoint REST con método y responses",  icon: Globe,        action: (e) => e.chain().focus().insertApiEndpoint().run() },
      { id: "chart",   label: "Chart",               desc: "Grafica de barras, lineas, area o pie", icon: BarChart3,    action: (e) => e.chain().focus().insertChart().run() },
      { id: "diagram", label: "Diagram (Visual)",    desc: "Editor visual de flowcharts",           icon: Workflow,     action: (e) => e.chain().focus().insertDiagram().run() },
    ],
  },
  {
    label: "Callouts",
    items: [
      { id: "note",      label: "Note",      desc: "Información complementaria",      icon: Info,          action: (e) => e.chain().focus().insertCallout("note").run() },
      { id: "tip",       label: "Tip",       desc: "Consejo o buena práctica",        icon: Lightbulb,     action: (e) => e.chain().focus().insertCallout("tip").run() },
      { id: "important", label: "Important", desc: "Información crítica",             icon: AlertCircle,   action: (e) => e.chain().focus().insertCallout("important").run() },
      { id: "warning",   label: "Warning",   desc: "Advertencia importante",          icon: AlertTriangle, action: (e) => e.chain().focus().insertCallout("warning").run() },
      { id: "caution",   label: "Caution",   desc: "Riesgo de error o pérdida",       icon: ShieldAlert,   action: (e) => e.chain().focus().insertCallout("caution").run() },
    ],
  },
  {
    label: "Layout",
    items: [
      { id: "cols-2", label: "2 Columnas", desc: "Contenido lado a lado",       icon: Columns2, action: (e) => e.chain().focus().insertColumns(2).run() },
      { id: "cols-3", label: "3 Columnas", desc: "Tres columnas paralelas",     icon: Columns3, action: (e) => e.chain().focus().insertColumns(3).run() },
    ],
  },
  {
    label: "Templates",
    items: PAGE_TEMPLATES
      .filter((tpl) => tpl.id !== "blank")
      .map((tpl) => ({
        id: `tpl-${tpl.id}`,
        label: `${tpl.icon} ${tpl.title}`,
        desc: tpl.description,
        icon: FileText,
        action: (e) => e.chain().focus().insertContent(tpl.blocks).run(),
      })),
  },
];

export const InsertDropdownMenu = forwardRef(({ editor: providedEditor, ...buttonProps }, ref) => {
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  const handleInsert = useCallback((action) => {
    if (!editor) return;
    action(editor);
    setIsOpen(false);
  }, [editor]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 6, left: rect.left });
      }
      return !prev;
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => () => setIsOpen(false), []);

  if (!editor) return null;

  return (
    <>
      <Button
        ref={(el) => { btnRef.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; }}
        type="button"
        variant="ghost"
        onClick={toggle}
        aria-label="Insertar componente"
        tooltip="Insertar componente"
        data-active-state={isOpen ? "on" : "off"}
        {...buttonProps}
      >
        <Plus className="tiptap-button-icon" />
        <ChevronDownIcon className="tiptap-button-dropdown-small" />
      </Button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="insert-menu"
          style={{ top: pos.top, left: pos.left }}
        >
          {GROUPS.map((group) => (
            <div key={group.label} className="insert-menu-group">
              <div className="insert-menu-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className="insert-menu-item"
                    onClick={() => handleInsert(item.action)}
                  >
                    <div className="insert-menu-icon">
                      <Icon size={15} />
                    </div>
                    <div className="insert-menu-copy">
                      <span className="insert-menu-title">{item.label}</span>
                      <span className="insert-menu-desc">{item.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
});

InsertDropdownMenu.displayName = "InsertDropdownMenu";
export default InsertDropdownMenu;
