/**
 * page-templates.js
 * Plantillas lean para documentación — mantenidas por una persona.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

const tx = (text, marks) => text ? (marks ? { type: "text", text, marks } : { type: "text", text }) : null;
const b = (text) => tx(text, [{ type: "bold" }]);
const p = (...c) => ({ type: "paragraph", content: c.filter(Boolean) });
const h = (level, text) => ({ type: "heading", attrs: { level }, content: [tx(text)].filter(Boolean) });
const li = (text) => ({ type: "listItem", content: [{ type: "paragraph", content: text ? [{ type: "text", text }] : [] }] });
const ul = (...items) => ({ type: "bulletList", content: items.map(x => typeof x === "string" ? li(x) : x) });
const task = (text) => ({ type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: text ? [{ type: "text", text }] : [] }] });
const tasks = (...items) => ({ type: "taskList", content: items });
const hr = () => ({ type: "horizontalRule" });
const callout = (type, ...content) => ({ type: "callout", attrs: { type }, content: content.length ? content : [p()] });
const cell = (text, tag = "tableCell") => ({ type: tag, content: [{ type: "paragraph", content: text ? [{ type: "text", text }] : [] }] });
const table = (headers, ...rows) => ({
  type: "table",
  content: [
    { type: "tableRow", content: headers.map(h => cell(h, "tableHeader")) },
    ...rows.map(row => ({ type: "tableRow", content: row.map(c => cell(c)) })),
  ],
});
const meta = (...fields) => ({ type: "metadataCard", attrs: { fields: JSON.stringify(fields) } });
const fText = (key, value = "", placeholder = "") => ({ key, value, type: "text", placeholder });
const fSelect = (key, value, options) => ({ key, value, type: "select", options });
const today = () => new Date().toISOString().split("T")[0];
const fDate = (key) => ({ key, value: today(), type: "date" });

// ── Templates ────────────────────────────────────────────────────────────────

export const PAGE_TEMPLATES = [
  {
    id: "blank",
    title: "Página en blanco",
    description: "Documento vacío",
    icon: "📄",
    category: "Básico",
    blocks: [p()],
  },

  {
    id: "prd",
    title: "PRD",
    description: "Product Requirements Document",
    icon: "📋",
    category: "Producto",
    blocks: [
      h(1, "PRD: [Feature]"),
      meta(
        fSelect("Status", "Draft", ["Draft", "Review", "Approved", "Rejected"]),
        fText("Autor", "", "Nombre"),
        fDate("Fecha"),
        fText("Stakeholders", "", "Equipos o personas"),
      ),
      hr(),
      h(2, "Problema"),
      p(tx("¿Qué problema resolvemos y para quién?")),
      h(2, "User Stories"),
      ul("Como [usuario], quiero [acción] para [beneficio]"),
      h(2, "Alcance"),
      tasks(task("In scope: "), task("In scope: ")),
      callout("warning", p(tx("Out of scope: "))),
      h(2, "Requerimientos"),
      table(["Req", "Descripción", "Prioridad"], ["", "", "Must"], ["", "", "Should"], ["", "", "Nice"]),
      h(2, "Métricas de éxito"),
      table(["Métrica", "Target", "Cómo se mide"], ["", "", ""]),
      h(2, "Open questions"),
      tasks(task("")),
    ],
  },

  {
    id: "rfc",
    title: "RFC / ADR",
    description: "Propuesta técnica o decisión de arquitectura",
    category: "Técnico",
    icon: "📐",
    blocks: [
      h(1, "RFC: [Título]"),
      meta(
        fSelect("Status", "Draft", ["Draft", "Open for comments", "Accepted", "Rejected", "Deprecated"]),
        fText("Autor", "", "Nombre"),
        fDate("Fecha"),
        fText("Reviewers", "", "Personas que deben revisar"),
      ),
      hr(),
      h(2, "TL;DR"),
      callout("note", p(tx("Resumen en 2-3 oraciones."))),
      h(2, "Contexto y problema"),
      p(tx("¿Qué necesitamos resolver y por qué ahora?")),
      h(2, "Propuesta"),
      p(tx("Describir la solución: arquitectura, flujo, modelo de datos.")),
      h(2, "Alternativas consideradas"),
      table(["Opción", "Pros", "Contras"], ["A: ", "", ""], ["B: ", "", ""]),
      h(2, "Decisión"),
      callout("important", p(b("Elegida:"), tx(" Opción [X] porque..."))),
      h(2, "Consecuencias y riesgos"),
      ul("Trade-off aceptado: ", "Riesgo: "),
      h(2, "Plan de implementación"),
      tasks(task("Paso 1"), task("Paso 2"), task("Validar con prueba")),
    ],
  },

  {
    id: "meeting-notes",
    title: "Meeting Notes",
    description: "Notas de reunión con decisiones y action items",
    category: "Básico",
    icon: "🤝",
    blocks: [
      h(1, "Meeting: [Tema]"),
      meta(
        fDate("Fecha"),
        fText("Facilitador", "", "Nombre"),
        fText("Asistentes", "", "Nombres separados por coma"),
      ),
      hr(),
      h(2, "Agenda"),
      ul("Tema 1", "Tema 2", "Tema 3"),
      h(2, "Notas"),
      p(),
      h(2, "Decisiones"),
      callout("important", ul("Decisión 1: ")),
      h(2, "Action Items"),
      table(["Tarea", "Responsable", "Deadline"], ["", "", ""], ["", "", ""]),
    ],
  },

  {
    id: "sprint-plan",
    title: "Sprint Plan",
    description: "Planificación de sprint con backlog y retro",
    category: "Producto",
    icon: "🚀",
    blocks: [
      h(1, "Sprint #N"),
      meta(
        fDate("Inicio"),
        fDate("Fin"),
        fText("Sprint Goal", "", "Resultado más importante del sprint"),
        fSelect("Status", "Planning", ["Planning", "In progress", "Review", "Done"]),
      ),
      hr(),
      h(2, "Backlog"),
      table(["Ticket", "Título", "Estimación", "Asignado"], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""]),
      h(2, "Riesgos"),
      ul(""),
      h(2, "Definition of Done"),
      tasks(task("Code reviewed"), task("Tests pasando"), task("Deployed a staging"), task("Documentación")),
      hr(),
      h(2, "Retro"),
      p(b("✅ Bien:")), ul(""),
      p(b("❌ Mejorar:")), ul(""),
      p(b("🔧 Acción:")), tasks(task("")),
    ],
  },

  {
    id: "api-spec",
    title: "API Spec",
    description: "Documentación de API REST con endpoints",
    category: "Técnico",
    icon: "🌐",
    blocks: [
      h(1, "API: [Nombre del servicio]"),
      meta(
        fText("Base URL", "", "https://api.example.com/v1"),
        fSelect("Auth", "Bearer Token", ["Bearer Token", "API Key", "OAuth 2.0", "None"]),
        fSelect("Status", "Draft", ["Draft", "Stable", "Deprecated"]),
        fText("Versión", "v1", "v1, v2..."),
      ),
      hr(),
      h(2, "Descripción"),
      p(tx("¿Qué hace esta API? ¿Quién la consume?")),
      h(2, "Autenticación"),
      callout("note", p(tx("Incluir header: Authorization: Bearer {token}"))),
      h(2, "Endpoints"),
      { type: "apiEndpoint", attrs: {
        method: "GET", path: "/resource", description: "Listar recursos",
        auth: "Bearer {token}",
        params: JSON.stringify([{ name: "page", type: "number", required: false, description: "Número de página" }, { name: "limit", type: "number", required: false, description: "Items por página" }]),
        requestBody: "",
        responses: JSON.stringify([{ status: "200", description: "OK", body: '{\n  "data": [],\n  "total": 0,\n  "page": 1\n}' }]),
      }},
      { type: "apiEndpoint", attrs: {
        method: "GET", path: "/resource/:id", description: "Obtener recurso por ID",
        auth: "Bearer {token}",
        params: JSON.stringify([{ name: "id", type: "string", required: true, description: "ID del recurso" }]),
        requestBody: "",
        responses: JSON.stringify([
          { status: "200", description: "OK", body: '{\n  "id": "1",\n  "name": "..."\n}' },
          { status: "404", description: "Not Found", body: '{\n  "error": "Resource not found"\n}' },
        ]),
      }},
      { type: "apiEndpoint", attrs: {
        method: "POST", path: "/resource", description: "Crear recurso",
        auth: "Bearer {token}",
        params: "[]",
        requestBody: '{\n  "name": "string",\n  "description": "string"\n}',
        responses: JSON.stringify([
          { status: "201", description: "Created", body: '{\n  "id": "new-id",\n  "name": "..."\n}' },
          { status: "400", description: "Bad Request", body: '{\n  "error": "Validation failed"\n}' },
        ]),
      }},
      h(2, "Errores comunes"),
      table(["Status", "Significado", "Solución"], ["401", "No autenticado", "Verificar token"], ["403", "Sin permisos", "Verificar rol"], ["429", "Rate limit", "Reducir frecuencia"]),
    ],
  },

  {
    id: "runbook",
    title: "Runbook",
    description: "Guía de operaciones y troubleshooting",
    category: "Técnico",
    icon: "🔧",
    blocks: [
      h(1, "Runbook: [Servicio]"),
      meta(
        fText("Owner", "", "Responsable"),
        fText("Repo", "", "URL del repositorio"),
        fText("Dashboard", "", "URL del dashboard"),
        fText("Alertas", "", "Canal de alertas"),
        fSelect("Criticidad", "Medium", ["Low", "Medium", "High", "Critical"]),
      ),
      hr(),
      h(2, "Descripción"),
      p(tx("¿Qué hace este servicio? ¿De quién depende?")),
      h(2, "Arquitectura"),
      callout("note", p(tx("Describir dependencias: bases de datos, colas, servicios externos."))),
      h(2, "Endpoints principales"),
      { type: "apiEndpoint", attrs: {
        method: "GET", path: "/health", description: "Health check del servicio",
        auth: "None", params: "[]", requestBody: "",
        responses: JSON.stringify([{ status: "200", description: "Healthy", body: '{\n  "status": "ok",\n  "uptime": "72h"\n}' }]),
      }},
      h(2, "Health checks"),
      table(["Check", "Cómo verificar", "Esperado"], ["Servicio activo", "GET /health", "200 OK"], ["DB conectada", "", "pool > 0"]),
      h(2, "Incidente: Servicio no responde"),
      p(b("Síntomas:"), tx(" 5xx, alertas de timeout")),
      callout("warning", p(b("Pasos:"))),
      ul("Verificar logs recientes", "Revisar CPU/memoria", "Verificar último deploy", "Escalar si persiste"),
      callout("caution", p(tx("Antes de reiniciar, capturar logs para el post-mortem."))),
      h(2, "Rollback"),
      ul("Identificar commit a revertir", "Ejecutar rollback", "Verificar health checks", "Notificar al equipo"),
      h(2, "Escalación"),
      table(["Nivel", "Contacto", "Cuándo"], ["L1", "", "< 15 min sin resolver"], ["L2", "", "Impacto en usuarios"]),
    ],
  },
];
