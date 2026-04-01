/**
 * workflow-definitions.js
 * Default workflow templates based on real methodologies.
 * Each area has predefined stages and suggested doc types per stage.
 * Users can edit stages or create custom workflows.
 */

import crypto from "crypto";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

export const WORKFLOW_TEMPLATES = {
  tecnico: {
    framework: "arc42 + Shape Up",
    author: "Starke/Hruschka + Basecamp",
    stages: [
      { id: "pitch", title: "Pitch", color: "#ff9500", docTypes: ["PRD", "Problem Statement"] },
      { id: "bet", title: "Bet", color: "#0071e3", docTypes: ["RFC", "ADR", "Architecture Diagram"] },
      { id: "build", title: "Build", color: "#af52de", docTypes: ["Sprint Plan", "API Spec", "Test Plan"] },
      { id: "cooldown", title: "Cool-down", color: "#34c759", docTypes: ["Runbook", "Retrospectiva", "Lessons Learned"] },
    ],
  },

  producto: {
    framework: "Stage-Gate",
    author: "Robert Cooper",
    stages: [
      { id: "discovery", title: "Discovery", color: "#ff9500", docTypes: ["User Research", "Market Analysis"] },
      { id: "scoping", title: "Scoping", color: "#ffcc00", docTypes: ["Personas", "Journey Map"] },
      { id: "business-case", title: "Business Case", color: "#0071e3", docTypes: ["PRD", "Roadmap"] },
      { id: "development", title: "Development", color: "#af52de", docTypes: ["Sprint Plan", "Prototipos"] },
      { id: "validation", title: "Validation", color: "#5856d6", docTypes: ["Test Reports", "Usability Tests"] },
      { id: "launch", title: "Launch", color: "#34c759", docTypes: ["Launch Plan", "Release Notes"] },
    ],
  },

  negocio: {
    framework: "Lean Startup + Business Model Canvas",
    author: "Eric Ries + Alexander Osterwalder",
    stages: [
      { id: "canvas", title: "Canvas", color: "#ff9500", docTypes: ["Lean Canvas", "Value Proposition"] },
      { id: "customer-discovery", title: "Customer Discovery", color: "#ffcc00", docTypes: ["Interviews", "Surveys"] },
      { id: "mvp", title: "MVP", color: "#0071e3", docTypes: ["MVP Definition", "Experiment Cards"] },
      { id: "bml", title: "Build-Measure-Learn", color: "#af52de", docTypes: ["Métricas", "Pivot Memo"] },
      { id: "scale", title: "Pivot / Persevere", color: "#34c759", docTypes: ["Growth Plan", "Investor Update"] },
    ],
  },

  marketing: {
    framework: "RACE",
    author: "Dave Chaffey (Smart Insights)",
    stages: [
      { id: "reach", title: "Reach", color: "#ff9500", docTypes: ["Channel Strategy", "SEO Plan"] },
      { id: "act", title: "Act", color: "#0071e3", docTypes: ["Content Calendar", "Campaign Brief"] },
      { id: "convert", title: "Convert", color: "#af52de", docTypes: ["Conversion Funnel", "Landing Pages"] },
      { id: "engage", title: "Engage", color: "#34c759", docTypes: ["Retention Playbook", "KPI Dashboard"] },
    ],
  },

  cliente: {
    framework: "Double Diamond",
    author: "British Design Council",
    stages: [
      { id: "discover", title: "Discover", color: "#ff9500", docTypes: ["Research Brief", "User Interviews"] },
      { id: "define", title: "Define", color: "#0071e3", docTypes: ["Personas", "Problem Statement"] },
      { id: "develop", title: "Develop", color: "#af52de", docTypes: ["Journey Map", "Wireframes"] },
      { id: "deliver", title: "Deliver", color: "#34c759", docTypes: ["Usability Report", "Design Spec"] },
    ],
  },

  legal: {
    framework: "EDRM",
    author: "EDRM Consortium",
    stages: [
      { id: "governance", title: "Governance", color: "#ff9500", docTypes: ["Políticas", "Requisitos Legales"] },
      { id: "identification", title: "Identificación", color: "#0071e3", docTypes: ["Legal Hold", "Inventario"] },
      { id: "drafting", title: "Redacción", color: "#af52de", docTypes: ["Aviso de Privacidad", "Términos", "Contratos"] },
      { id: "review", title: "Revisión", color: "#5856d6", docTypes: ["Review Checklist", "Privilege Log"] },
      { id: "production", title: "Producción", color: "#34c759", docTypes: ["Compliance Report", "Renewal Calendar"] },
    ],
  },

  franquicia: {
    framework: "BPM Lifecycle",
    author: "ABPMP (BPM CBOK)",
    stages: [
      { id: "identification", title: "Identificación", color: "#ff9500", docTypes: ["Unit Economics", "Process Inventory"] },
      { id: "discovery", title: "Discovery", color: "#ffcc00", docTypes: ["As-Is Process Map", "Manual de Franquicia"] },
      { id: "analysis", title: "Análisis", color: "#0071e3", docTypes: ["Gap Analysis", "Brand Guidelines"] },
      { id: "redesign", title: "Rediseño", color: "#af52de", docTypes: ["Checklist Apertura", "Territory Plan"] },
      { id: "implementation", title: "Implementación", color: "#5856d6", docTypes: ["Training Plan", "Perfil Franquiciatario"] },
      { id: "monitoring", title: "Monitoreo", color: "#34c759", docTypes: ["Auditoría", "KPI Dashboard"] },
    ],
  },

  operaciones: {
    framework: "PDCA (Deming Cycle)",
    author: "W. Edwards Deming",
    stages: [
      { id: "plan", title: "Plan", color: "#ff9500", docTypes: ["Process Mapping", "SOP Draft"] },
      { id: "do", title: "Do", color: "#0071e3", docTypes: ["Manual de Operaciones", "Checklist Diario"] },
      { id: "check", title: "Check", color: "#af52de", docTypes: ["Métricas", "Audit Report"] },
      { id: "act", title: "Act", color: "#34c759", docTypes: ["Retrospectiva", "Improvement Plan"] },
    ],
  },

  bitacora: {
    framework: "PMBOK (Closing)",
    author: "PMI",
    stages: [
      { id: "registro", title: "Registro", color: "#ff9500", docTypes: ["Entrada de Bitácora", "Incident Report"] },
      { id: "analisis", title: "Análisis", color: "#0071e3", docTypes: ["Patterns", "Trends"] },
      { id: "decision", title: "Decisión", color: "#af52de", docTypes: ["Action Items", "Decision Log"] },
      { id: "archivo", title: "Archivo", color: "#34c759", docTypes: ["Retrospectiva", "Lessons Learned"] },
    ],
  },
};

