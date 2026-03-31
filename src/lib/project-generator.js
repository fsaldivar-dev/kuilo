/**
 * project-generator.js
 * Creates packages and initial documents based on wizard selections.
 */

const AREA_DOCS = {
  producto: [
    { title: "Roadmap", blocks: [
      h(1, "Roadmap"), meta(fSelect("Status", "Activo", ["Activo", "Pausado"]), fDate("Actualizado")),
      hr(), h(2, "Ahora"), tasks(task("Feature actual")), h(2, "Después"), tasks(task("Próxima feature")), h(2, "Futuro"), tasks(task("Idea")),
    ]},
    { title: "PRD inicial", blocks: [
      h(1, "PRD: [Feature]"), meta(fSelect("Status", "Draft", ["Draft", "Review", "Approved"]), fText("Autor", "", "Nombre"), fDate("Fecha")),
      hr(), h(2, "Problema"), p("¿Qué problema resolvemos?"), h(2, "User Stories"), ul("Como [usuario], quiero [acción] para [beneficio]"),
      h(2, "Alcance"), tasks(task("In scope")), callout("warning", p("Out of scope:")), h(2, "Métricas de éxito"), p(),
    ]},
  ],
  tecnico: [
    { title: "Stack técnico", blocks: [
      h(1, "Stack técnico"), hr(),
      h(2, "Frontend"), p(), h(2, "Backend"), p(), h(2, "Base de datos"), p(), h(2, "Infraestructura"), p(),
      h(2, "Dependencias clave"), ul(""),
    ]},
    { title: "API Spec", blocks: [
      h(1, "API Spec"), meta(fText("Base URL", "", "https://api..."), fSelect("Auth", "Bearer Token", ["Bearer Token", "API Key", "None"]), fSelect("Status", "Draft", ["Draft", "Stable"])),
      hr(), h(2, "Endpoints"), p("Documenta cada endpoint con /api-endpoint"),
    ]},
    { title: "Runbook", blocks: [
      h(1, "Runbook: [Servicio]"), meta(fText("Owner", "", "Responsable"), fText("Dashboard", "", "URL"), fSelect("Criticidad", "Medium", ["Low", "Medium", "High", "Critical"])),
      hr(), h(2, "Descripción"), p("¿Qué hace este servicio?"),
      h(2, "Health checks"), p(), h(2, "Incidentes comunes"), p(), h(2, "Rollback"), ul("Paso 1", "Paso 2"),
    ]},
  ],
  negocio: [
    { title: "Lean Canvas", blocks: [
      h(1, "Lean Canvas"), meta(fDate("Fecha"), fText("Autor", "", "Nombre")),
      hr(),
      h(2, "1. Problema"), p("Top 3 problemas que resuelves:"), ul("", "", ""),
      h(2, "2. Segmento de clientes"), p("¿Quién tiene estos problemas?"), ul(""),
      h(2, "3. Propuesta de valor"), p("¿Por qué eres diferente?"),
      h(2, "4. Solución"), p("Top 3 features:"), ul("", "", ""),
      h(2, "5. Canales"), p("¿Cómo llegas a los clientes?"), ul(""),
      h(2, "6. Fuentes de ingreso"), p("¿Cómo cobras?"),
      h(2, "7. Estructura de costos"), p("Costos fijos y variables"),
      h(2, "8. Métricas clave"), p("¿Qué mides?"), ul(""),
      h(2, "9. Ventaja injusta"), p("¿Qué no pueden copiar fácilmente?"),
    ]},
    { title: "Modelo de pricing", blocks: [
      h(1, "Modelo de pricing"), hr(),
      h(2, "Planes"), p(), h(2, "Competencia"), p("¿Cuánto cobran los demás?"),
      h(2, "Unit economics"), p("Costo por cliente: "), p("Ingreso por cliente: "), p("Margen: "),
    ]},
  ],
  marketing: [
    { title: "Plan de marketing", blocks: [
      h(1, "Plan de marketing"), meta(fSelect("Status", "Borrador", ["Borrador", "Activo", "Completado"]), fDate("Periodo")),
      hr(),
      h(2, "Objetivo"), p("¿Qué queremos lograr este periodo?"),
      h(2, "Audiencia"), p("¿A quién le hablamos?"),
      h(2, "Canales"), ul("Redes sociales", "Boca a boca", "Publicidad local", "Partnerships"),
      h(2, "Presupuesto"), p("$ mensual: "),
      h(2, "Calendario"), tasks(task("Semana 1:"), task("Semana 2:"), task("Semana 3:"), task("Semana 4:")),
      h(2, "Métricas"), ul("Nuevos clientes:", "Costo por adquisición:", "Retención:"),
    ]},
    { title: "Canales de adquisición", blocks: [
      h(1, "Canales de adquisición"), hr(),
      h(2, "Canales actuales"), ul(""), h(2, "Canales por probar"), ul(""),
      h(2, "¿Qué funciona?"), p(), h(2, "¿Qué no funciona?"), p(),
    ]},
  ],
  legal: [
    { title: "Aviso de privacidad", blocks: [
      h(1, "Aviso de privacidad"),
      callout("warning", p("Este documento debe ser revisado por un abogado antes de publicarse.")),
      hr(), h(2, "Responsable"), p("Nombre o razón social:"),
      h(2, "Datos que se recopilan"), ul("Nombre", "Email", "Teléfono"),
      h(2, "Finalidad"), p("¿Para qué usas los datos?"),
      h(2, "Transferencia a terceros"), p(),
      h(2, "Derechos ARCO"), p("El titular puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición."),
    ]},
    { title: "Términos y condiciones", blocks: [
      h(1, "Términos y condiciones"),
      callout("warning", p("Requiere revisión legal.")),
      hr(), h(2, "Servicio"), p(), h(2, "Uso aceptable"), p(), h(2, "Pagos y cancelaciones"), p(),
      h(2, "Limitación de responsabilidad"), p(), h(2, "Ley aplicable"), p("Leyes de México, estado de Querétaro."),
    ]},
  ],
  operaciones: [
    { title: "Manual de operaciones", blocks: [
      h(1, "Manual de operaciones"), hr(),
      h(2, "Apertura del día"), tasks(task(""), task(""), task("")),
      h(2, "Operación normal"), p(), h(2, "Cierre del día"), tasks(task(""), task("")),
      h(2, "Emergencias"), callout("caution", p("Protocolo de emergencia:")),
    ]},
    { title: "Checklist diario", blocks: [
      h(1, "Checklist diario"), hr(),
      h(2, "Mañana"), tasks(task("Abrir local"), task("Verificar limpieza"), task("Revisar agenda")),
      h(2, "Tarde"), tasks(task("Revisar inventario"), task("Atender pendientes")),
      h(2, "Cierre"), tasks(task("Limpiar"), task("Cerrar caja"), task("Cerrar local")),
    ]},
  ],
  cliente: [
    { title: "Customer persona", blocks: [
      h(1, "Customer Persona"), hr(),
      h(2, "¿Quién es?"), p("Nombre ficticio: "), p("Edad: "), p("Ocupación: "),
      h(2, "¿Qué necesita?"), ul(""),
      h(2, "¿Qué le frustra?"), ul(""),
      h(2, "¿Cómo te descubre?"), p(),
      h(2, "¿Por qué te elegiría?"), p(),
      h(2, "¿Por qué se iría?"), p(),
    ]},
    { title: "Customer journey", blocks: [
      h(1, "Customer Journey"), hr(),
      h(2, "1. Descubrimiento"), p("¿Cómo te encuentra?"),
      h(2, "2. Primer contacto"), p("¿Qué pasa cuando llega?"),
      h(2, "3. Compra"), p("¿Cómo paga? ¿Qué decide?"),
      h(2, "4. Uso"), p("¿Cómo es la experiencia día a día?"),
      h(2, "5. Retención"), p("¿Qué lo hace quedarse?"),
      h(2, "6. Referencia"), p("¿Qué lo hace recomendarte?"),
    ]},
  ],
  franquicia: [
    { title: "Manual de franquicia", blocks: [
      h(1, "Manual de Franquicia"), hr(),
      callout("note", p("Este documento es la guía completa para replicar el negocio en una nueva ubicación.")),
      h(2, "Requisitos de ubicación"), ul(""), h(2, "Inversión inicial"), p("Desglose de costos:"),
      h(2, "Equipo necesario"), ul(""), h(2, "Personal"), p("Perfiles necesarios:"),
      h(2, "Capacitación"), tasks(task("")), h(2, "Marca y diseño"), p(),
    ]},
    { title: "Checklist de apertura", blocks: [
      h(1, "Checklist de apertura"), hr(),
      h(2, "Legal"), tasks(task("Constituir empresa"), task("RFC"), task("Permisos")),
      h(2, "Local"), tasks(task("Contrato de renta"), task("Adecuaciones"), task("Equipamiento")),
      h(2, "Personal"), tasks(task("Contratar"), task("Capacitar")),
      h(2, "Marketing"), tasks(task("Redes sociales"), task("Material impreso"), task("Evento de apertura")),
      h(2, "Sistemas"), tasks(task("Instalar app"), task("Configurar pagos"), task("Probar todo")),
    ]},
  ],
  bitacora: [
    { title: "Bitácora del proyecto", blocks: [
      h(1, "Bitácora"), hr(),
      callout("tip", p("Registra cada semana: qué salió bien, qué salió mal, qué aprendiste.")),
      h(2, today()), h(3, "✅ Qué salió bien"), ul(""), h(3, "❌ Qué salió mal"), ul(""), h(3, "💡 Qué aprendí"), p(),
    ]},
  ],
};

