import { ArrowLeft, FileText, Plus, CheckCircle, Circle } from "lucide-react";

/**
 * WorkflowBoard — auto-populated from existing docs in the package.
 *
 * Each stage shows:
 * - Docs that already exist (clickable, navigates to editor)
 * - Doc types that are missing (button to create from template)
 * - Progress indicator per stage
 */
export function WorkflowBoard({ workflow, pages, onOpenDoc, onCreateDoc, onClose }) {
  // Map existing docs to stages by matching doc title/type to stage docTypes
  const docsByStage = {};
  const matchedDocs = new Set();

  for (const stage of workflow.stages) {
    docsByStage[stage.id] = { existing: [], missing: [] };

    for (const docType of stage.docTypes || []) {
      const dtLower = docType.toLowerCase();
      const match = pages.find((p) =>
        !matchedDocs.has(p.pagePath) && (
          p.title.toLowerCase().includes(dtLower) ||
          dtLower.includes(p.title.toLowerCase().split(" ")[0])
        )
      );

      if (match) {
        matchedDocs.add(match.pagePath);
        docsByStage[stage.id].existing.push({ ...match, docType });
      } else {
        docsByStage[stage.id].missing.push(docType);
      }
    }
  }

  // Unmatched docs go in the first stage
  const unmatchedDocs = pages.filter((p) => !matchedDocs.has(p.pagePath));
  if (unmatchedDocs.length && workflow.stages[0]) {
    for (const doc of unmatchedDocs) {
      docsByStage[workflow.stages[0].id].existing.push({ ...doc, docType: "Doc" });
    }
  }

  // Progress
  const totalDocTypes = workflow.stages.reduce((sum, s) => sum + (s.docTypes?.length || 0), 0);
  const totalExisting = Object.values(docsByStage).reduce((sum, s) => sum + s.existing.length, 0);
  const progressPercent = totalDocTypes > 0 ? Math.round((totalExisting / totalDocTypes) * 100) : 0;

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
          {totalExisting}/{totalDocTypes} docs · {progressPercent}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="wf-progress">
        <div className="wf-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Stages */}
      <div className="wf-columns">
        {workflow.stages.map((stage) => {
          const data = docsByStage[stage.id];
          const stageComplete = data.missing.length === 0 && data.existing.length > 0;

          return (
            <div className="wf-column" key={stage.id}>
              <div className="wf-column-header" style={{ borderTopColor: stage.color }}>
                <span className="wf-column-title">{stage.title}</span>
                {stageComplete ? (
                  <CheckCircle size={13} style={{ color: stage.color }} />
                ) : (
                  <span className="wf-column-count">{data.existing.length}/{data.existing.length + data.missing.length}</span>
                )}
              </div>
              <div className="wf-column-body">
                {/* Existing docs */}
                {data.existing.map((doc) => (
                  <button
                    key={doc.pagePath}
                    className="wf-card wf-card-exists"
                    onClick={() => onOpenDoc(doc)}
                  >
                    <CheckCircle size={12} className="wf-card-check" />
                    <div className="wf-card-content">
                      <span className="wf-card-type">{doc.docType}</span>
                      <span className="wf-card-title">{doc.title}</span>
                    </div>
                  </button>
                ))}

                {/* Missing docs — create buttons */}
                {data.missing.map((docType) => (
                  <button
                    key={docType}
                    className="wf-card wf-card-missing"
                    onClick={() => onCreateDoc(workflow.areaId, docType)}
                  >
                    <Circle size={12} className="wf-card-circle" />
                    <div className="wf-card-content">
                      <span className="wf-card-type">{docType}</span>
                      <span className="wf-card-action">Click para crear</span>
                    </div>
                    <Plus size={12} className="wf-card-plus" />
                  </button>
                ))}

                {data.existing.length === 0 && data.missing.length === 0 && (
                  <div className="wf-empty">Sin documentos para esta etapa</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
