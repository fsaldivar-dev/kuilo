# Documentation Workflow Pipeline


![Workflows](screenshots/overview.png)

Pipelines de documentación basados en metodologías reales. Cada área de proyecto tiene su propio flujo con etapas, estados y dependencias.

## Uso

1. Crea un proyecto con el **Wizard** (elige tipo: App, Startup, etc.)
2. En el sidebar, click en el icono de **grid** (◫) en cualquier paquete
3. El board muestra las etapas de la metodología con los docs esperados
4. Cambia el estado de cada doc: No iniciado → Borrador → En revisión → Completado
5. Los docs bloqueados muestran sus dependencias (qué necesitan para desbloquearse)
6. Click en un doc existente → abre en el editor
7. Click en "Crear documento" → crea el doc desde template

## Metodologías

| Área | Framework | Autor |
|------|-----------|-------|
| Técnico | arc42 + Shape Up | Starke + Basecamp |
| Producto | Stage-Gate | Robert Cooper |
| Negocio | Lean Startup + BMC | Ries + Osterwalder |
| Marketing | RACE | Dave Chaffey |
| Cliente | Double Diamond | British Design Council |
| Legal | EDRM | EDRM Consortium |
| Franquicia | BPM Lifecycle | ABPMP |
| Operaciones | PDCA | Deming |
| Bitácora | PMBOK | PMI |

## Estados

- **No iniciado** (gris) — sin contenido
- **Borrador** (naranja) — en progreso
- **En revisión** (azul) — listo para feedback
- **Completado** (verde) — aprobado

## Dependencias

Los docs pueden tener precondiciones cross-área:
- PRD (técnico) requiere Lean Canvas (negocio) en borrador
- Launch Plan (producto) requiere Aviso de Privacidad (legal) completado
- Contratos (legal) requiere Lean Canvas (negocio) en revisión

Un doc bloqueado muestra 🔒 y no se puede crear hasta que sus dependencias se cumplan.

## Almacenamiento

Cada paquete tiene un `workflow.json` que guarda etapas, docs, estados y dependencias. Se genera automáticamente al crear un proyecto con el wizard.
