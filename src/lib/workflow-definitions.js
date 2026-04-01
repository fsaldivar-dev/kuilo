/**
 * workflow-definitions.js
 * Default workflow templates based on real methodologies.
 * Each doc type has: status tracking + dependency chain.
 *
 * Statuses: "not-started" | "draft" | "review" | "done"
 * Dependencies: { area, docType, requiredStatus } — cross-area supported.
 */

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

export const STATUSES = [
  { id: "not-started", label: "No iniciado", color: "#8e8e93" },
  { id: "draft", label: "Borrador", color: "#ff9500" },
  { id: "review", label: "En revisión", color: "#0071e3" },
  { id: "done", label: "Completado", color: "#34c759" },
];

export const WORKFLOW_TEMPLATES = {
  tecnico: {
    framework: "arc42 + Shape Up",
    author: "Starke/Hruschka + Basecamp",
    stages: [
      { id: "pitch", title: "Pitch", color: "#ff9500", docs: [
        { docType: "PRD", dependsOn: [{ area: "negocio", docType: "Lean Canvas", requiredStatus: "draft" }] },
        { docType: "Problem Statement", dependsOn: [] },
      ]},
      { id: "bet", title: "Bet", color: "#0071e3", docs: [
        { docType: "RFC", dependsOn: [{ area: "tecnico", docType: "PRD", requiredStatus: "review" }] },
        { docType: "ADR", dependsOn: [{ area: "tecnico", docType: "RFC", requiredStatus: "draft" }] },
        { docType: "API Spec", dependsOn: [{ area: "tecnico", docType: "RFC", requiredStatus: "review" }] },
      ]},
      { id: "build", title: "Build", color: "#af52de", docs: [
        { docType: "Sprint Plan", dependsOn: [{ area: "tecnico", docType: "RFC", requiredStatus: "done" }] },
        { docType: "Test Plan", dependsOn: [{ area: "tecnico", docType: "API Spec", requiredStatus: "review" }] },
      ]},
      { id: "cooldown", title: "Cool-down", color: "#34c759", docs: [
        { docType: "Runbook", dependsOn: [{ area: "tecnico", docType: "Sprint Plan", requiredStatus: "done" }] },
        { docType: "Retrospectiva", dependsOn: [{ area: "tecnico", docType: "Sprint Plan", requiredStatus: "done" }] },
      ]},
    ],
  },

  producto: {
    framework: "Stage-Gate",
    author: "Robert Cooper",
    stages: [
      { id: "discovery", title: "Discovery", color: "#ff9500", docs: [
        { docType: "User Research", dependsOn: [] },
        { docType: "Market Analysis", dependsOn: [] },
      ]},
      { id: "scoping", title: "Scoping", color: "#ffcc00", docs: [
        { docType: "Personas", dependsOn: [{ area: "producto", docType: "User Research", requiredStatus: "draft" }] },
        { docType: "Journey Map", dependsOn: [{ area: "producto", docType: "Personas", requiredStatus: "draft" }] },
      ]},
      { id: "business-case", title: "Business Case", color: "#0071e3", docs: [
        { docType: "PRD", dependsOn: [{ area: "producto", docType: "Personas", requiredStatus: "review" }, { area: "negocio", docType: "Lean Canvas", requiredStatus: "draft" }] },
        { docType: "Roadmap", dependsOn: [{ area: "producto", docType: "PRD", requiredStatus: "review" }] },
      ]},
      { id: "development", title: "Development", color: "#af52de", docs: [
        { docType: "Sprint Plan", dependsOn: [{ area: "producto", docType: "PRD", requiredStatus: "done" }] },
      ]},
      { id: "validation", title: "Validation", color: "#5856d6", docs: [
        { docType: "Test Reports", dependsOn: [{ area: "producto", docType: "Sprint Plan", requiredStatus: "review" }] },
        { docType: "Usability Tests", dependsOn: [{ area: "producto", docType: "Personas", requiredStatus: "done" }] },
      ]},
      { id: "launch", title: "Launch", color: "#34c759", docs: [
        { docType: "Launch Plan", dependsOn: [{ area: "producto", docType: "Test Reports", requiredStatus: "done" }, { area: "legal", docType: "Aviso de Privacidad", requiredStatus: "done" }] },
        { docType: "Release Notes", dependsOn: [{ area: "producto", docType: "Launch Plan", requiredStatus: "review" }] },
      ]},
    ],
  },

  negocio: {
    framework: "Lean Startup + Business Model Canvas",
    author: "Eric Ries + Alexander Osterwalder",
    stages: [
      { id: "canvas", title: "Canvas", color: "#ff9500", docs: [
        { docType: "Lean Canvas", dependsOn: [] },
        { docType: "Value Proposition", dependsOn: [] },
      ]},
      { id: "customer-discovery", title: "Customer Discovery", color: "#ffcc00", docs: [
        { docType: "Interviews", dependsOn: [{ area: "negocio", docType: "Lean Canvas", requiredStatus: "draft" }] },
        { docType: "Surveys", dependsOn: [{ area: "cliente", docType: "Customer Persona", requiredStatus: "draft" }] },
      ]},
      { id: "mvp", title: "MVP", color: "#0071e3", docs: [
        { docType: "MVP Definition", dependsOn: [{ area: "negocio", docType: "Interviews", requiredStatus: "review" }] },
        { docType: "Experiment Cards", dependsOn: [{ area: "negocio", docType: "MVP Definition", requiredStatus: "draft" }] },
      ]},
      { id: "bml", title: "Build-Measure-Learn", color: "#af52de", docs: [
        { docType: "Métricas", dependsOn: [{ area: "negocio", docType: "Experiment Cards", requiredStatus: "review" }] },
        { docType: "Pivot Memo", dependsOn: [{ area: "negocio", docType: "Métricas", requiredStatus: "review" }] },
      ]},
      { id: "scale", title: "Pivot / Persevere", color: "#34c759", docs: [
        { docType: "Growth Plan", dependsOn: [{ area: "negocio", docType: "Métricas", requiredStatus: "done" }] },
      ]},
    ],
  },

  marketing: {
    framework: "RACE",
    author: "Dave Chaffey (Smart Insights)",
    stages: [
      { id: "reach", title: "Reach", color: "#ff9500", docs: [
        { docType: "Channel Strategy", dependsOn: [{ area: "cliente", docType: "Customer Persona", requiredStatus: "draft" }] },
        { docType: "SEO Plan", dependsOn: [] },
      ]},
      { id: "act", title: "Act", color: "#0071e3", docs: [
        { docType: "Content Calendar", dependsOn: [{ area: "marketing", docType: "Channel Strategy", requiredStatus: "review" }] },
        { docType: "Campaign Brief", dependsOn: [{ area: "marketing", docType: "Channel Strategy", requiredStatus: "draft" }] },
      ]},
      { id: "convert", title: "Convert", color: "#af52de", docs: [
        { docType: "Conversion Funnel", dependsOn: [{ area: "marketing", docType: "Campaign Brief", requiredStatus: "review" }] },
      ]},
      { id: "engage", title: "Engage", color: "#34c759", docs: [
        { docType: "Retention Playbook", dependsOn: [{ area: "marketing", docType: "Conversion Funnel", requiredStatus: "review" }] },
        { docType: "KPI Dashboard", dependsOn: [{ area: "negocio", docType: "Métricas", requiredStatus: "draft" }] },
      ]},
    ],
  },

  cliente: {
    framework: "Double Diamond",
    author: "British Design Council",
    stages: [
      { id: "discover", title: "Discover", color: "#ff9500", docs: [
        { docType: "Research Brief", dependsOn: [] },
        { docType: "User Interviews", dependsOn: [] },
      ]},
      { id: "define", title: "Define", color: "#0071e3", docs: [
        { docType: "Customer Persona", dependsOn: [{ area: "cliente", docType: "User Interviews", requiredStatus: "review" }] },
        { docType: "Problem Statement", dependsOn: [{ area: "cliente", docType: "Customer Persona", requiredStatus: "draft" }] },
      ]},
      { id: "develop", title: "Develop", color: "#af52de", docs: [
        { docType: "Journey Map", dependsOn: [{ area: "cliente", docType: "Customer Persona", requiredStatus: "review" }] },
        { docType: "Wireframes", dependsOn: [{ area: "cliente", docType: "Journey Map", requiredStatus: "draft" }] },
      ]},
      { id: "deliver", title: "Deliver", color: "#34c759", docs: [
        { docType: "Usability Report", dependsOn: [{ area: "cliente", docType: "Wireframes", requiredStatus: "review" }] },
        { docType: "Design Spec", dependsOn: [{ area: "cliente", docType: "Usability Report", requiredStatus: "review" }] },
      ]},
    ],
  },

  legal: {
    framework: "EDRM",
    author: "EDRM Consortium",
    stages: [
      { id: "governance", title: "Governance", color: "#ff9500", docs: [
        { docType: "Requisitos Legales", dependsOn: [] },
        { docType: "Políticas", dependsOn: [] },
      ]},
      { id: "identification", title: "Identificación", color: "#0071e3", docs: [
        { docType: "Legal Hold", dependsOn: [{ area: "legal", docType: "Requisitos Legales", requiredStatus: "review" }] },
        { docType: "Inventario", dependsOn: [{ area: "legal", docType: "Políticas", requiredStatus: "draft" }] },
      ]},
      { id: "drafting", title: "Redacción", color: "#af52de", docs: [
        { docType: "Aviso de Privacidad", dependsOn: [{ area: "legal", docType: "Requisitos Legales", requiredStatus: "done" }] },
        { docType: "Términos y Condiciones", dependsOn: [{ area: "legal", docType: "Aviso de Privacidad", requiredStatus: "draft" }] },
        { docType: "Contratos", dependsOn: [{ area: "negocio", docType: "Lean Canvas", requiredStatus: "review" }] },
      ]},
      { id: "review", title: "Revisión", color: "#5856d6", docs: [
        { docType: "Review Checklist", dependsOn: [{ area: "legal", docType: "Aviso de Privacidad", requiredStatus: "review" }, { area: "legal", docType: "Términos y Condiciones", requiredStatus: "review" }] },
      ]},
      { id: "production", title: "Producción", color: "#34c759", docs: [
        { docType: "Compliance Report", dependsOn: [{ area: "legal", docType: "Review Checklist", requiredStatus: "done" }] },
      ]},
    ],
  },

  franquicia: {
    framework: "BPM Lifecycle",
    author: "ABPMP (BPM CBOK)",
    stages: [
      { id: "identification", title: "Identificación", color: "#ff9500", docs: [
        { docType: "Unit Economics", dependsOn: [{ area: "negocio", docType: "Lean Canvas", requiredStatus: "review" }] },
        { docType: "Process Inventory", dependsOn: [] },
      ]},
      { id: "discovery", title: "Discovery", color: "#ffcc00", docs: [
        { docType: "As-Is Process Map", dependsOn: [{ area: "franquicia", docType: "Process Inventory", requiredStatus: "draft" }] },
        { docType: "Manual de Franquicia", dependsOn: [{ area: "operaciones", docType: "Manual de Operaciones", requiredStatus: "review" }] },
      ]},
      { id: "analysis", title: "Análisis", color: "#0071e3", docs: [
        { docType: "Gap Analysis", dependsOn: [{ area: "franquicia", docType: "As-Is Process Map", requiredStatus: "review" }] },
        { docType: "Brand Guidelines", dependsOn: [] },
      ]},
      { id: "redesign", title: "Rediseño", color: "#af52de", docs: [
        { docType: "Checklist Apertura", dependsOn: [{ area: "franquicia", docType: "Manual de Franquicia", requiredStatus: "done" }] },
        { docType: "Territory Plan", dependsOn: [{ area: "franquicia", docType: "Unit Economics", requiredStatus: "done" }] },
      ]},
      { id: "implementation", title: "Implementación", color: "#5856d6", docs: [
        { docType: "Training Plan", dependsOn: [{ area: "franquicia", docType: "Checklist Apertura", requiredStatus: "review" }] },
        { docType: "Perfil Franquiciatario", dependsOn: [{ area: "franquicia", docType: "Manual de Franquicia", requiredStatus: "done" }] },
      ]},
      { id: "monitoring", title: "Monitoreo", color: "#34c759", docs: [
        { docType: "Auditoría", dependsOn: [{ area: "franquicia", docType: "Training Plan", requiredStatus: "done" }] },
        { docType: "KPI Dashboard", dependsOn: [{ area: "franquicia", docType: "Auditoría", requiredStatus: "draft" }] },
      ]},
    ],
  },

  operaciones: {
    framework: "PDCA (Deming Cycle)",
    author: "W. Edwards Deming",
    stages: [
      { id: "plan", title: "Plan", color: "#ff9500", docs: [
        { docType: "Process Mapping", dependsOn: [] },
        { docType: "SOP Draft", dependsOn: [{ area: "operaciones", docType: "Process Mapping", requiredStatus: "draft" }] },
      ]},
      { id: "do", title: "Do", color: "#0071e3", docs: [
        { docType: "Manual de Operaciones", dependsOn: [{ area: "operaciones", docType: "SOP Draft", requiredStatus: "review" }] },
        { docType: "Checklist Diario", dependsOn: [{ area: "operaciones", docType: "Manual de Operaciones", requiredStatus: "draft" }] },
      ]},
      { id: "check", title: "Check", color: "#af52de", docs: [
        { docType: "Métricas", dependsOn: [{ area: "operaciones", docType: "Checklist Diario", requiredStatus: "review" }] },
        { docType: "Audit Report", dependsOn: [{ area: "operaciones", docType: "Métricas", requiredStatus: "draft" }] },
      ]},
      { id: "act", title: "Act", color: "#34c759", docs: [
        { docType: "Retrospectiva", dependsOn: [{ area: "operaciones", docType: "Métricas", requiredStatus: "review" }] },
        { docType: "Improvement Plan", dependsOn: [{ area: "operaciones", docType: "Retrospectiva", requiredStatus: "review" }] },
      ]},
    ],
  },

  bitacora: {
    framework: "PMBOK (Closing)",
    author: "PMI",
    stages: [
      { id: "registro", title: "Registro", color: "#ff9500", docs: [
        { docType: "Entrada de Bitácora", dependsOn: [] },
        { docType: "Incident Report", dependsOn: [] },
      ]},
      { id: "analisis", title: "Análisis", color: "#0071e3", docs: [
        { docType: "Patterns", dependsOn: [{ area: "bitacora", docType: "Entrada de Bitácora", requiredStatus: "review" }] },
        { docType: "Trends", dependsOn: [{ area: "bitacora", docType: "Patterns", requiredStatus: "draft" }] },
      ]},
      { id: "decision", title: "Decisión", color: "#af52de", docs: [
        { docType: "Action Items", dependsOn: [{ area: "bitacora", docType: "Patterns", requiredStatus: "review" }] },
        { docType: "Decision Log", dependsOn: [{ area: "bitacora", docType: "Action Items", requiredStatus: "draft" }] },
      ]},
      { id: "archivo", title: "Archivo", color: "#34c759", docs: [
        { docType: "Retrospectiva", dependsOn: [{ area: "bitacora", docType: "Action Items", requiredStatus: "done" }] },
        { docType: "Lessons Learned", dependsOn: [{ area: "bitacora", docType: "Retrospectiva", requiredStatus: "review" }] },
      ]},
    ],
  },
};