// ── Block helpers (same as page-templates.js) ──
function tx(text, marks) { return text ? (marks ? { type: "text", text, marks } : { type: "text", text }) : null; }
function p(...c) { return { type: "paragraph", content: c.filter(Boolean) }; }
function h(level, text) { return { type: "heading", attrs: { level }, content: [tx(text)].filter(Boolean) }; }
function ul(...items) { return { type: "bulletList", content: items.map(x => ({ type: "listItem", content: [{ type: "paragraph", content: x ? [{ type: "text", text: x }] : [] }] })) }; }
function task(text) { return { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: text ? [{ type: "text", text }] : [] }] }; }
function tasks(...items) { return { type: "taskList", content: items }; }
function hr() { return { type: "horizontalRule" }; }
function callout(type, ...content) { return { type: "callout", attrs: { type }, content }; }
function today() { return new Date().toISOString().split("T")[0]; }
function meta(...fields) { return { type: "metadataCard", attrs: { fields: JSON.stringify(fields) } }; }
function fText(key, value = "", placeholder = "") { return { key, value, type: "text", placeholder }; }
function fSelect(key, value, options) { return { key, value, type: "select", options }; }
function fDate(key) { return { key, value: today(), type: "date" }; }

/**
 * Generate packages and documents for the selected areas.
 * Returns array of { packageName, docs: [{ title, blocks }] }
 */
export function generateProject(projectName, areas) {
  const packages = [];

  for (const area of areas) {
    const docs = AREA_DOCS[area.id];
    if (!docs) continue;
    packages.push({
      packageName: area.id,
      docs: docs.map(d => ({ ...d })),
    });
  }

  return packages;
}
