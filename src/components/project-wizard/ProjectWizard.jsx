/**
 * ProjectWizard — setup wizard for new documentation projects.
 * Asks questions, then creates packages + initial documents.
 */

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Rocket, Loader2 } from "lucide-react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import "./project-wizard.scss";

const AREAS = [
  { id: "producto",     icon: "📦", label: "Producto",     desc: "PRDs, roadmap, features, specs", docs: ["PRD inicial", "Roadmap"] },
  { id: "tecnico",      icon: "⚙️", label: "Técnico",      desc: "Arquitectura, APIs, runbooks, stack", docs: ["Stack técnico", "API Spec", "Runbook"] },
  { id: "negocio",      icon: "💼", label: "Negocio",       desc: "Modelo de negocio, pricing, métricas", docs: ["Lean Canvas", "Modelo de pricing"] },
  { id: "marketing",    icon: "📣", label: "Marketing",     desc: "Plan de marketing, canales, contenido", docs: ["Plan de marketing", "Canales de adquisición"] },
  { id: "legal",        icon: "⚖️", label: "Legal",         desc: "Contratos, privacidad, términos", docs: ["Aviso de privacidad", "Términos y condiciones"] },
  { id: "operaciones",  icon: "🔧", label: "Operaciones",   desc: "Procesos del día a día, playbooks", docs: ["Manual de operaciones", "Checklist diario"] },
  { id: "cliente",      icon: "👤", label: "Cliente",        desc: "Personas, journey, soporte, FAQ", docs: ["Customer persona", "Customer journey"] },
  { id: "franquicia",   icon: "🏪", label: "Franquicia",     desc: "Manual para replicar el negocio", docs: ["Manual de franquicia", "Checklist de apertura"] },
  { id: "bitacora",     icon: "📝", label: "Bitácora",       desc: "Registro de éxitos, fracasos, lecciones", docs: ["Bitácora del proyecto"] },
];

const PRESETS = [
  { id: "todo",       label: "Proyecto completo",         desc: "Todas las áreas — para documentar un negocio entero", areas: AREAS.map(a => a.id) },
  { id: "app",        label: "App / Software",             desc: "Producto + técnico + cliente", areas: ["producto", "tecnico", "cliente"] },
  { id: "startup",    label: "Startup / Emprendimiento",   desc: "Negocio + producto + marketing + legal", areas: ["negocio", "producto", "marketing", "legal", "bitacora"] },
  { id: "franchise",  label: "Franquicia",                 desc: "Operaciones + franquicia + negocio", areas: ["operaciones", "franquicia", "negocio", "cliente"] },
  { id: "custom",     label: "Personalizado",              desc: "Elige exactamente qué áreas necesitas", areas: [] },
];

const api = window.notesApi;

