/**
 * BubbleMenu
 * Toolbar flotante que aparece al seleccionar texto.
 *
 * Diseño:
 * - BubbleToolbar: componente puro de presentación (testeable)
 * - useBubbleMenuState: hook que observa la selección del editor
 * - simple-editor.jsx consume ambos
 */

import { useEffect, useState, useRef } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  Code, Link, Highlighter,
} from "lucide-react";
import "./bubble-menu.scss";

// ─── BubbleToolbar ────────────────────────────────────────────────────────────

const FORMATS = [
  { type: "bold",      title: "Negrita (Bold)",    Icon: Bold,          mark: "bold" },
  { type: "italic",    title: "Cursiva (Italic)",  Icon: Italic,        mark: "italic" },
  { type: "underline", title: "Subrayado (Underline)", Icon: Underline,  mark: "underline" },
  { type: "strike",    title: "Tachado (Strike)",  Icon: Strikethrough, mark: "strike" },
  { type: "code",      title: "Código (Code)",     Icon: Code,          mark: "code" },
];

export function BubbleToolbar({ editor, rect, onLinkClick }) {
  if (!rect || !editor) return null;

  const toggle = (chain) => chain.focus().run();

  return (
    <div
      className="bubble-toolbar"
      style={{
        top:  rect.top  + window.scrollY - 44,
        left: rect.left + window.scrollX + rect.width / 2,
      }}
      onMouseDown={(e) => e.preventDefault()} // mantiene la selección
    >
      {FORMATS.map(({ type, title, Icon, mark }) => {
        const isActive = editor.isActive(mark);
        return (
          <button
            key={type}
            title={title}
            data-active={isActive ? "true" : undefined}
            className={`bubble-btn ${isActive ? "active" : ""}`}
            onClick={() => {
              const chain = editor.chain();
              switch (type) {
                case "bold":      chain.focus().toggleBold().run(); break;
                case "italic":    chain.focus().toggleItalic().run(); break;
                case "underline": chain.focus().toggleUnderline().run(); break;
                case "strike":    chain.focus().toggleStrike().run(); break;
                case "code":      chain.focus().toggleCode().run(); break;
              }
            }}
          >
            <Icon size={14} />
          </button>
        );
      })}

      <div className="bubble-sep" />

      <button
        title="Enlace (Link)"
        className={`bubble-btn ${editor.isActive("link") ? "active" : ""}`}
        onClick={onLinkClick}
      >
        <Link size={14} />
      </button>

      <button
        title="Resaltado (Highlight)"
        className={`bubble-btn ${editor.isActive("highlight") ? "active" : ""}`}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter size={14} />
      </button>
    </div>
  );
}

// ─── useBubbleMenuState ───────────────────────────────────────────────────────

/**
 * Observa la selección del editor y devuelve el rect del texto seleccionado.
 * Devuelve null cuando no hay selección de texto válida.
 */
export function useBubbleMenuState(editor) {
  const [rect, setRect] = useState(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      // Cancelar frame anterior si hay uno pendiente
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const { selection } = editor.state;
        const isEmpty = selection.empty;
        const isCode = editor.isActive("codeBlock");

        if (isEmpty || isCode) {
          setRect(null);
          return;
        }

        const domSelection = window.getSelection();
        if (!domSelection || domSelection.rangeCount === 0) {
          setRect(null);
          return;
        }

        const range = domSelection.getRangeAt(0);
        const domRect = range.getBoundingClientRect();

        // Ignora rects inválidos (altura 0 = sin selección visual)
        if (!domRect.width || !domRect.height) {
          setRect(null);
          return;
        }

        setRect(domRect);
      });
    };

    // Cierra el menú al hacer click fuera de una selección
    const handleMouseDown = (e) => {
      if (!e.target.closest(".bubble-toolbar")) {
        setRect(null);
      }
    };

    editor.on("selectionUpdate", update);
    editor.on("blur",           () => setRect(null));
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      editor.off("selectionUpdate", update);
      editor.off("blur",           () => setRect(null));
      document.removeEventListener("mousedown", handleMouseDown);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [editor]);

  return rect;
}
