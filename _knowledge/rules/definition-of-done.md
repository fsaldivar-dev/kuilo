# Definition of Done por tipo de documento

## Cuándo un documento pasa de un status a otro

### not-started → draft
- El documento fue creado (existe en el vault)
- Tiene al menos las secciones principales (no necesitan estar completas)

### draft → review
- Todas las secciones están llenas con contenido real (no placeholder)
- Los datos vienen de fuentes reales (entrevistas, métricas, research) — no suposiciones
- Las dependencias previas están en review o done
- Linkea a los documentos que referencia (PRD linkea al Lean Canvas, RFC linkea al PRD)

### review → done
- Al menos 1 persona (además del autor) lo revisó
- Los feedback points fueron incorporados o explícitamente descartados con razón
- La checklist de review del tipo de doc está completa
- Las métricas de éxito (si aplica) tienen thresholds definidos

## Reglas por tipo de doc

| Tipo | draft → review | review → done |
|------|---------------|---------------|
| **Lean Canvas** | 9 secciones llenas | Validado con ≥5 interviews |
| **Customer Persona** | Basado en datos reales | Equipo lo usa como referencia |
| **PRD** | Scope claro + métricas | Equipo entiende qué construir |
| **RFC** | ≥2 alternativas + trade-offs | Decisión tomada (accepted/rejected) |
| **API Spec** | Endpoints documentados | Contratos validados con frontend |
| **Sprint Plan** | Scope fijo + estimación | Equipo committed |
| **Runbook** | Deploy + rollback documentados | Probado en staging |
| **Launch Plan** | Checklist completa | Legal + marketing + ops aprobaron |
