/**
 * project-generator.js
 * Creates packages and initial documents with guided content.
 * Each document tells the user WHAT to write, WHY it matters, and HOW to fill it.
 */

// ── Block helpers ────────────────────────────────────────────────────────────

function tx(text, marks) { return text ? (marks ? { type: "text", text, marks } : { type: "text", text }) : null; }
function b(text) { return tx(text, [{ type: "bold" }]); }
function p(...c) { return { type: "paragraph", content: c.filter(Boolean) }; }
function h(level, text) { return { type: "heading", attrs: { level }, content: [tx(text)].filter(Boolean) }; }
function ul(...items) { return { type: "bulletList", content: items.map(x => ({ type: "listItem", content: [typeof x === "string" ? { type: "paragraph", content: x ? [{ type: "text", text: x }] : [] } : x] })) }; }
function task(text) { return { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: text ? [{ type: "text", text }] : [] }] }; }
function tasks(...items) { return { type: "taskList", content: items }; }
function hr() { return { type: "horizontalRule" }; }
function callout(type, ...content) { return { type: "callout", attrs: { type }, content }; }
function today() { return new Date().toISOString().split("T")[0]; }
function meta(...fields) { return { type: "metadataCard", attrs: { fields: JSON.stringify(fields) } }; }
function fText(key, value = "", placeholder = "") { return { key, value, type: "text", placeholder }; }
function fSelect(key, value, options) { return { key, value, type: "select", options }; }
function fDate(key) { return { key, value: today(), type: "date" }; }

// Helper for guided sections
function guide(title, why, what, example) {
  return [
    h(2, title),
    callout("tip", p(b("¿Por qué?"), tx(` ${why}`))),
    callout("note", p(b("¿Qué escribir?"), tx(` ${what}`))),
    ...(example ? [callout("important", p(b("Ejemplo: "), tx(example)))] : []),
    p(),
  ];
}

// ── Priority order per area ──────────────────────────────────────────────────

const AREA_ORDER = {
  negocio: 1,
  cliente: 2,
  producto: 3,
  operaciones: 4,
  marketing: 5,
  tecnico: 6,
  legal: 7,
  franquicia: 8,
  bitacora: 9,
};

// ── Area documents with guided content ───────────────────────────────────────

