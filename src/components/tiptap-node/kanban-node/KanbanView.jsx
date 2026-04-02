import { useCallback, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import "./kanban-node.scss";

const COLORS = [
  { id: "", label: "Sin color" },
  { id: "blue", label: "Azul" },
  { id: "green", label: "Verde" },
  { id: "orange", label: "Naranja" },
  { id: "red", label: "Rojo" },
  { id: "purple", label: "Morado" },
];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

function safeParse(val) {
  try {
    const parsed = typeof val === "string" ? JSON.parse(val) : val;
    return parsed?.columns ? parsed : { columns: [] };
  } catch { return { columns: [] }; }
}

export function KanbanView({ node, updateAttributes }) {
  const board = safeParse(node.attrs.board);
  const [pendingDelete, setPendingDelete] = useState(null);

  const save = useCallback((newBoard) => {
    updateAttributes({ board: JSON.stringify(newBoard) });
  }, [updateAttributes]);

  // ── Drag & Drop ──
  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    const cols = [...board.columns];
    const srcCol = cols.find(c => c.id === source.droppableId);
    const dstCol = cols.find(c => c.id === destination.droppableId);
    if (!srcCol || !dstCol) return;

    const [moved] = srcCol.cards.splice(source.index, 1);
    dstCol.cards.splice(destination.index, 0, moved);
    save({ columns: cols });
  }, [board, save]);

  // ── Column actions ──
  const addColumn = () => {
    save({ columns: [...board.columns, { id: uid(), title: "Nueva columna", cards: [] }] });
  };

  const renameColumn = (colId, title) => {
    save({ columns: board.columns.map(c => c.id === colId ? { ...c, title } : c) });
  };

  const deleteColumn = (colId) => {
    save({ columns: board.columns.filter(c => c.id !== colId) });
  };

  // ── Card actions ──
  const addCard = (colId) => {
    save({
      columns: board.columns.map(c =>
        c.id === colId ? { ...c, cards: [...c.cards, { id: uid(), title: "Nueva tarea", color: "" }] } : c
      ),
    });
  };

  const updateCard = (colId, cardId, patch) => {
    save({
      columns: board.columns.map(c =>
        c.id === colId ? { ...c, cards: c.cards.map(card => card.id === cardId ? { ...card, ...patch } : card) } : c
      ),
    });
  };

  const deleteCard = (colId, cardId) => {
    save({
      columns: board.columns.map(c =>
        c.id === colId ? { ...c, cards: c.cards.filter(card => card.id !== cardId) } : c
      ),
    });
  };

  return (
    <NodeViewWrapper className="kanban-block" contentEditable={false}>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {board.columns.map((col) => (
            <div className="kanban-column" key={col.id}>
              <div className="kanban-column-header">
                <input
                  className="kanban-column-title"
                  value={col.title}
                  onChange={(e) => renameColumn(col.id, e.target.value)}
                />
                <span className="kanban-column-count">{col.cards.length}</span>
                <button className="kanban-icon-btn danger" onClick={() => setPendingDelete({ type: "column", colId: col.id, title: col.title, cardCount: col.cards.length })} title="Eliminar columna">
                  <X size={12} />
                </button>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`kanban-cards ${snapshot.isDraggingOver ? "drag-over" : ""}`}
                  >
                    {col.cards.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className={`kanban-card ${snap.isDragging ? "dragging" : ""} ${card.color ? `color-${card.color}` : ""}`}
                          >
                            <input
                              className="kanban-card-title"
                              value={card.title}
                              onChange={(e) => updateCard(col.id, card.id, { title: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="kanban-card-actions">
                              <div className="kanban-card-colors">
                                {COLORS.map((c) => (
                                  <button
                                    key={c.id || "none"}
                                    className={`kanban-color-dot ${c.id || "none"} ${card.color === c.id ? "active" : ""}`}
                                    onClick={() => updateCard(col.id, card.id, { color: c.id })}
                                    title={c.label}
                                    aria-label={c.label}
                                  />
                                ))}
                              </div>
                              <button className="kanban-icon-btn danger" onClick={() => setPendingDelete({ type: "card", colId: col.id, cardId: card.id, title: card.title })}>
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <button className="kanban-add-card" onClick={() => addCard(col.id)}>
                <Plus size={12} /> Agregar tarea
              </button>
            </div>
          ))}

          <button className="kanban-add-column" onClick={addColumn}>
            <Plus size={14} /> Columna
          </button>
        </div>
      </DragDropContext>

      <ConfirmDialog
        open={!!pendingDelete}
        title={pendingDelete?.type === "column" ? "Eliminar columna" : "Eliminar tarea"}
        message={
          pendingDelete?.type === "column"
            ? `¿Eliminar "${pendingDelete.title}" y sus ${pendingDelete.cardCount} tarea(s)?`
            : `¿Eliminar "${pendingDelete?.title}"?`
        }
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={() => {
          if (pendingDelete.type === "column") deleteColumn(pendingDelete.colId);
          else deleteCard(pendingDelete.colId, pendingDelete.cardId);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </NodeViewWrapper>
  );
}