/**
 * Generate a fresh workflow.json for a given area.
 */
export function generateWorkflow(areaId) {
  const template = WORKFLOW_TEMPLATES[areaId];
  if (!template) return null;

  return {
    workflowVersion: 1,
    areaId,
    framework: template.framework,
    author: template.author,
    editable: true,
    stages: template.stages.map((s, i) => ({
      id: s.id,
      title: s.title,
      order: i,
      color: s.color,
      docTypes: s.docTypes,
    })),
    initiatives: [],
  };
}

/**
 * Generate a blank custom workflow.
 */
export function generateCustomWorkflow(name, stages) {
  return {
    workflowVersion: 1,
    areaId: "custom",
    framework: "Personalizado",
    author: "Usuario",
    editable: true,
    stages: stages.map((s, i) => ({
      id: s.id || uid(),
      title: s.title,
      order: i,
      color: s.color || "#8e8e93",
      docTypes: s.docTypes || [],
    })),
    initiatives: [],
  };
}

/**
 * List all available workflow template IDs.
 */
export function listWorkflowTemplates() {
  return Object.entries(WORKFLOW_TEMPLATES).map(([id, t]) => ({
    id,
    framework: t.framework,
    author: t.author,
    stageCount: t.stages.length,
    stages: t.stages.map((s) => s.title),
  }));
}
