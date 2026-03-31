/**
 * TableToolbar
 * Toolbar contextual que aparece cuando el cursor está dentro de una tabla.
 * Permite agregar/eliminar filas y columnas, y eliminar la tabla completa.
 */

import { useEffect, useState } from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp,
  Trash2, Columns3, Rows3,
} from "lucide-react";
import "./table-toolbar.scss";

// ─── Hook: detecta si el cursor está en una tabla ────────────────────────────

export function useTableToolbarState(editor) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const isTable = editor.isActive("table");
      setVisible(isTable);

      if (isTable) {
        // Posicionar encima de la tabla activa
        const { view } = editor;
        const { state } = view;
        const { from } = state.selection;
        const domPos = view.domAtPos(from);

        let el = domPos.node;
        // Sube al elemento <table>
        while (el && el.nodeName !== "TABLE") el = el.parentElement;

        if (el) {
          const rect = el.getBoundingClientRect();
          setPos({
            top:  rect.top  + window.scrollY - 44,
            left: rect.left + window.scrollX + rect.width / 2,
          });
        }
      }
    };

    editor.on("selectionUpdate", update);
    editor.on("transaction",     update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction",     update);
    };
  }, [editor]);

  return { visible, pos };
}

// ─── Componente ───────────────────────────────────────────────────────────────

const Btn = ({ title, onClick, icon: Icon, danger }) => (
  <button
    className={`table-btn ${danger ? "danger" : ""}`}
    title={title}
    onClick={onClick}
    onMouseDown={(e) => e.preventDefault()}
  >
    <Icon size={13} />
  </button>
);

const Sep = () => <div className="table-sep" />;

export function TableToolbar({ editor }) {
  const { visible, pos } = useTableToolbarState(editor);
  if (!visible || !editor) return null;

  const cmd = (fn) => () => { fn(editor.chain().focus()); };

  return (
    <div
      className="table-toolbar"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Filas */}
      <Btn title="Insertar fila arriba"  icon={ArrowUp}    onClick={cmd((c) => c.addRowBefore().run())} />
      <Btn title="Insertar fila abajo"   icon={ArrowDown}  onClick={cmd((c) => c.addRowAfter().run())} />
      <Btn title="Eliminar fila"         icon={Rows3}      onClick={cmd((c) => c.deleteRow().run())} danger />

      <Sep />

      {/* Columnas */}
      <Btn title="Insertar columna izquierda" icon={ArrowLeft}  onClick={cmd((c) => c.addColumnBefore().run())} />
      <Btn title="Insertar columna derecha"   icon={ArrowRight} onClick={cmd((c) => c.addColumnAfter().run())} />
      <Btn title="Eliminar columna"           icon={Columns3}   onClick={cmd((c) => c.deleteColumn().run())} danger />

      <Sep />

      {/* Tabla completa */}
      <Btn title="Eliminar tabla" icon={Trash2} onClick={cmd((c) => c.deleteTable().run())} danger />
    </div>
  );
}
