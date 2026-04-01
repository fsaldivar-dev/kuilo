import { useState, useCallback } from "react";

const api = window.notesApi;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

export function useWorkflow() {
  const [workflow, setWorkflow] = useState(null);
  const [activePackage, setActivePackage] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadWorkflow = useCallback(async (packageName) => {
    if (!api?.readWorkflow) return;
    setLoading(true);
    setActivePackage(packageName);
    const data = await api.readWorkflow({ packageName });
    setWorkflow(data);
    setLoading(false);
  }, []);

  const saveWorkflow = useCallback(async (wf) => {
    if (!api?.saveWorkflow || !activePackage) return;
    await api.saveWorkflow({ packageName: activePackage, workflow: wf });
    setWorkflow(wf);
  }, [activePackage]);

  const closeWorkflow = useCallback(() => {
    setWorkflow(null);
    setActivePackage(null);
  }, []);

  // ── Initiative CRUD ──

  const addInitiative = useCallback(async (title) => {
    if (!workflow) return;
    const next = {
      ...workflow,
      initiatives: [...workflow.initiatives, { id: `init-${uid()}`, title, cards: [] }],
    };
    await saveWorkflow(next);
  }, [workflow, saveWorkflow]);

  const removeInitiative = useCallback(async (initId) => {
    if (!workflow) return;
    const next = {
      ...workflow,
      initiatives: workflow.initiatives.filter((i) => i.id !== initId),
    };
    await saveWorkflow(next);
  }, [workflow, saveWorkflow]);

  // ── Card CRUD ──

  const addCard = useCallback(async (initiativeId, stageId, docRef, title, docType) => {
    if (!workflow) return;
    const next = {
      ...workflow,
      initiatives: workflow.initiatives.map((init) =>
        init.id === initiativeId
          ? { ...init, cards: [...init.cards, { id: `card-${uid()}`, stageId, docRef, title, docType }] }
          : init
      ),
    };
    await saveWorkflow(next);
  }, [workflow, saveWorkflow]);

  const removeCard = useCallback(async (initiativeId, cardId) => {
    if (!workflow) return;
    const next = {
      ...workflow,
      initiatives: workflow.initiatives.map((init) =>
        init.id === initiativeId
          ? { ...init, cards: init.cards.filter((c) => c.id !== cardId) }
          : init
      ),
    };
    await saveWorkflow(next);
  }, [workflow, saveWorkflow]);

  const moveCard = useCallback(async (initiativeId, cardId, newStageId) => {
    if (!workflow) return;
    const next = {
      ...workflow,
      initiatives: workflow.initiatives.map((init) =>
        init.id === initiativeId
          ? { ...init, cards: init.cards.map((c) => c.id === cardId ? { ...c, stageId: newStageId } : c) }
          : init
      ),
    };
    await saveWorkflow(next);
  }, [workflow, saveWorkflow]);

  // ── Stage editing ──

  const addStage = useCallback(async (title, color = "#8e8e93") => {
    if (!workflow) return;
    const next = {
      ...workflow,
      stages: [...workflow.stages, { id: uid(), title, order: workflow.stages.length, color, docTypes: [] }],
    };
    await saveWorkflow(next);
  }, [workflow, saveWorkflow]);

  const removeStage = useCallback(async (stageId) => {
    if (!workflow) return;
    const next = {
      ...workflow,
      stages: workflow.stages.filter((s) => s.id !== stageId).map((s, i) => ({ ...s, order: i })),
      // Remove cards in the deleted stage
      initiatives: workflow.initiatives.map((init) => ({
        ...init,
        cards: init.cards.filter((c) => c.stageId !== stageId),
      })),
    };
    await saveWorkflow(next);
  }, [workflow, saveWorkflow]);

  // ── Computed ──

  const progress = workflow ? (() => {
    const totalCards = workflow.initiatives.reduce((sum, i) => sum + i.cards.length, 0);
    if (!totalCards) return { total: 0, byStage: {} };
    const byStage = {};
    for (const stage of workflow.stages) {
      const count = workflow.initiatives.reduce(
        (sum, i) => sum + i.cards.filter((c) => c.stageId === stage.id).length, 0
      );
      byStage[stage.id] = { count, percent: Math.round((count / totalCards) * 100) };
    }
    return { total: totalCards, byStage };
  })() : null;

  return {
    workflow,
    activePackage,
    loading,
    progress,
    loadWorkflow,
    saveWorkflow,
    closeWorkflow,
    addInitiative,
    removeInitiative,
    addCard,
    removeCard,
    moveCard,
    addStage,
    removeStage,
  };
}
