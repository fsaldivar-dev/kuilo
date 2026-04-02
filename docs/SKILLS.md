# Skills (Claude Code)

15 skills para automatizar el flujo de desarrollo de Kuilo.

## Uso

Escribe `/skill-name` en Claude Code para invocar cualquier skill.

## Skills disponibles

### Workflow
| Skill | Que hace |
|---|---|
| `/pr` | Flujo completo: test → arch → docs → preview → snapshots → changelog → PR |
| `/test` | Corre unit + E2E, reporta timing y errores clasificados |
| `/docs` | Actualiza toda la documentacion para matchear el codigo |
| `/preview` | Captura screenshots de features nuevas e inserta en docs |
| `/snapshots` | Actualiza baselines de visual regression |
| `/changelog` | Genera changelog desde git log (en espanol) |

### Calidad
| Skill | Que hace |
|---|---|
| `/arch-review` | Valida arquitectura vs CLAUDE.md, detecta archivos grandes |
| `/ui-review` | Evalua UI contra Nielsen's 10 heuristics + WCAG |
| `/design-system` | Extrae tokens CSS, detecta inconsistencias de diseno |
| `/dead-code` | Encuentra exports, componentes y CSS sin usar |
| `/bundle-audit` | Analiza tamano del bundle, sugiere optimizaciones |
| `/security-review` | Audita seguridad de Electron: preload, CSP, eval |

### Producto
| Skill | Que hace |
|---|---|
| `/feature-brief` | Genera user stories + archivos afectados para una feature |
| `/api-docs` | Genera referencia completa de IPC + MCP APIs |
| `/tutorial` | Genera guia paso a paso con screenshots |

## Flujo automatico (/pr)

```
/pr "titulo" minor
│
├── 1. /test
├── 2. /arch-review
├── 3. /docs
├── 4. /preview
├── 5. /snapshots
├── 6. /changelog
├── 7. /test (re-run)
├── 8. commit + push
├── 9. gh pr create
└── 10. watch CI
```
