/**
 * SlashCommandMenu
 * Menú flotante que aparece al escribir "/" en el editor.
 * Se posiciona sobre el decorationNode que entrega @tiptap/suggestion.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks,
  Quote, Code2, Minus, ImagePlus, Table2, ChevronRight, GitBranch,
  Sigma, Columns2, Columns3, ListTree, FileText,
  Info, Lightbulb, AlertTriangle, ShieldAlert, AlertCircle,
} from "lucide-react";
import "./slash-command-menu.scss";

const ICONS = {
  "h1":           Heading1,
  "h2":           Heading2,
  "h3":           Heading3,
  "bullet-list":  List,
  "ordered-list": ListOrdered,
  "task-list":    ListChecks,
  "quote":        Quote,
  "code-block":   Code2,
  "divider":      Minus,
  "image":        ImagePlus,
  "mermaid":      GitBranch,
  "toggle":       ChevronRight,
  "table":        Table2,
  "math":         Sigma,
  "columns-2":    Columns2,
  "columns-3":    Columns3,
  "callout-note":     Info,
  "callout-tip":      Lightbulb,
  "callout-warning":  AlertTriangle,
  "callout-caution":  ShieldAlert,
  "callout-important": AlertCircle,
  "toc":              ListTree,
};

export function SlashCommandMenu({ suggestionProps, onClose }) {
  const { items = [], command, decorationNode } = suggestionProps;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Posición sobre el cursor
  useEffect(() => {
    if (!decorationNode) return;
    const rect = decorationNode.getBoundingClientRect();
    const menuHeight = 320;
    const viewportH = window.innerHeight;
    const spaceBelow = viewportH - rect.bottom;
    const top = spaceBelow > menuHeight
      ? rect.bottom + window.scrollY + 6
      : rect.top + window.scrollY - menuHeight - 6;
    setCoords({ top, left: rect.left + window.scrollX });
  }, [decorationNode]);

  // Reset index cuando cambian los items
  useEffect(() => setSelectedIndex(0), [items]);

  const selectItem = useCallback(
    (index) => {
      const item = items[index];
      if (item) command(item);
    },
    [items, command]
  );

  // Navegación por teclado
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectItem(selectedIndex);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [items, selectedIndex, selectItem, onClose]);

  // Scroll automático al item seleccionado
  useEffect(() => {
    containerRef.current
      ?.querySelector(`[data-index="${selectedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!items.length) return null;

  return (
    <div
      ref={containerRef}
      className="slash-menu"
      style={{ top: coords.top, left: coords.left }}
      onMouseDown={(e) => e.preventDefault()} // evita que el editor pierda focus
    >
      {items.map((item, index) => {
        const Icon = ICONS[item.id];
        return (
          <button
            key={item.id}
            data-index={index}
            className={`slash-menu-item ${index === selectedIndex ? "selected" : ""}`}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => selectItem(index)}
          >
            <span className="slash-menu-icon">
              {Icon ? <Icon size={16} /> : <FileText size={16} />}
            </span>
            <span className="slash-menu-copy">
              <span className="slash-menu-title">{item.title}</span>
              <span className="slash-menu-desc">{item.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