/**
 * Generate a fresh workflow.json for a given area.
 * Each doc starts as "not-started" with its dependencies pre-configured.
 */
export function generateWorkflow(areaId) {
  const template = WORKFLOW_TEMPLATES[areaId];
  if (!template) return null;

  return {
    workflowVersion: 2,
    areaId,
    framework: template.framework,
    author: template.author,
    editable: true,
    stages: template.stages.map((s, i) => ({
      id: s.id,
      title: s.title,
      order: i,
      color: s.color,
      docs: s.docs.map((d) => ({
        id: `doc-${uid()}`,
        docType: d.docType,
        status: "not-started",
        pagePath: null,
        dependsOn: d.dependsOn,
      })),
    })),
  };
}

/**
 * Resolve dependency status. Returns { met, unmet } arrays.
 */
export function resolveDependencies(doc, allWorkflows) {
  const met = [];
  const unmet = [];
  const statusOrder = { "not-started": 0, "draft": 1, "review": 2, "done": 3 };

  for (const dep of doc.dependsOn || []) {
    const wf = allWorkflows[dep.area];
    if (!wf) { unmet.push({ ...dep, currentStatus: "not-found" }); continue; }

    let found = false;
    for (const stage of wf.stages) {
      for (const d of stage.docs) {
        if (d.docType === dep.docType) {
          found = true;
          const current = statusOrder[d.status] || 0;
          const required = statusOrder[dep.requiredStatus] || 0;
          if (current >= required) {
            met.push({ ...dep, currentStatus: d.status });
          } else {
            unmet.push({ ...dep, currentStatus: d.status });
          }
        }
      }
    }
    if (!found) unmet.push({ ...dep, currentStatus: "not-found" });
  }

  return { met, unmet };
}

/**
 * Generate a blank custom workflow.
 */
export function generateCustomWorkflow(name, stages) {
  return {
    workflowVersion: 2,
    areaId: "custom",
    framework: "Personalizado",
    author: "Usuario",
    editable: true,
    stages: stages.map((s, i) => ({
      id: s.id || uid(),
      title: s.title,
      order: i,
      color: s.color || "#8e8e93",
      docs: [],
    })),
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
    totalDocs: t.stages.reduce((sum, s) => sum + s.docs.length, 0),
  }));
}
