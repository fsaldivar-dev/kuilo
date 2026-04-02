# Knowledge Base

Base de conocimiento integrada que permite al AI entender metodologias, guiar el proceso de documentacion, y validar calidad.

## Estructura

```
_knowledge/
├── graph.json                    → Grafo de ejecucion (7 fases)
├── methodologies/
│   ├── shape-up.md               → arc42 + Shape Up
│   ├── stage-gate.md             → Stage-Gate (Robert Cooper)
│   └── lean-startup.md           → Lean Startup (Eric Ries)
├── tutorials/
│   ├── how-to-write-prd.md       → Paso a paso para PRDs
│   ├── how-to-write-rfc.md       → Estructura de RFCs
│   └── how-to-write-lean-canvas.md
└── rules/
    ├── definition-of-done.md     → Cuando un doc esta "done"
    └── review-checklist.md       → Que revisar antes de aprobar
```

## MCP Tools (6)

| Tool | Que hace |
|---|---|
| `get_execution_graph` | "Por donde empiezo?" → Fase 1: Lean Canvas + Research |
| `get_next_actions` | "Que me falta?" → Progreso por area + siguientes pasos |
| `get_workflow_status` | "Como va tecnico?" → 3/7 done, RFC bloqueado |
| `get_methodology` | "Que es Shape Up?" → Guia completa con etapas |
| `get_tutorial` | "Como escribo un PRD?" → Estructura + errores comunes |
| `get_rules` | "Cuando esta done un RFC?" → Checklist con criterios |

## Uso con AI

El AI (via Claude Desktop, Cursor, o Gemini CLI con MCP) puede:
- Guiar al usuario sobre que documentar primero
- Explicar metodologias y cuando usarlas
- Validar si un documento cumple los criterios de calidad
- Sugerir documentos relacionados que faltan
