/**
 * slash-commands.js
 * Definición y filtrado de los slash commands del editor.
 */

import { PAGE_TEMPLATES } from "@/lib/page-templates";

export const SLASH_COMMANDS = [
  {
    id: "h1",
    title: "Heading 1",
    description: "Título principal de sección",
    keywords: ["h1", "heading", "titulo", "title", "encabezado", "1"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    id: "h2",
    title: "Heading 2",
    description: "Subtítulo de sección",
    keywords: ["h2", "heading", "subtitle", "subtitulo", "encabezado", "2"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    id: "h3",
    title: "Heading 3",
    description: "Encabezado de tercer nivel",
    keywords: ["h3", "heading", "encabezado", "3"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    id: "bullet-list",
    title: "Bullet List",
    description: "Lista con viñetas",
    keywords: ["bullet", "ul", "list", "lista", "viñeta", "unordered"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    id: "ordered-list",
    title: "Ordered List",
    description: "Lista numerada",
    keywords: ["ol", "ordered", "numbered", "numerada", "lista", "number"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    id: "task-list",
    title: "Task List",
    description: "Lista de tareas con checkboxes",
    keywords: ["task", "todo", "check", "checkbox", "checklist", "tareas"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    id: "quote",
    title: "Quote",
    description: "Bloque de cita",
    keywords: ["quote", "blockquote", "cita", "citation"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    id: "code-block",
    title: "Code Block",
    description: "Bloque de código con sintaxis",
    keywords: ["code", "codeblock", "codigo", "syntax", "pre"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    id: "divider",
    title: "Divider",
    description: "Línea divisora horizontal",
    keywords: ["divider", "hr", "horizontal", "rule", "separador", "linea"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    id: "image",
    title: "Image",
    description: "Insertar imagen desde tu equipo",
    keywords: ["image", "img", "photo", "foto", "imagen", "picture"],
    execute: ({ editor, range }) => {
      // Elimina el trigger y activa el upload node
      editor.chain().focus().deleteRange(range).run();
      // Dispara el file picker del ImageUploadNode si está disponible
      const uploadTrigger = document.querySelector("[data-image-upload-trigger]");
      uploadTrigger?.click();
    },
  },
  {
    id: "mermaid",
    title: "Mermaid Diagram",
    description: "Diagrama con preview visual (flowchart, sequence, ER…)",
    keywords: ["mermaid", "diagram", "diagrama", "flowchart", "sequence", "er", "graph"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range)
        .insertContent({
          type: "codeBlock",
          attrs: { language: "mermaid" },
          content: [{ type: "text", text: "flowchart TD\n    A[Inicio] --> B{¿Condición?}\n    B -->|Sí| C[Resultado]\n    B -->|No| D[Fin]" }],
        })
        .run();
    },
  },
  {
    id: "toggle",
    title: "Toggle List",
    description: "Bloque colapsable con contenido",
    keywords: ["toggle", "collapse", "expand", "colapsar", "details", "acordeon"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertToggleList().run();
    },
  },
  {
    id: "table",
    title: "Table",
    description: "Tabla con filas y columnas",
    keywords: ["table", "tabla", "grid", "spreadsheet"],
    execute: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    id: "kanban",
    title: "Kanban Board",
    description: "Tablero con columnas y tarjetas arrastrables",
    keywords: ["kanban", "board", "tablero", "task", "tarea", "trello", "jira", "sprint"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertKanban().run();
    },
  },
  {
    id: "chart",
    title: "Chart",
    description: "Grafica de barras, lineas, area o pie",
    keywords: ["chart", "grafica", "graph", "bar", "line", "pie", "kpi", "metrics", "metricas"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertChart().run();
    },
  },
  {
    id: "api-endpoint",
    title: "API Endpoint",
    description: "Documentar un endpoint REST con método, params y responses",
    keywords: ["api", "endpoint", "rest", "swagger", "http", "request", "response"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertApiEndpoint().run();
    },
  },
  {
    id: "callout-note",
    title: "Note",
    description: "Callout informativo",
    keywords: ["note", "callout", "info", "nota", "admonition"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertCallout("note").run();
    },
  },
  {
    id: "callout-tip",
    title: "Tip",
    description: "Consejo o buena práctica",
    keywords: ["tip", "callout", "consejo", "hint", "sugerencia"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertCallout("tip").run();
    },
  },
  {
    id: "callout-warning",
    title: "Warning",
    description: "Advertencia importante",
    keywords: ["warning", "callout", "advertencia", "cuidado", "alert"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertCallout("warning").run();
    },
  },
  {
    id: "callout-caution",
    title: "Caution",
    description: "Precaución — riesgo de error o pérdida",
    keywords: ["caution", "callout", "danger", "peligro", "error"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertCallout("caution").run();
    },
  },
  {
    id: "callout-important",
    title: "Important",
    description: "Información crítica que no debe ignorarse",
    keywords: ["important", "callout", "importante", "critical", "critico"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertCallout("important").run();
    },
  },
  {
    id: "math",
    title: "Math Equation",
    description: "Ecuación LaTeX con renderizado KaTeX",
    keywords: ["math", "equation", "latex", "katex", "formula", "ecuacion", "matematica"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertMathBlock({ latex: "E = mc^2" }).run();
    },
  },
  {
    id: "columns-2",
    title: "2 Columns",
    description: "Layout de dos columnas lado a lado",
    keywords: ["columns", "columnas", "2", "layout", "side", "split"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertColumns(2).run();
    },
  },
  {
    id: "columns-3",
    title: "3 Columns",
    description: "Layout de tres columnas",
    keywords: ["columns", "columnas", "3", "layout", "triple"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertColumns(3).run();
    },
  },
  {
    id: "toc",
    title: "Table of Contents",
    description: "Índice automático de headings del documento",
    keywords: ["toc", "contents", "index", "indice", "contenido", "table"],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTableOfContents().run();
    },
  },
  // ── Templates generados desde page-templates.js ──
  ...PAGE_TEMPLATES.filter((tpl) => tpl.id !== "blank").map((tpl) => ({
    id: `template-${tpl.id}`,
    title: `${tpl.icon} ${tpl.title}`,
    description: tpl.description,
    keywords: ["template", "plantilla", ...tpl.id.split("-")],
    execute: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent(tpl.blocks).run();
    },
  })),
];

// ─── filterCommands ───────────────────────────────────────────────────────────

/**
 * Filtra y ordena comandos por relevancia para la query dada.
 * - Coincidencia exacta de id → primera posición
 * - Coincidencia de keyword exacta → segunda posición
 * - Coincidencia parcial en title o keywords → resto
 */
export const filterCommands = (query) => {
  if (!query) return SLASH_COMMANDS;

  const q = query.toLowerCase().trim();
  if (!q) return SLASH_COMMANDS;

  const exactId     = [];
  const exactKw     = [];
  const partialRest = [];

  for (const cmd of SLASH_COMMANDS) {
    if (cmd.id === q) {
      exactId.push(cmd);
      continue;
    }
    if (cmd.keywords.includes(q)) {
      exactKw.push(cmd);
      continue;
    }
    const titleMatch = cmd.title.toLowerCase().includes(q);
    const kwMatch    = cmd.keywords.some((k) => k.includes(q));
    if (titleMatch || kwMatch) {
      partialRest.push(cmd);
    }
  }

  return [...exactId, ...exactKw, ...partialRest];
};