const AREA_DOCS = {
  negocio: [
    {
      title: "Lean Canvas",
      priority: 1,
      blocks: [
        h(1, "Lean Canvas"),
        meta(fDate("Fecha"), fText("Autor", "", "Tu nombre")),
        callout("important", p(tx("Este es el documento MÁS IMPORTANTE. Llénalo PRIMERO. Resume todo tu negocio en una página. Si no puedes llenar esto, necesitas pensar más tu idea."))),
        hr(),
        ...guide(
          "1. Problema",
          "Si no sabes qué problema resuelves, no tienes negocio. Los clientes pagan por soluciones, no por productos.",
          "Escribe los 3 problemas principales que tienen tus clientes. Sé específico.",
          "Los dueños de gym pierden clientes porque no tienen una forma fácil de gestionar membresías y pagos."
        ),
        ...guide(
          "2. Segmento de clientes",
          "No puedes venderle a todos. Necesitas saber exactamente QUIÉN tiene el problema que resuelves.",
          "Describe tu cliente ideal: edad, ocupación, dónde está, cuánto gasta.",
          "Dueños de gimnasios pequeños (< 100 miembros) en México, que usan WhatsApp para gestionar todo."
        ),
        ...guide(
          "3. Propuesta de valor",
          "¿Por qué te elegirían a ti en vez de la competencia o no hacer nada?",
          "Una frase que explique tu diferencial. Prueba: 'Somos el único [X] que [Y] para [Z]'.",
          "La única app de gym que funciona sin internet y cuesta menos que un Excel."
        ),
        ...guide(
          "4. Solución",
          "Ahora sí — ¿cómo resuelves el problema? No te adelantes, primero problema y cliente.",
          "Lista tus 3 features principales. No más de 3.",
          "1) Check-in con QR  2) Gestión de membresías  3) Cobro automático"
        ),
        ...guide(
          "5. Canales",
          "El mejor producto del mundo no sirve si nadie lo encuentra.",
          "¿Cómo van a descubrirte tus clientes? Lista los 3 canales más probables.",
          "1) Boca a boca entre dueños de gym  2) Instagram  3) Visitas presenciales"
        ),
        ...guide(
          "6. Fuentes de ingreso",
          "Si no sabes cómo cobrar, no tienes negocio — tienes un hobby.",
          "¿Cuánto cobras? ¿Mensual, anual, por uso? ¿Hay versión gratis?",
          "Plan básico: $500/mes. Plan pro: $1,200/mes. Sin versión gratis."
        ),
        ...guide(
          "7. Estructura de costos",
          "Necesitas saber cuánto te cuesta operar para saber si tu negocio es viable.",
          "Lista costos fijos (renta, salarios, hosting) y variables (por cliente).",
          "Hosting: $50/mes. Dominio: $15/año. Mi tiempo: 20hrs/semana."
        ),
        ...guide(
          "8. Métricas clave",
          "Lo que no se mide no se mejora. Define 3-5 números que revises cada semana.",
          "Elige métricas que puedas medir HOY, no las que quieres medir algún día.",
          "Usuarios activos, tasa de retención mensual, ingresos recurrentes (MRR)."
        ),
        ...guide(
          "9. Ventaja injusta",
          "¿Qué tienes que otros NO pueden copiar fácilmente?",
          "Puede ser: relaciones, conocimiento del dominio, datos, marca, patente, costo.",
          "Soy dueño de gym y entiendo los problemas desde adentro."
        ),
      ],
    },
    {
      title: "Modelo de pricing",
      priority: 2,
      blocks: [
        h(1, "Modelo de pricing"),
        callout("note", p(tx("Llena esto DESPUÉS del Lean Canvas. Necesitas saber tu propuesta de valor antes de ponerle precio."))),
        hr(),
        ...guide("Planes y precios", "El pricing define tu posicionamiento. Muy barato = no te toman en serio. Muy caro = no tienes clientes.", "Define 2-3 planes con nombres claros y qué incluye cada uno.", "Básico $500/mes: hasta 50 miembros. Pro $1200/mes: ilimitado + reportes."),
        ...guide("Competencia", "Necesitas saber cuánto cobran los demás para posicionarte.", "Lista 3-5 competidores con sus precios y qué ofrecen.", "GymMaster: $2000/mes. Fitco: $800/mes. Excel: gratis pero ineficiente."),
        ...guide("Unit economics", "¿Tu negocio es viable? Necesitas que cada cliente te deje ganancia.", "Calcula: costo de adquirir un cliente vs cuánto te paga en su vida.", "CAC: $200. LTV (12 meses × $500): $6,000. Ratio LTV/CAC: 30x ✅"),
      ],
    },
  ],

  cliente: [
    {
      title: "Customer persona",
      priority: 1,
      blocks: [
        h(1, "Customer Persona"),
        callout("important", p(tx("Ponle nombre y cara a tu cliente ideal. Cada decisión que tomes debería pasar por: '¿esto le sirve a [nombre]?'"))),
        hr(),
        ...guide("¿Quién es?", "Si no sabes a quién le vendes, le vendes a nadie.", "Inventa un personaje con nombre, edad, trabajo, y situación. Basado en clientes reales.", "Carlos, 35 años, dueño de un gym crossfit en Querétaro con 40 miembros. Usa WhatsApp para todo."),
        ...guide("¿Qué necesita?", "Las necesidades son las oportunidades de tu negocio.", "Lista 3-5 necesidades reales (no las que TÚ crees, las que ELLOS tienen).", "Necesita saber quién pagó y quién no sin revisar transferencias manualmente."),
        ...guide("¿Qué le frustra?", "Las frustraciones son tu mejor argumento de venta.", "Lista lo que le molesta de las soluciones actuales.", "Los Excel se desorganizan. Las apps existentes son caras y complicadas."),
        ...guide("¿Cómo te descubre?", "Si no sabes cómo te encuentra, no puedes crecer.", "¿Redes sociales? ¿Boca a boca? ¿Google?", "Le pregunta a otros dueños de gym en grupos de WhatsApp."),
        ...guide("¿Por qué te elegiría?", "Tu diferencial debe ser obvio para el cliente.", "¿Qué le dirías en 10 segundos para que diga 'ah, eso necesito'?", "'Gestiona tu gym desde el celular en 5 minutos, sin ser ingeniero.'"),
        ...guide("¿Por qué se iría?", "Saber por qué se van es más valioso que saber por qué llegan.", "Lista las razones por las que dejaría de usar tu producto.", "Si la app se cae seguido. Si sube el precio. Si encuentra algo más simple."),
      ],
    },
    {
      title: "Customer journey",
      priority: 2,
      blocks: [
        h(1, "Customer Journey"),
        callout("note", p(tx("Mapea el camino completo de tu cliente — desde que te descubre hasta que te recomienda. Cada paso es una oportunidad de mejora."))),
        hr(),
        ...guide("1. Descubrimiento", "¿Cómo te encuentra? Si no lo sabes, no puedes optimizarlo.", "Describe el momento exacto donde escucha de ti por primera vez.", "Ve un post en Instagram de otro dueño de gym que usa la app."),
        ...guide("2. Primer contacto", "La primera impresión define si sigue o se va.", "¿Qué pasa cuando entra a tu web/app por primera vez?", "Entra a la landing, ve un video de 30 seg, da click en 'Probar gratis'."),
        ...guide("3. Activación", "El momento donde dice 'esto SÍ me sirve'.", "¿Cuál es la acción que demuestra que entendió el valor?", "Registra su primer miembro y hace el primer check-in."),
        ...guide("4. Retención", "Es 5x más barato retener que adquirir.", "¿Qué lo hace quedarse mes tras mes?", "Ve el reporte mensual y sabe exactamente cuánto cobró."),
        ...guide("5. Referencia", "El mejor marketing es que tus clientes te recomienden.", "¿Qué lo haría recomendarte activamente?", "Le dice a otro dueño de gym: 'dejé de usar Excel gracias a esta app'."),
      ],
    },
  ],

  producto: [
    {
      title: "Roadmap",
      priority: 1,
      blocks: [
        h(1, "Roadmap"),
        meta(fSelect("Status", "Activo", ["Activo", "Pausado"]), fDate("Actualizado")),
        callout("tip", p(tx("El roadmap NO es una lista de deseos. Es un compromiso de qué construyes y en qué orden. Máximo 3 cosas en 'Ahora'."))),
        hr(),
        h(2, "Ahora (este mes)"),
        callout("note", p(tx("¿Qué estás construyendo HOY? Solo lo que estás trabajando activamente."))),
        tasks(task("")),
        h(2, "Después (próximo mes)"),
        callout("note", p(tx("¿Qué sigue después de terminar lo de arriba?"))),
        tasks(task("")),
        h(2, "Futuro (sin fecha)"),
        callout("note", p(tx("Ideas que quieres hacer pero no son urgentes. Está bien que esto cambie."))),
        tasks(task("")),
      ],
    },
    {
      title: "PRD inicial",
      priority: 2,
      blocks: [
        h(1, "PRD: [Nombre del feature]"),
        meta(fSelect("Status", "Draft", ["Draft", "Review", "Approved"]), fText("Autor", "", "Nombre"), fDate("Fecha")),
        callout("note", p(tx("Escribe un PRD para CADA feature importante antes de construirla. Así la IA tiene contexto cuando le pidas implementarla."))),
        hr(),
        ...guide("Problema", "Si no hay problema, no hay feature.", "¿Qué problema específico resuelve este feature?", "Los miembros no saben cuándo vence su membresía."),
        ...guide("User Stories", "Las user stories conectan el feature con personas reales.", "Escribe 2-3 historias: 'Como [quién], quiero [qué] para [por qué]'.", "Como miembro, quiero ver cuándo vence mi membresía para renovar a tiempo."),
        ...guide("Alcance", "Definir lo que NO haces es tan importante como lo que SÍ haces.", "Lista qué incluye y qué NO incluye este feature.", "Incluye: notificación de vencimiento. NO incluye: renovación automática."),
        ...guide("Métricas de éxito", "¿Cómo sabes si el feature funcionó?", "Define 1-2 métricas que puedas medir antes y después.", "Reducir las membresías vencidas sin renovar de 30% a 10%."),
      ],
    },
  ],

  operaciones: [
    {
      title: "Manual de operaciones",
      priority: 1,
      blocks: [
        h(1, "Manual de operaciones"),
        callout("important", p(tx("Este documento es la clave para que alguien más pueda operar tu negocio sin ti. Si quieres franquiciar, NECESITAS esto."))),
        hr(),
        ...guide("Apertura del día", "Sin un proceso claro, cada día es improvisación.", "Lista paso a paso lo que se hace al abrir. Que cualquiera pueda seguirlo.", "6:00 AM — Abrir local. Encender luces. Verificar limpieza. Abrir sistema."),
        h(2, "Apertura"),
        tasks(task(""), task(""), task("")),
        ...guide("Operación normal", "¿Qué pasa durante el día? ¿Quién hace qué?", "Describe las actividades recurrentes y quién es responsable.", "Recepción atiende check-ins. Entrenadores dan clases según horario."),
        p(),
        ...guide("Cierre del día", "El cierre es tan importante como la apertura.", "Lista lo que se hace al cerrar. Incluye dinero, limpieza, seguridad.", "Cerrar caja. Limpiar equipos. Activar alarma. Cerrar con llave."),
        h(2, "Cierre"),
        tasks(task(""), task("")),
      ],
    },
    {
      title: "Checklist diario",
      priority: 2,
      blocks: [
        h(1, "Checklist diario"),
        callout("tip", p(tx("Copia este checklist cada día o crea uno nuevo desde el template. Marca lo que se completa."))),
        hr(),
        h(2, "Mañana"), tasks(task("Abrir local"), task("Verificar limpieza"), task("Revisar agenda del día")),
        h(2, "Operación"), tasks(task("Atender check-ins"), task("Revisar pagos pendientes")),
        h(2, "Cierre"), tasks(task("Limpiar"), task("Cerrar caja"), task("Cerrar local")),
      ],
    },
  ],

  marketing: [
    {
      title: "Plan de marketing",
      priority: 1,
      blocks: [
        h(1, "Plan de marketing"),
        meta(fSelect("Status", "Borrador", ["Borrador", "Activo", "Completado"]), fDate("Periodo")),
        callout("note", p(tx("No necesitas un plan de 50 páginas. Necesitas saber: a quién le hablas, dónde está, y qué le dices. Eso es todo."))),
        hr(),
        ...guide("Objetivo", "Sin objetivo claro, cualquier resultado parece bueno (o malo).", "¿Qué quieres lograr ESTE MES? Un número específico.", "Conseguir 10 nuevos alumnos en marzo."),
        ...guide("Audiencia", "El mensaje cambia según a quién le hablas.", "Describe quién es tu audiencia para esta campaña.", "Papás de niños 6-12 años en zona centro de Querétaro."),
        ...guide("Canales", "Mejor hacer 2 canales bien que 8 canales mal.", "Elige máximo 3 canales donde VAS A PUBLICAR esta semana.", "Instagram (3 posts/semana) + WhatsApp Status + Volantes en escuelas cercanas."),
        ...guide("Presupuesto", "Puedes empezar con $0 (orgánico) o invertir poco.", "¿Cuánto puedes gastar este mes en marketing?", "$500 en Facebook Ads + $200 en volantes = $700 total"),
        ...guide("Calendario", "Si no agendas, no publicas.", "Planea las acciones de cada semana.", ""),
        tasks(task("Semana 1:"), task("Semana 2:"), task("Semana 3:"), task("Semana 4:")),
        ...guide("Métricas", "¿Funcionó? Solo lo sabes si mides.", "¿Qué número revisas al final del mes?", "Nuevos seguidores, mensajes recibidos, alumnos que llegaron por marketing."),
      ],
    },
    {
      title: "Canales de adquisición",
      priority: 2,
      blocks: [
        h(1, "Canales de adquisición"),
        callout("tip", p(tx("Registra qué canales usas, cuáles funcionan, y cuáles no. Deja de invertir en lo que no funciona."))),
        hr(),
        ...guide("Canales actuales", "¿Dónde consigues clientes HOY?", "Lista cada canal y cuántos clientes te trae.", "Boca a boca: 60%. Instagram: 25%. Volantes: 15%."),
        ...guide("Canales por probar", "Siempre debes estar probando algo nuevo.", "Lista 2-3 canales que quieres probar este trimestre.", "TikTok, partnerships con escuelas, Google Maps."),
        ...guide("¿Qué funciona?", "Documenta los éxitos para repetirlos.", "¿Qué acción específica trajo más clientes?", "El post de 'clase gratis' en Instagram trajo 8 leads en una semana."),
        ...guide("¿Qué NO funciona?", "Documenta los fracasos para no repetirlos.", "¿Qué probaste y no funcionó?", "Volantes en semáforos: 500 volantes, 0 clientes. No repetir."),
      ],
    },
  ],

  tecnico: [
    {
      title: "Stack técnico",
      priority: 1,
      blocks: [
        h(1, "Stack técnico"),
        callout("note", p(tx("Documenta tu stack para que cualquier IA o desarrollador pueda entender tu sistema rápidamente."))),
        hr(),
        ...guide("Frontend", "¿Qué ve el usuario?", "Framework, lenguaje, hosting.", "React + Vite, desplegado en Vercel."),
        ...guide("Backend", "¿Qué procesa la lógica?", "Framework, lenguaje, hosting.", "Node.js + Express en Railway. Firebase Auth."),
        ...guide("Base de datos", "¿Dónde viven los datos?", "Tipo, hosting, esquema general.", "Firestore (NoSQL). Colecciones: users, members, memberships."),
        ...guide("Infraestructura", "¿Dónde corre todo?", "Cloud, CI/CD, dominios, DNS.", "Firebase Hosting + GitHub Actions para deploy."),
      ],
    },
    {
      title: "API Spec",
      priority: 2,
      blocks: [
        h(1, "API Spec"),
        meta(fText("Base URL", "", "https://api..."), fSelect("Auth", "Bearer Token", ["Bearer Token", "API Key", "None"]), fSelect("Status", "Draft", ["Draft", "Stable"])),
        callout("tip", p(tx("Usa el bloque /api-endpoint para documentar cada endpoint de tu API."))),
        hr(),
        h(2, "Endpoints"),
        p(tx("Inserta endpoints con /api-endpoint")),
      ],
    },
    {
      title: "Runbook",
      priority: 3,
      blocks: [
        h(1, "Runbook: [Servicio]"),
        meta(fText("Owner", "", "Responsable"), fText("Dashboard", "", "URL"), fSelect("Criticidad", "Medium", ["Low", "Medium", "High", "Critical"])),
        callout("note", p(tx("Este documento se lee a las 3 AM cuando algo se rompe. Hazlo claro y paso a paso."))),
        hr(),
        ...guide("Descripción", "El oncall necesita entender qué hace el servicio en 10 segundos.", "¿Qué hace? ¿De quién depende? ¿Quién depende de él?", "API de pagos. Depende de Stripe y Firestore. La app depende de él para cobrar."),
        ...guide("Incidente común", "Los mismos problemas se repiten. Documenta la solución una vez.", "Describe síntomas + pasos de resolución.", "504 Timeout → Verificar conexión a Firestore → Reiniciar servicio si persiste."),
      ],
    },
  ],

  legal: [
    {
      title: "Aviso de privacidad",
      priority: 1,
      blocks: [
        h(1, "Aviso de privacidad"),
        callout("caution", p(tx("OBLIGATORIO en México (LFPDPPP). Si recopilas datos personales sin aviso de privacidad, te puedes hacer acreedor a multas. Consulta un abogado."))),
        hr(),
        ...guide("Responsable", "La ley exige identificar quién es responsable de los datos.", "Nombre o razón social, domicilio, contacto.", "Juan Pérez / SajaruBox. Querétaro, Qro. contacto@sajarubox.com"),
        ...guide("Datos que recopilas", "Solo recopila lo que NECESITAS. Menos datos = menos riesgo.", "Lista cada dato personal que pides a tus usuarios.", "Nombre, email, teléfono, foto (opcional), historial de pagos."),
        ...guide("Finalidad", "Los datos solo se pueden usar para lo que dijiste que los ibas a usar.", "¿Para qué usas cada dato?", "Gestión de membresías, envío de recibos, comunicación de horarios."),
        ...guide("Derechos ARCO", "Los usuarios tienen derecho a Acceder, Rectificar, Cancelar y Oponerse.", "Indica cómo pueden ejercer estos derechos.", "Enviar solicitud a privacidad@sajarubox.com. Respuesta en 20 días hábiles."),
      ],
    },
    {
      title: "Términos y condiciones",
      priority: 2,
      blocks: [
        h(1, "Términos y condiciones"),
        callout("caution", p(tx("Protegen a tu negocio legalmente. Sin T&C, un cliente puede reclamar cosas que nunca ofreciste. Consulta un abogado."))),
        hr(),
        ...guide("Servicio", "Define exactamente qué ofreces y qué NO ofreces.", "Descripción clara del servicio.", "SajaruBox es una plataforma de gestión para gimnasios. NO es asesoría de salud."),
        ...guide("Pagos y cancelaciones", "Las disputas de dinero son las más comunes. Sé claro.", "¿Cómo se cobra? ¿Hay reembolsos? ¿Cómo se cancela?", "Cobro mensual anticipado. Sin reembolso por mes iniciado. Cancelar con 30 días de anticipación."),
      ],
    },
  ],

  franquicia: [
    {
      title: "Manual de franquicia",
      priority: 1,
      blocks: [
        h(1, "Manual de Franquicia"),
        callout("important", p(tx("Este documento debe permitir que alguien replique tu negocio SIN TI. Si necesitan llamarte para cada cosa, no es un manual — es una dependencia."))),
        hr(),
        ...guide("Requisitos de ubicación", "La ubicación puede hacer o romper una franquicia.", "¿Qué necesita el local? Tamaño, zona, accesibilidad.", "Mínimo 150m², zona con tráfico peatonal, estacionamiento, planta baja."),
        ...guide("Inversión inicial", "El franquiciatario necesita saber cuánto invertir ANTES de comprometerse.", "Desglose completo de costos iniciales.", "Renta (2 meses depósito): $40K. Equipo: $200K. Adecuaciones: $80K. Total: $320K."),
        ...guide("Capacitación", "Sin capacitación estandarizada, cada franquicia opera diferente.", "¿Qué temas se cubren? ¿Cuánto dura? ¿Quién la da?", "2 semanas. Cubre: operación, atención, sistema, emergencias. La da el franquiciante."),
      ],
    },
    {
      title: "Checklist de apertura",
      priority: 2,
      blocks: [
        h(1, "Checklist de apertura de franquicia"),
        callout("tip", p(tx("Usa esta lista para cada nueva ubicación. Marca cada paso completado."))),
        hr(),
        h(2, "Legal"),
        tasks(task("Constituir empresa"), task("Obtener RFC"), task("Permisos municipales"), task("Licencia de funcionamiento"), task("Contrato de franquicia firmado")),
        h(2, "Local"),
        tasks(task("Contrato de renta"), task("Adecuaciones"), task("Equipamiento instalado"), task("Señalización")),
        h(2, "Personal"),
        tasks(task("Contratar equipo"), task("Capacitación completada"), task("Uniformes")),
        h(2, "Sistemas"),
        tasks(task("Instalar app/sistema"), task("Configurar pagos"), task("Prueba integral")),
        h(2, "Marketing de apertura"),
        tasks(task("Redes sociales activas"), task("Material impreso"), task("Evento de inauguración")),
      ],
    },
  ],

  bitacora: [
    {
      title: "Bitácora del proyecto",
      priority: 1,
      blocks: [
        h(1, "Bitácora"),
        callout("important", p(tx("Escribe aquí cada semana. Los fracasos documentados valen más que los éxitos no registrados. En 6 meses vas a agradecer tener este historial."))),
        hr(),
        h(2, `Semana del ${today()}`),
        ...guide("✅ Qué salió bien", "Celebra los éxitos, por pequeños que sean. Te mantiene motivado.", "¿Qué funcionó esta semana?", "Conseguí 2 alumnos nuevos por referencia de uno existente."),
        ul(""),
        ...guide("❌ Qué salió mal", "Los fracasos son datos. Sin datos no hay mejora.", "¿Qué no funcionó? ¿Por qué?", "La campaña de Instagram no generó ni un lead. Mal horario de publicación."),
        ul(""),
        ...guide("💡 Qué aprendí", "Una lección por semana = 52 lecciones al año.", "¿Qué harías diferente la próxima vez?", "Publicar entre 7-9 PM tiene 3x más engagement que al mediodía."),
        p(),
      ],
    },
  ],
};