export function ProjectWizard({ onComplete, onClose }) {
  const wizardRef = useRef(null);
  useFocusTrap(wizardRef, true);
  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [vaultPath, setVaultPath] = useState("");
  const [preset, setPreset] = useState(null);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");

  const toggleArea = (id) => {
    setSelectedAreas((prev) => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const selectPreset = (p) => {
    setPreset(p.id);
    if (p.id !== "custom") {
      setSelectedAreas(p.areas);
    }
  };

  const choosePath = async () => {
    if (api?.chooseOrCreateFolder) {
      const result = await api.chooseOrCreateFolder();
      if (result?.path) setVaultPath(result.path);
    } else if (api?.openVaultDialog) {
      const result = await api.openVaultDialog();
      if (result?.changed) setVaultPath(result.vaultPath);
    }
  };

  const [creating, setCreating] = useState(false);

  const handleCreate = () => {
    setCreating(true);
    const areas = AREAS.filter(a => selectedAreas.includes(a.id));
    onComplete({ projectName, projectDesc, vaultPath, areas, githubUrl, githubToken });
  };

  const canNext = () => {
    if (step === 0) return projectName.trim().length > 0 && vaultPath.length > 0;
    if (step === 1) return preset !== null;
    if (step === 2) return selectedAreas.length > 0;
    return true;
  };

  return createPortal(
    <div className="wizard-overlay">
      <div className="wizard-container" ref={wizardRef}>
        {/* Header */}
        <div className="wizard-header">
          <div className="wizard-steps">
            {["Proyecto", "Tipo", "Áreas", "Backup", "Crear"].map((s, i) => (
              <span key={i} className={`wizard-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
                {i < step ? "✓" : i + 1}. {s}
              </span>
            ))}
          </div>
          <button className="wizard-close" onClick={onClose} aria-label="Cerrar wizard"><X size={18} /></button>
        </div>

        {/* Step 0: Project info */}
        {step === 0 && (
          <div className="wizard-body">
            <h2>¿Cómo se llama tu proyecto?</h2>
            <p className="wizard-subtitle">Este será el nombre de tu workspace de documentación.</p>
            <input
              className="wizard-input"
              placeholder="ej. SajaruBox, Mi Tienda, App de Fitness..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              autoFocus
            />
            <input
              className="wizard-input secondary"
              placeholder="Descripción breve (opcional)"
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
            />

            <div className="wizard-path-row">
              <div className="wizard-path-display">
                {vaultPath ? (
                  <code className="wizard-path-value">{vaultPath}</code>
                ) : (
                  <span className="wizard-path-empty">Sin carpeta seleccionada</span>
                )}
              </div>
              <button className="wizard-btn secondary" onClick={choosePath}>
                Elegir carpeta
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Preset selection */}
        {step === 1 && (
          <div className="wizard-body">
            <h2>¿Qué tipo de proyecto es?</h2>
            <p className="wizard-subtitle">Elige un preset o personaliza las áreas.</p>
            <div className="wizard-presets">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={`wizard-preset ${preset === p.id ? "selected" : ""}`}
                  onClick={() => selectPreset(p)}
                >
                  <strong>{p.label}</strong>
                  <span>{p.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Area selection (always shown, editable) */}
        {step === 2 && (
          <div className="wizard-body">
            <h2>Áreas de documentación</h2>
            <p className="wizard-subtitle">Selecciona las áreas que necesitas. Cada una creará un paquete con documentos iniciales.</p>
            <div className="wizard-areas">
              {AREAS.map((area) => (
                <button
                  key={area.id}
                  className={`wizard-area ${selectedAreas.includes(area.id) ? "selected" : ""}`}
                  onClick={() => toggleArea(area.id)}
                >
                  <span className="wizard-area-icon">{area.icon}</span>
                  <div className="wizard-area-info">
                    <strong>{area.label}</strong>
                    <span>{area.desc}</span>
                  </div>
                  <div className="wizard-area-check">{selectedAreas.includes(area.id) ? "✓" : ""}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: GitHub backup (optional) */}
        {step === 3 && (
          <div className="wizard-body">
            <h2>Backup en GitHub (opcional)</h2>
            <p className="wizard-subtitle">Vincula un repositorio para respaldar tu documentación automáticamente. Puedes saltarte este paso.</p>
            <input
              className="wizard-input"
              placeholder="https://github.com/usuario/repo.git"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
            <input
              className="wizard-input secondary"
              type="password"
              placeholder="Personal Access Token (ghp_...)"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />
            <callout type="tip">
            </callout>
            <button
              className="wizard-btn secondary"
              style={{ marginTop: 8, width: "100%" }}
              onClick={() => window.open("https://github.com/settings/tokens/new?scopes=repo&description=Kuilo+Backup", "_blank")}
            >
              Crear token en GitHub →
            </button>
            <div className="wizard-github-help">
              <p>1. Click en "Crear token en GitHub" — se abre con los permisos pre-seleccionados</p>
              <p>2. Click en <strong>"Generate token"</strong></p>
              <p>3. Copia el token (empieza con <code>ghp_</code>) y pégalo arriba</p>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="wizard-body">
            <h2>Listo para crear</h2>
            <div className="wizard-summary">
              <div className="wizard-summary-item">
                <span className="wizard-summary-label">Proyecto</span>
                <span className="wizard-summary-value">{projectName}</span>
              </div>
              {projectDesc && (
                <div className="wizard-summary-item">
                  <span className="wizard-summary-label">Descripción</span>
                  <span className="wizard-summary-value">{projectDesc}</span>
                </div>
              )}
              <div className="wizard-summary-item">
                <span className="wizard-summary-label">Carpeta</span>
                <code className="wizard-summary-value" style={{fontSize: 11}}>{vaultPath}</code>
              </div>
              <div className="wizard-summary-item">
                <span className="wizard-summary-label">Áreas</span>
                <span className="wizard-summary-value">{selectedAreas.length} paquetes</span>
              </div>
              {githubUrl && (
                <div className="wizard-summary-item">
                  <span className="wizard-summary-label">GitHub</span>
                  <span className="wizard-summary-value">✓ Vinculado</span>
                </div>
              )}
              <div className="wizard-summary-docs">
                {AREAS.filter(a => selectedAreas.includes(a.id)).map((area) => (
                  <div key={area.id} className="wizard-summary-pkg">
                    <span>{area.icon} {area.label}</span>
                    <ul>{area.docs.map((d, i) => <li key={i}>{d}</li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="wizard-footer">
          {step > 0 && (
            <button className="wizard-btn secondary" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={14} /> Anterior
            </button>
          )}
          <div className="wizard-spacer" />
          {step < 4 ? (
            <button
              className="wizard-btn primary"
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              title={!canNext() ? (step === 0 ? "Ingresa un nombre y selecciona carpeta" : step === 1 ? "Selecciona un tipo" : step === 2 ? "Selecciona al menos un área" : "") : ""}
            >
              Siguiente <ChevronRight size={14} />
            </button>
          ) : (
            <button className="wizard-btn create" onClick={handleCreate} disabled={creating}>
              {creating ? <><Loader2 size={14} className="ai-chat-spinner" /> Creando...</> : <><Rocket size={14} /> Crear proyecto</>}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
