import { ArrowLeft, FileText, Plus, CheckCircle, Circle, Clock, AlertTriangle, Lock } from "lucide-react";
import { STATUSES, resolveDependencies } from "@/lib/workflow-definitions";

/**
 * WorkflowBoard — shows doc status + dependency chain per stage.
 *
 * Each card shows:
 * - Status badge (not-started / draft / review / done)
 * - Linked doc (if exists) or create button
 * - Dependency warnings (unmet preconditions)
 */
export function WorkflowBoard({ workflow, allWorkflows, pages, onOpenDoc, onCreateDoc, onUpdateStatus, onLinkDoc, onClose }) {
  // Map existing pages to workflow docs by title matching
  const pageMap = {};
  for (const p of pages) pageMap[p.title.toLowerCase()] = p;

  // Count progress
  const allDocs = workflow.stages.flatMap((s) => s.docs);
  const doneDocs = allDocs.filter((d) => d.status === "done").length;
  const totalDocs = allDocs.length;
  const progressPercent = totalDocs > 0 ? Math.round((doneDocs / totalDocs) * 100) : 0;

  const statusIcon = (status) => {
    if (status === "done") return <CheckCircle size={13} className="wf-status-done" />;
    if (status === "review") return <Clock size={13} className="wf-status-review" />;
    if (status === "draft") return <FileText size={13} className="wf-status-draft" />;
    return <Circle size={13} className="wf-status-not-started" />;
  };

  return (
    <div className="wf-board">
      <div className="wf-header">
        <button className="wf-back" onClick={onClose}>
          <ArrowLeft size={14} /> Volver
        </button>
        <div className="wf-info">
          <h2>{workflow.framework}</h2>
          <span className="wf-author">{workflow.author}</span>
        </div>
        <div className="wf-progress-label">
          {doneDocs}/{totalDocs} completados · {progressPercent}%
        </div>
      </div>

      <div className="wf-progress">
        <div className="wf-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="wf-columns">
        {workflow.stages.map((stage) => {
          const stageDone = stage.docs.every((d) => d.status === "done");
          const stageProgress = stage.docs.filter((d) => d.status === "done").length;

          return (
            <div className="wf-column" key={stage.id}>
              <div className="wf-column-header" style={{ borderTopColor: stage.color }}>
                <span className="wf-column-title">{stage.title}</span>
                {stageDone ? (
                  <CheckCircle size={13} style={{ color: "#34c759" }} />
                ) : (
                  <span className="wf-column-count">{stageProgress}/{stage.docs.length}</span>
                )}
              </div>
              <div className="wf-column-body">
                {stage.docs.map((doc) => {
                  const deps = resolveDependencies(doc, allWorkflows || { [workflow.areaId]: workflow });
                  const blocked = deps.unmet.length > 0;
                  const linked = doc.pagePath ? pages.find((p) => p.pagePath === doc.pagePath) : null;
                  const autoLinked = !linked ? pageMap[doc.docType.toLowerCase()] : null;
                  const hasDoc = linked || autoLinked;

                  return (
                    <div key={doc.id} className={`wf-card ${blocked ? "wf-card-blocked" : ""} wf-card-${doc.status}`}>
                      {/* Status + type */}
                      <div className="wf-card-top">
                        {blocked ? <Lock size={12} className="wf-status-blocked" /> : statusIcon(doc.status)}
                        <span className="wf-card-type">{doc.docType}</span>
                      </div>

                      {/* Linked doc or create */}
                      {hasDoc ? (
                        <button className="wf-card-doc" onClick={() => onOpenDoc(hasDoc)}>
                          <FileText size={11} />
                          <span>{hasDoc.title}</span>
                        </button>
                      ) : (
                        <button
                          className="wf-card-create"
                          onClick={() => !blocked && onCreateDoc(workflow.areaId, doc.docType)}
                          disabled={blocked}
                        >
                          <Plus size={11} />
                          <span>{blocked ? "Bloqueado" : "Crear documento"}</span>
                        </button>
                      )}

                      {/* Status selector */}
                      {!blocked && (
                        <div className="wf-card-statuses">
                          {STATUSES.map((s) => (
                            <button
                              key={s.id}
                              className={`wf-status-btn ${doc.status === s.id ? "active" : ""}`}
                              style={doc.status === s.id ? { background: s.color, color: "white" } : {}}
                              onClick={() => onUpdateStatus(stage.id, doc.id, s.id)}
                              title={s.label}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Dependencies */}
                      {deps.unmet.length > 0 && (
                        <div className="wf-card-deps">
                          <AlertTriangle size={10} />
                          <span>Requiere: {deps.unmet.map((d) => `${d.docType} (${d.requiredStatus})`).join(", ")}</span>
                        </div>
                      )}
                      {deps.met.length > 0 && deps.unmet.length === 0 && (
                        <div className="wf-card-deps wf-card-deps-met">
                          <CheckCircle size={10} />
                          <span>Dependencias cumplidas</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