// ── Start Here document ──────────────────────────────────────────────────────

function createStartHere(projectName, areas) {
  const orderedAreas = areas.sort((a, b) => (AREA_ORDER[a.id] || 99) - (AREA_ORDER[b.id] || 99));

  const steps = orderedAreas.flatMap((area, i) => {
    const areaDocs = AREA_DOCS[area.id] || [];
    return areaDocs.map((doc, j) => {
      const num = `${i + 1}.${j + 1}`;
      return task(`${num} ${area.icon} ${doc.title} — ${area.label}`);
    });
  });

  return {
    title: "Empieza aquí",
    blocks: [
      h(1, `${projectName} — Empieza aquí`),
      callout("important", p(tx("Este documento es tu guía. Sigue el orden de abajo. Cada documento tiene instrucciones de qué escribir y por qué."))),
      hr(),
      h(2, "Orden recomendado"),
      p(tx("Llena los documentos en este orden. Cada uno construye sobre el anterior:")),
      tasks(...steps),
      hr(),
      h(2, "Consejos"),
      callout("tip", p(tx("No intentes llenar todo en un día. Un documento por semana es un buen ritmo."))),
      callout("note", p(tx("Es normal que cambies lo que escribiste hace un mes. Los documentos son vivos — actualízalos cuando aprendas algo nuevo."))),
      callout("warning", p(tx("Los documentos marcados con ⚖️ (Legal) requieren revisión de un abogado. No los publiques sin asesoría profesional."))),
    ],
  };
}

// ── Main generator ───────────────────────────────────────────────────────────

export function generateProject(projectName, areas) {
  const packages = [];

  // First: "Start Here" in a "_inicio" package
  const startDoc = createStartHere(projectName, areas);
  packages.push({
    packageName: "_inicio",
    docs: [startDoc],
  });

  // Then: each area as a package with its docs
  const orderedAreas = [...areas].sort((a, b) => (AREA_ORDER[a.id] || 99) - (AREA_ORDER[b.id] || 99));
  for (const area of orderedAreas) {
    const docs = AREA_DOCS[area.id];
    if (!docs) continue;
    packages.push({
      packageName: area.id,
      docs: docs.map(d => ({ title: d.title, blocks: d.blocks })),
    });
  }

  return packages;
}
