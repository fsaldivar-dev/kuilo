import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ArrowLeft, FileText, Plus, Trash2, X } from "lucide-react";

export function WorkflowBoard({ workflow, progress, onMoveCard, onAddInitiative, onRemoveInitiative, onAddCard, onRemoveCard, onOpenDoc, onClose }) {
  const [showInitiativeForm, setShowInitiativeForm] = useState(false);
  const [initiativeDraft, setInitiativeDraft] = useState("");

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const [initId, cardId] = result.draggableId.split("/");
    const newStageId = result.destination.droppableId;
    onMoveCard(initId, cardId, newStageId);
  };

  const handleAddInitiative = () => {
    if (!initiativeDraft.trim()) return;
    onAddInitiative(initiativeDraft.trim());
    setInitiativeDraft("");
    setShowInitiativeForm(false);
  };

  // Flatten all cards by stage
  const cardsByStage = {};
  for (const stage of workflow.stages) cardsByStage[stage.id] = [];
  for (const init of workflow.initiatives) {
    for (const card of init.cards) {
      if (cardsByStage[card.stageId]) {
        cardsByStage[card.stageId].push({ ...card, initiativeId: init.id, initiativeTitle: init.title });
      }
    }
  }

  return (
    <div className="wf-board">
      {/* Header */}
      <div className="wf-header">
        <button className="wf-back" onClick={onClose}>
          <ArrowLeft size={14} /> Volver
        </button>
        <div className="wf-info">
          <h2>{workflow.framework}</h2>
          <span className="wf-author">{workflow.author}</span>
        </div>
        <div className="wf-actions">
          {showInitiativeForm ? (
            <div className="wf-init-form">
              <input
                type="text"
                placeholder="Nombre de la iniciativa..."
                value={initiativeDraft}
                onChange={(e) => setInitiativeDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddInitiative(); if (e.key === "Escape") setShowInitiativeForm(false); }}
                autoFocus
              />
              <button className="wf-init-submit" onClick={handleAddInitiative}>Crear</button>
              <button className="wf-init-cancel" onClick={() => setShowInitiativeForm(false)}><X size={12} /></button>
            </div>
          ) : (
            <button className="wf-add-init" onClick={() => setShowInitiativeForm(true)}>
              <Plus size={13} /> Nueva iniciativa
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {progress && progress.total > 0 && (
        <div className="wf-progress">
          {workflow.stages.map((stage) => {
            const sp = progress.byStage[stage.id];
            return sp?.percent > 0 ? (
              <div key={stage.id} className="wf-progress-segment" style={{ width: `${sp.percent}%`, background: stage.color }} title={`${stage.title}: ${sp.count}`} />
            ) : null;
          })}
        </div>
      )}

      {/* Initiatives list */}
      {workflow.initiatives.length > 0 && (
        <div className="wf-initiatives">
          {workflow.initiatives.map((init) => (
            <span key={init.id} className="wf-init-badge">
              {init.title} ({init.cards.length})
              <button className="wf-init-remove" onClick={() => onRemoveInitiative(init.id)}><X size={9} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Board columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="wf-columns">
          {workflow.stages.map((stage) => (
            <div className="wf-column" key={stage.id}>
              <div className="wf-column-header" style={{ borderTopColor: stage.color }}>
                <span className="wf-column-title">{stage.title}</span>
                <span className="wf-column-count">{cardsByStage[stage.id].length}</span>
              </div>
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    className={`wf-column-body ${snapshot.isDraggingOver ? "drag-over" : ""}`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {cardsByStage[stage.id].map((card, index) => (
                      <Draggable key={`${card.initiativeId}/${card.id}`} draggableId={`${card.initiativeId}/${card.id}`} index={index}>
                        {(prov, snap) => (
                          <div
                            className={`wf-card ${snap.isDragging ? "dragging" : ""}`}
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            onClick={() => card.docRef && onOpenDoc(card.docRef)}
                          >
                            <div className="wf-card-type">{card.docType}</div>
                            <div className="wf-card-title">{card.title}</div>
                            <div className="wf-card-init">{card.initiativeTitle}</div>
                            <button className="wf-card-remove" onClick={(e) => { e.stopPropagation(); onRemoveCard(card.initiativeId, card.id); }}>
                              <Trash2 size={10} />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* Suggested doc types for this stage */}
                    {stage.docTypes?.length > 0 && cardsByStage[stage.id].length === 0 && (
                      <div className="wf-stage-hints">
                        {stage.docTypes.map((dt) => (
                          <span key={dt} className="wf-hint">{dt}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
