import { useState, useCallback } from "react";

const api = window.notesApi;

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

  const updateStatus = useCallback(async (stageId, docId, newStatus) => {
    if (!workflow) return;
    const next = {
      ...workflow,
      stages: workflow.stages.map((stage) =>
        stage.id === stageId
          ? { ...stage, docs: stage.docs.map((d) => d.id === docId ? { ...d, status: newStatus } : d) }
          : stage
      ),
    };
    await saveWorkflow(next);
  }, [workflow, saveWorkflow]);

  const linkDoc = useCallback(async (stageId, docId, pagePath) => {
    if (!workflow) return;
    const next = {
      ...workflow,
      stages: workflow.stages.map((stage) =>
        stage.id === stageId
          ? { ...stage, docs: stage.docs.map((d) => d.id === docId ? { ...d, pagePath } : d) }
          : stage
      ),
    };
    await saveWorkflow(next);
  }, [workflow, saveWorkflow]);

  return {
    workflow,
    activePackage,
    loading,
    loadWorkflow,
    closeWorkflow,
    updateStatus,
    linkDoc,
  };
}
