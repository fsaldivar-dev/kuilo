# Diagramas

Kuilo soporta diagramas visuales con dos motores: **React Flow** (editor visual) y **Mermaid** (fallback para tipos complejos).

## Editor visual (React Flow)

Al insertar un diagrama con `/mermaid`, el preview se renderiza con React Flow.

### Click para editar

Click en el diagrama abre un **editor fullscreen** con:
- **Canvas** — drag nodes, conectar con flechas, zoom, pan
- **Paleta de formas** — rectángulo, redondeado, diamante, círculo
- **Selector de tipo** — Flowchart, State, Class, ER, Mindmap
- **Panel de propiedades** — editar texto y forma del nodo seleccionado
- **Atajos** — Delete elimina, Escape guarda y cierra

### Tipos soportados

| Tipo | Keyword | Nodos | Edges |
|---|---|---|---|
| Flowchart | `flowchart TD/LR` | Shapes con texto | Flechas con labels |
| State Diagram | `stateDiagram-v2` | States | Transiciones |
| Class Diagram | `classDiagram` | Classes | Herencia |
| ER Diagram | `erDiagram` | Entidades | Relaciones |
| Mindmap | `mindmap` | Topics | Parent-child |
| Sequence | `sequenceDiagram` | Actores | Mensajes |
| Gantt | `gantt` | Tareas | Secuencia |
| Git Graph | `gitGraph` | Commits | Branches |

### Plantillas

Al cambiar el tipo de diagrama en el editor, se carga una plantilla con nodos de ejemplo listos para editar.

## Export

Los diagramas se exportan como bloques ` ```mermaid ` en Markdown — compatibles con GitHub, Obsidian, y cualquier visor que soporte Mermaid.

## Shapes

Cada forma tiene un color de borde distinto para identificarla de un vistazo:
- **Rectángulo** (azul) — procesos, acciones
- **Redondeado** (verde) — inicio/fin, estados
- **Diamante** (naranja) — decisiones, condiciones
- **Círculo** (morado) — eventos, puntos de control
