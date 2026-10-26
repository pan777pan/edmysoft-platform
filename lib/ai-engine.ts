import prisma from './prisma';
import { EDMYSOFT_SYSTEM_PROMPT } from './ai-prompt';
import { loadAIConfig, type AIConfig } from './ai-config';
import { getLivePlans, loadNegotiationConfig } from './pricing-manager';
import { buildDemoSystemPrompt, isWhatsAppDemoActive, handleDemoConversation, type WhatsAppDemoConfig } from './whatsapp-demo';
import { loadBusinessKnowledge, formatKnowledgeForPrompt } from './knowledge-manager';
import {
  getCustomerMemory,
  saveCustomerMemory,
  extractClientInsights,
  formatCustomerMemoryForPrompt,
  type CustomerProfile,
} from './customer-memory';
import { checkWittyPivot } from './witty-pivots';

// =====================================================================
// AGENTE COMERCIAL AUTÓNOMO DE EDMYSOFT
// - LLM con function calling (Gemini nativo u OpenAI/OpenRouter)
// - Memoria conversacional: recibe el historial de la sesión
// - Herramientas dinámicas: servicios, planes/precios, disponibilidad,
//   agendamiento con el Director Técnico y escalamiento a humano.
// - Sin LLM configurado: agente local contextual (sin menú en bucle).
// =====================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentContext {
  channel?: 'WHATSAPP' | 'WEB';
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  conversationId?: string | null;
  contactId?: string | null;
  clientIdentifier?: string | null;
  customerMemory?: CustomerProfile | null;
  /** Si es false, las herramientas de calendario quedan deshabilitadas. */
  allowScheduling?: boolean;
  /** Modo demo temporal exclusivo de WhatsApp */
  demoConfig?: WhatsAppDemoConfig | null;
}

export interface AIResponsePayload {
  reply: string;
  detectedIntent?: 'QUOTE' | 'SCHEDULE' | 'GENERAL' | 'HUMAN_TAKEOVER';
  quoteData?: {
    totalSetup: number;
    recurring: number;
    breakdown: string;
  };
  meetingData?: {
    topic: string;
    date: string;
    time: string;
    status: string;
  };
  toolsUsed?: string[];
  modelUsed?: string;
  /** Respuestas rápidas sugeridas para el chat web. */
  suggestions?: string[];
}

const MAX_HISTORY_MESSAGES = 20;
const MAX_TOOL_ROUNDS = 5;

// ---------------------------------------------------------------------
// BASE DE CONOCIMIENTO (consultada solo vía herramientas)
// ---------------------------------------------------------------------
const SERVICES_KB: Record<string, any> = {
  ia: {
    servicio: 'Agentes de IA y chatbots para WhatsApp',
    descripcion:
      'Asistentes con IA que atienden clientes 24/7 en WhatsApp: responden dudas, cotizan, agendan citas y pasan a un humano cuando hace falta.',
    incluye: [
      'Conexión real a WhatsApp (QR o API oficial de Meta)',
      'Base de conocimiento propia del negocio (RAG)',
      'Cotizador y agendamiento automáticos',
      'Control humano en 1 clic',
    ],
    casoDeExito: 'Clínicas: -78% en tiempo de respuesta y +42% de citas confirmadas.',
  },
  n8n: {
    servicio: 'Automatización de procesos con n8n',
    descripcion:
      'Conectamos APIs, ERP, CRM, hojas de cálculo y correo para eliminar tareas manuales repetitivas.',
    incluye: [
      'Flujos y webhooks a la medida',
      'Integración con facturación electrónica DIAN y ERP',
      'Notificaciones y reportes automáticos',
      'Monitoreo y mantenimiento de los flujos',
    ],
    casoDeExito: 'Finanzas: conciliación de facturas pasó de 40 horas al mes a 15 minutos.',
    planes: [
      { nombre: 'Automatización Esencial de Leads', setupCOP: 1800000, mensualCOP: 250000 },
      { nombre: 'Integración CRM & Notificaciones', setupCOP: 3600000, mensualCOP: 480000 },
      { nombre: 'Flujos Empresariales & Facturación DIAN', setupCOP: 7200000, mensualCOP: 850000 },
    ],
  },
  nextjs: {
    servicio: 'Desarrollo web y web apps con Next.js',
    descripcion:
      'Sitios corporativos, tiendas, plataformas SaaS y paneles administrativos rápidos, seguros y optimizados para SEO.',
    incluye: [
      'Next.js 15, React y diseño UX/UI a medida',
      'Panel administrativo CMS visual y portal de clientes',
      'Seguridad blindada alineada con estándares OWASP',
      'Despliegue en la nube con Soporte prioritario por EDMYSOFT',
    ],
    casoDeExito: 'Logística: sistema de flotas con +180 vehículos monitoreados en tiempo real.',
    planes: [
      { nombre: 'Landing Page de Alta Conversión', setupCOP: 1450000, mensualCOP: 120000 },
      { nombre: 'Sitio Web Corporativo & Catálogo', setupCOP: 2900000, mensualCOP: 220000 },
      { nombre: 'Plataforma Web & E-Commerce Pro', setupCOP: 5400000, mensualCOP: 380000 },
    ],
  },
  apps: {
    servicio: 'Aplicaciones móviles y de escritorio',
    descripcion: 'Apps multiplataforma (iOS/Android) y software empresarial de escritorio a medida con arquitectura escalable.',
    incluye: [
      'Diseño y desarrollo nativo en React Native',
      'Autenticación biométrica y pasarela de pagos in-app',
      'Panel administrativo web centralizado',
      'Soporte prioritario por EDMYSOFT',
    ],
    casoDeExito: 'Clínicas: app de gestión de citas y telemedicina con sincronización en tiempo real.',
    planes: [
      { nombre: 'App Móvil iOS & Android (MVP)', setupCOP: 6800000, mensualCOP: 490000 },
      { nombre: 'Software a Medida & App Empresarial', setupCOP: 12500000, mensualCOP: 890000 },
    ],
  },
};

const PLANS_KB: Record<string, any> = {
  estandar: {
    plan: 'Plan Estándar (Agentes IA)',
    setupCOP: 2200000,
    mensualCOP: 350000,
    incluye: 'Atención 24/7, hasta 30 FAQs, 1 canal de WhatsApp, control humano y Soporte prioritario por EDMYSOFT',
  },
  plus: {
    plan: 'Plan Plus (recomendado)',
    setupCOP: 3800000,
    mensualCOP: 550000,
    incluye: 'Todo lo del Estándar + cotizador dinámico, agendamiento en calendario, integración con n8n y webhooks',
  },
  enterprise: {
    plan: 'Plan Enterprise',
    setupCOP: 6500000,
    mensualCOP: 950000,
    incluye: 'Multicanal (WhatsApp, Instagram, Web), RAG vectorial, base de datos dedicada, generador de PDF de cotizaciones y Soporte prioritario por EDMYSOFT',
  },
};

const EXTRAS_KB = {
  instagramDirect: '$890.000 COP de setup + $140.000 COP/mes (atiende DMs 24/7 y transfiere a WhatsApp)',
  facturacionDIAN: '$1.250.000 COP de setup + $180.000 COP/mes (emisión automática de factura electrónica validada)',
  googleCalendar: '$550.000 COP de setup + $60.000 COP/mes (sincronización bidireccional y links de Meet)',
  sincronizacionSheets: '$450.000 COP de setup + $50.000 COP/mes (registro de cada lead en Google Sheets/Excel en vivo)',
  difusionMasivaWhatsApp: '$950.000 COP de setup + $190.000 COP/mes (campañas comerciales por Meta Cloud API)',
  notasDeVozIA: '$650.000 COP de setup + $110.000 COP/mes (comprensión y respuesta de audios de clientes)',
  moduloMultilingue: '$750.000 COP de setup + $90.000 COP/mes (atención en español e inglés)',
  pasarelaWompi: '$750.000 COP de setup + $120.000 COP/mes (cobro con tarjetas, Nequi y PSE)',
  generadorCotizacionesPDF: '$850.000 COP (incluido gratis en Enterprise)',
  segundoAgente: '$1.650.000 COP de setup + $200.000 COP/mes',
  metaCloudAPI: 'Sin costo fijo mensual; ~$140 COP por conversación comercial de 24h pagados directo a Meta',
};

const fmtCOP = (n: number) => '$' + n.toLocaleString('es-CO') + ' COP';

// Preguntas frecuentes: la IA las consulta con buscar_faq para responder con datos exactos
const FAQ_KB: { tema: string; palabras: string[]; respuesta: string }[] = [
  {
    tema: 'Seguridad y datos',
    palabras: ['seguridad', 'segur', 'datos', 'privacidad', 'owasp', 'proteccion', 'confidencial', 'ley 1581', 'habeas'],
    respuesta:
      'Construimos con prácticas alineadas a OWASP: sesiones seguras, control de acceso por roles, cifrado en tránsito y auditoría de actividad. Los datos de tu negocio son tuyos y la IA solo responde con la información que tú autorizas. Cumplimos el tratamiento de datos personales de la Ley 1581 de Colombia.',
  },
  {
    tema: 'Tiempos de entrega',
    palabras: ['tiempo', 'demora', 'cuanto tarda', 'entrega', 'plazo', 'semanas', 'rapido', 'cuando estaria'],
    respuesta:
      'Un agente de IA en WhatsApp suele quedar operativo en pocos días tras definir la base de conocimiento; las webs y plataformas a medida dependen del alcance y se fijan en el diagnóstico. No prometemos plazos sin conocer el proyecto: Edier los define con el cliente en la reunión diagnóstica.',
  },
  {
    tema: 'Proceso de trabajo',
    palabras: ['proceso', 'como trabajan', 'metodologia', 'pasos', 'etapas', 'como funciona', 'empezar'],
    respuesta:
      'Trabajamos en 5 etapas con seguimiento en el portal de clientes: 1) Análisis, 2) Prototipado, 3) Desarrollo, 4) Pruebas y 5) Despliegue. Empieza con una reunión diagnóstica gratuita de ~45 minutos con Edier Mery Gallego.',
  },
  {
    tema: 'WhatsApp: QR vs API oficial',
    palabras: ['qr', 'api oficial', 'meta', 'bloqueo', 'bloquear', 'numero', 'whatsapp business', 'cloud api', 'baneo'],
    respuesta:
      'Hay dos formas de conectar WhatsApp: por QR (rápido, ideal para empezar y validar) o por la API oficial de Meta (más estable y recomendada para alto volumen o campañas). Con la API oficial no pagas mensualidad a Meta; solo ~$140 COP por conversación comercial iniciada. Te ayudamos a elegir según tu volumen.',
  },
  {
    tema: 'Control humano',
    palabras: ['humano', 'persona', 'control', 'takeover', 'intervenir', 'supervisar', 'revisar conversaciones'],
    respuesta:
      'Cada conversación puede pasar a control humano en 1 clic desde el panel: el bot se silencia y tu equipo responde. También puedes revisar todo el historial y la IA escala sola cuando el cliente pide hablar con una persona.',
  },
  {
    tema: 'Soporte y mantenimiento',
    palabras: ['soporte', 'mantenimiento', 'ayuda', 'garantia', 'despues', 'postventa', 'caida', 'falla'],
    respuesta:
      'Las mensualidades incluyen monitoreo, soporte continuo y mejora evolutiva del agente con Soporte prioritario por EDMYSOFT. Contamos con infraestructura dedicada de alta disponibilidad y equipo multidesarrollador para garantizar continuidad. Las condiciones exactas se confirman por escrito en la propuesta comercial.',
  },
  {
    tema: 'Pagos y facturación',
    palabras: ['pago', 'pagar', 'factura', 'transferencia', 'tarjeta', 'wompi', 'anticipo', 'contrato', 'iva', 'cuotas'],
    respuesta:
      'Cobramos un setup único y una mensualidad según el plan, siempre en COP y con propuesta formal. Contamos con pasarela Wompi para pagos en línea. Las condiciones de pago e IVA se detallan en la cotización; Edier las ajusta al proyecto en la reunión.',
  },
  {
    tema: 'Personalización e idiomas',
    palabras: ['personaliz', 'idioma', 'ingles', 'marca', 'tono', 'entrenar', 'base de conocimiento', 'catalogo', 'rag', 'documentos'],
    respuesta:
      'El agente se entrena con la información de tu negocio (catálogo, precios, FAQs, políticas) mediante una base de conocimiento propia, con el tono de tu marca. Puede atender en español y otros idiomas si lo necesitas.',
  },
  {
    tema: 'Integraciones',
    palabras: ['integra', 'crm', 'erp', 'calendario', 'google', 'sheets', 'n8n', 'zapier', 'api', 'facturacion electronica', 'dian', 'instagram'],
    respuesta:
      'Integramos con calendario, CRM, ERP, hojas de cálculo, correo y facturación electrónica DIAN mediante n8n y webhooks. El Plan Enterprise suma Instagram y web en el mismo panel.',
  },
  {
    tema: 'Quiénes somos',
    palabras: ['quienes', 'edier', 'empresa', 'respaldo', 'equipo', 'experiencia'],
    respuesta:
      'EDMYSOFT es una empresa colombiana liderada técnicamente por Edier Mery Gallego con infraestructura propia de alta disponibilidad, QA y equipo multidesarrollador. Casos: clínicas (-78% en tiempo de respuesta), logística (+180 vehículos monitoreados) y finanzas (conciliación de 40 horas a 15 minutos).',
  },
];

function searchFAQ(query: string): { tema: string; respuesta: string }[] {
  const q = norm(query);
  return FAQ_KB.map((f) => ({
    f,
    score: f.palabras.reduce((acc, p) => (q.includes(norm(p)) ? acc + 1 : acc), 0) + (q.includes(norm(f.tema)) ? 2 : 0),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((x) => ({ tema: x.f.tema, respuesta: x.f.respuesta }));
}

// ---------------------------------------------------------------------
// SYSTEM PROMPT
// ---------------------------------------------------------------------
export { EDMYSOFT_SYSTEM_PROMPT };

function buildSystemPrompt(ctx: AgentContext): string {
  // Si está activo el Modo Demo en WhatsApp, el bot asume al 100% la empresa del cliente
  if (ctx.demoConfig && isWhatsAppDemoActive()) {
    return buildDemoSystemPrompt(ctx.demoConfig);
  }

  const now = bogotaNow();
  const cfg = loadAIConfig();
  const lines = [
    EDMYSOFT_SYSTEM_PROMPT,
    '',
    '# CONTEXTO DE LA SESIÓN',
    `- Fecha y hora actual en Colombia: ${weekdayName(now)} ${ymd(now)}, ${hhmm(now)}.`,
    `- Canal: ${ctx.channel === 'WEB' ? 'chat web (no tienes su teléfono; pide correo o WhatsApp antes de guardar el lead)' : 'WhatsApp'}.`,
  ];
  if (hasRealName(ctx.contactName)) lines.push(`- Nombre del cliente: ${ctx.contactName}.`);
  if (ctx.contactPhone) lines.push(`- Teléfono del cliente: ${ctx.contactPhone}.`);
  if (ctx.contactEmail) lines.push(`- Correo del cliente: ${ctx.contactEmail}.`);
  if (cfg.extraInstructions.trim()) {
    lines.push('', '# INSTRUCCIONES ADICIONALES DEL DUEÑO (prioridad alta)', cfg.extraInstructions.trim());
  }

  // Base de conocimiento dinámicamente administrada en /admin/conocimiento
  const knowledge = loadBusinessKnowledge();
  lines.push('', formatKnowledgeForPrompt(knowledge));

  // Memoria permanente del cliente y reconocimiento continuo
  if (ctx.customerMemory) {
    const memPrompt = formatCustomerMemoryForPrompt(ctx.customerMemory);
    if (memPrompt) lines.push('', memPrompt);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------
// UTILIDADES DE FECHA (America/Bogota = UTC-5, sin horario de verano)
// ---------------------------------------------------------------------
const BOGOTA_OFFSET_MS = -5 * 3600 * 1000;
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function bogotaNow(): Date {
  return new Date(Date.now() + BOGOTA_OFFSET_MS);
}
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function hhmm(d: Date): string {
  return d.toISOString().slice(11, 16);
}
function weekdayName(d: Date): string {
  return WEEKDAYS[d.getUTCDay()];
}
function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}
function labelTime(t24: string): string {
  const [h, m] = t24.split(':').map(Number);
  const suffix = h >= 12 ? 'p. m.' : 'a. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}
function labelDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return `${weekdayName(d)} ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`;
}
function hasRealName(name?: string | null): boolean {
  return !!name && !/^(visitante|invitado|cliente|\d+)/i.test(name.trim());
}

/** Horarios de atención del Director Técnico (hora Colombia). */
function slotsForWeekday(dow: number): string[] {
  if (dow === 0) return [];
  if (dow === 6) return ['09:00', '10:00', '11:00'];
  return ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
}

function normalizeTime24(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  const m = s.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?\s?m\.?|p\.?\s?m\.?)?/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3]?.replace(/[\s.]/g, '');
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

async function getBookedSlots(date: string): Promise<Set<string>> {
  const booked = new Set<string>();
  const logs = await prisma.activityLog.findMany({
    where: { entityType: 'MEETING', action: 'MEETING_SCHEDULED' },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  for (const log of logs) {
    try {
      const d = JSON.parse(log.details || '{}');
      if (d.date !== date || /cancel/i.test(d.status || '')) continue;
      const t = normalizeTime24(d.time24 || d.time);
      if (t) booked.add(t);
    } catch {
      /* ignorar registros corruptos */
    }
  }
  return booked;
}

async function freeSlots(date: string): Promise<string[]> {
  const d = new Date(`${date}T12:00:00Z`);
  const booked = await getBookedSlots(date);
  const minInstant = Date.now() + 60 * 60 * 1000; // al menos 1 hora de anticipación
  return slotsForWeekday(d.getUTCDay()).filter(
    (t) => !booked.has(t) && Date.parse(`${date}T${t}:00-05:00`) >= minInstant
  );
}

// ---------------------------------------------------------------------
// HERRAMIENTAS (Function Calling)
// ---------------------------------------------------------------------
interface ToolDef {
  name: string;
  description: string;
  parameters: any;
}

const TOOL_DEFS: ToolDef[] = [
  {
    name: 'consultar_servicios',
    description:
      'Devuelve información detallada de un servicio de EDMYSOFT. Úsala solo cuando el usuario pregunte por un servicio específico.',
    parameters: {
      type: 'object',
      properties: {
        servicio: {
          type: 'string',
          enum: ['ia', 'n8n', 'nextjs', 'apps'],
          description: 'ia = agentes/chatbots IA, n8n = automatización, nextjs = desarrollo web, apps = apps móviles/escritorio',
        },
      },
      required: ['servicio'],
    },
  },
  {
    name: 'consultar_planes_precios',
    description: 'Devuelve planes y precios oficiales en COP de los agentes de IA y módulos adicionales. Úsala cuando pregunten por costos o cotización.',
    parameters: {
      type: 'object',
      properties: {
        plan: {
          type: 'string',
          enum: ['estandar', 'plus', 'enterprise', 'todos'],
          description: 'Plan específico o "todos" para comparar',
        },
      },
    },
  },
  {
    name: 'consultar_disponibilidad',
    description: 'Consulta los horarios libres del Director Técnico (Edier Mery Gallego) para una fecha. Úsala antes de proponer horarios.',
    parameters: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD (hora de Colombia)' },
      },
      required: ['fecha'],
    },
  },
  {
    name: 'agendar_reunion',
    description:
      'Agenda una videollamada diagnóstica con el Director Técnico. Úsala solo cuando el usuario confirmó fecha y hora y tengas su nombre.',
    parameters: {
      type: 'object',
      properties: {
        nombre: { type: 'string', description: 'Nombre del cliente' },
        fecha: { type: 'string', description: 'YYYY-MM-DD' },
        hora: { type: 'string', description: 'Hora en formato 24h HH:mm, por ejemplo 15:00' },
        motivo: { type: 'string', description: 'Resumen breve del proyecto o necesidad del cliente' },
        email: { type: 'string', description: 'Correo del cliente (opcional)' },
      },
      required: ['nombre', 'fecha', 'hora', 'motivo'],
    },
  },
  {
    name: 'solicitar_asesor_humano',
    description: 'Escala la conversación a una persona del equipo. Úsala si el usuario pide hablar con un humano o hay una queja.',
    parameters: {
      type: 'object',
      properties: { motivo: { type: 'string', description: 'Motivo del escalamiento' } },
      required: ['motivo'],
    },
  },
  {
    name: 'buscar_faq',
    description:
      'Busca respuestas oficiales a preguntas frecuentes: seguridad, tiempos de entrega, proceso de trabajo, pagos, soporte, WhatsApp QR vs API oficial, integraciones, personalización.',
    parameters: {
      type: 'object',
      properties: { consulta: { type: 'string', description: 'La duda del cliente con sus palabras' } },
      required: ['consulta'],
    },
  },
  {
    name: 'guardar_datos_lead',
    description:
      'Registra en el CRM lo que se sepa del cliente potencial. Llámala en silencio cada vez que aprendas datos nuevos relevantes (negocio, necesidad, volumen, urgencia, presupuesto, correo). No la anuncies al cliente.',
    parameters: {
      type: 'object',
      properties: {
        nombre: { type: 'string', description: 'Nombre del cliente' },
        negocio: { type: 'string', description: 'Nombre o tipo de negocio/empresa' },
        sector: { type: 'string', description: 'Sector (salud, logística, comercio, educación...)' },
        necesidad: { type: 'string', description: 'Problema o necesidad principal, en palabras del cliente' },
        servicio_interes: { type: 'string', enum: ['ia', 'n8n', 'nextjs', 'apps', 'otro'] },
        volumen: { type: 'string', description: 'Volumen aproximado de mensajes/clientes (ej. 80 mensajes al día)' },
        urgencia: { type: 'string', description: 'Cuándo lo necesita (ej. este mes, sin afán)' },
        presupuesto_cop: { type: 'number', description: 'Presupuesto aproximado en COP si lo mencionó' },
        email: { type: 'string', description: 'Correo del cliente' },
        telefono: { type: 'string', description: 'WhatsApp/teléfono si lo dio (solo chat web)' },
        temperatura: {
          type: 'string',
          enum: ['frio', 'tibio', 'caliente'],
          description: 'caliente = quiere avanzar/agendar pronto; tibio = interesado pero explorando; frio = solo curiosidad',
        },
      },
    },
  },
];

/** Enlace "Añadir a Google Calendar" (45 min, hora Colombia). */
function calendarLink(titulo: string, fecha: string, hora: string, detalle: string, ubicacion: string = 'Google Meet (videollamada)'): string {
  const start = new Date(Date.parse(`${fecha}T${hora}:00-05:00`));
  const end = new Date(start.getTime() + 45 * 60000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return (
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(titulo)}&dates=${f(start)}/${f(end)}` +
    `&details=${encodeURIComponent(detalle)}&location=${encodeURIComponent(ubicacion)}&ctz=America/Bogota`
  );
}

/** Avisa al dueño por WhatsApp (leads calientes, citas, solicitudes de asesor). Nunca lanza error. */
async function alertOwner(text: string): Promise<void> {
  try {
    const mod = await import('./whatsapp-baileys');
    await mod.notifyOwner(text);
  } catch {
    /* WhatsApp no conectado: no es crítico */
  }
}

const STAGE_ORDER = ['NUEVO', 'EN_DIAGNOSTICO', 'CALIFICADO'];

async function upsertLead(args: any, ctx: AgentContext) {
  const email = String(args.email || ctx.contactEmail || '').trim().toLowerCase() || null;
  const phone = ctx.contactPhone || (args.telefono ? String(args.telefono).replace(/\D/g, '') : null) || null;
  const name = String(args.nombre || '').trim();
  const business = String(args.negocio || '').trim() || null;

  let contact = ctx.contactId ? await prisma.contact.findUnique({ where: { id: ctx.contactId } }) : null;
  if (!contact && phone) contact = await prisma.contact.findFirst({ where: { phone } });
  if (!contact && email) contact = await prisma.contact.findFirst({ where: { email } });

  if (!contact) {
    if (!phone && !email) {
      return { guardado: false, nota: 'Aún no hay forma de contactarlo. Pídele de forma natural su correo o WhatsApp para dar seguimiento.' };
    }
    contact = await prisma.contact.create({
      data: {
        fullName: name || ctx.contactName || 'Lead web',
        phone,
        email,
        companyName: business,
        preferredChannel: ctx.channel === 'WEB' ? 'WEB_FORM' : 'WHATSAPP',
      },
    });
  } else {
    const data: any = {};
    if (name && (!hasRealName(contact.fullName) || contact.fullName === contact.phone)) data.fullName = name;
    if (email && !contact.email) data.email = email;
    if (business) data.companyName = business;
    if (Object.keys(data).length) contact = await prisma.contact.update({ where: { id: contact.id }, data });
  }

  const temp = String(args.temperatura || 'tibio');
  const targetStage = temp === 'caliente' ? 'CALIFICADO' : temp === 'tibio' ? 'EN_DIAGNOSTICO' : 'NUEVO';
  const need = [args.necesidad, args.volumen && `Volumen: ${args.volumen}`, args.sector && `Sector: ${args.sector}`]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 500);
  const budget = Number(args.presupuesto_cop) > 0 ? Number(args.presupuesto_cop) : undefined;

  let opp = await prisma.opportunity.findFirst({
    where: { contactId: contact.id, stage: { notIn: ['GANADA', 'PERDIDA'] } },
    orderBy: { createdAt: 'desc' },
  });

  let becameHot = false;
  if (!opp) {
    opp = await prisma.opportunity.create({
      data: {
        contactId: contact.id,
        title: `Lead IA - ${business || contact.fullName}`,
        stage: targetStage,
        serviceInterest: args.servicio_interes || null,
        identifiedNeed: need || null,
        targetBudget: budget,
        desiredDeadline: args.urgencia ? String(args.urgencia).slice(0, 120) : null,
      },
    });
    becameHot = targetStage === 'CALIFICADO';
  } else {
    const upgrade = STAGE_ORDER.indexOf(targetStage) > STAGE_ORDER.indexOf(opp.stage);
    opp = await prisma.opportunity.update({
      where: { id: opp.id },
      data: {
        ...(upgrade ? { stage: targetStage } : {}),
        ...(args.servicio_interes ? { serviceInterest: args.servicio_interes } : {}),
        ...(need ? { identifiedNeed: need } : {}),
        ...(budget ? { targetBudget: budget } : {}),
        ...(args.urgencia ? { desiredDeadline: String(args.urgencia).slice(0, 120) } : {}),
      },
    });
    if (upgrade) {
      becameHot = targetStage === 'CALIFICADO';
      await prisma.stageHistory.create({
        data: { opportunityId: opp.id, fromStage: null, toStage: targetStage, notes: 'Calificado automáticamente por el agente de IA' },
      });
    }
  }

  if (becameHot) {
    await alertOwner(
      `🔥 *Lead caliente en EDMYSOFT*\n👤 ${contact.fullName}${business ? ` (${business})` : ''}\n📱 ${contact.phone || contact.email || 'sin contacto'}\n🎯 ${need || 'Sin detalle'}\n⏱ ${args.urgencia || 'urgencia no indicada'}`
    );
  }
  return { guardado: true, etapaCRM: opp.stage, contactoId: contact.id };
}

interface ToolOutcome {
  result: any;
  intent?: AIResponsePayload['detectedIntent'];
  quoteData?: AIResponsePayload['quoteData'];
  meetingData?: AIResponsePayload['meetingData'];
}

async function executeTool(name: string, args: any, ctx: AgentContext): Promise<ToolOutcome> {
  args = args || {};
  if ((name === 'agendar_reunion' || name === 'consultar_disponibilidad') && ctx.allowScheduling === false) {
    return {
      result: {
        exito: false,
        error: 'El agendamiento automático está desactivado. Ofrece que Edier lo contacte (+57 323 416 6354) para coordinar.',
      },
    };
  }
  switch (name) {
    case 'consultar_servicios': {
      const info = SERVICES_KB[String(args.servicio || '').toLowerCase()];
      if (!info) return { result: { error: 'Servicio no encontrado', disponibles: Object.keys(SERVICES_KB) } };
      return { result: info, intent: 'GENERAL' };
    }

    case 'consultar_planes_precios': {
      const livePlans = await getLivePlans();
      const key = String(args.plan || 'todos').toLowerCase();
      const plan = livePlans[key];
      if (plan) {
        return {
          result: {
            plan: plan.name,
            setup: fmtCOP(plan.setupPrice),
            mensual: fmtCOP(plan.recurringPrice),
            setupCOP: plan.setupPrice,
            mensualCOP: plan.recurringPrice,
            incluye: plan.featuresIncluded?.join(', ') || plan.description,
            extras: EXTRAS_KB,
          },
          intent: 'QUOTE',
          quoteData: {
            totalSetup: plan.setupPrice,
            recurring: plan.recurringPrice,
            breakdown: `${plan.name} (Setup: ${fmtCOP(plan.setupPrice)} + ${fmtCOP(plan.recurringPrice)}/mes)`,
          },
        };
      }
      return {
        result: {
          planes: Object.values(livePlans).map((p) => ({
            plan: p.name,
            setup: fmtCOP(p.setupPrice),
            mensual: fmtCOP(p.recurringPrice),
            incluye: p.featuresIncluded?.join(', ') || p.description,
          })),
          extras: EXTRAS_KB,
          moneda: 'COP',
        },
        intent: 'QUOTE',
      };
    }

    case 'consultar_disponibilidad': {
      const fecha = String(args.fecha || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { result: { error: 'Formato de fecha inválido. Usa YYYY-MM-DD.' } };
      const dow = new Date(`${fecha}T12:00:00Z`).getUTCDay();
      if (dow === 0) return { result: { fecha, horariosLibres: [], nota: 'Los domingos no hay atención. Ofrece otro día.' } };
      const libres = await freeSlots(fecha);
      return {
        result: {
          fecha,
          dia: labelDate(fecha),
          horariosLibres: libres.map((t) => ({ hora24: t, texto: labelTime(t) })),
          nota: libres.length ? 'Hora de Colombia. Cada sesión dura ~45 minutos.' : 'Sin cupos ese día; ofrece otra fecha.',
        },
      };
    }

    case 'agendar_reunion': {
      const fecha = String(args.fecha || '');
      const hora = normalizeTime24(String(args.hora || ''));
      const nombre = String(args.nombre || ctx.contactName || '').trim();
      const modalidad = /presencial|oficina|en persona|sede/i.test(String(args.modalidad || args.motivo || '')) ? 'PRESENCIAL' : 'VIRTUAL';
      const ubicacion = modalidad === 'PRESENCIAL' ? 'Sede EDMYSOFT / Acordar punto físico' : 'Google Meet (videollamada online)';

      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !hora) {
        return { result: { exito: false, error: 'Fecha u hora inválidas. Pide al cliente confirmarlas.' } };
      }
      if (!nombre) return { result: { exito: false, error: 'Falta el nombre del cliente. Pídelo antes de agendar.' } };

      const maxDate = ymd(addDays(bogotaNow(), 60));
      if (fecha > maxDate) return { result: { exito: false, error: 'Solo se agenda con máximo 60 días de anticipación.' } };

      const libres = await freeSlots(fecha);
      if (!libres.includes(hora)) {
        return {
          result: {
            exito: false,
            error: 'Ese horario no está disponible (ocupado, fuera de horario o muy próximo).',
            horariosLibresEseDia: libres.map((t) => labelTime(t)),
          },
        };
      }

      const email = String(args.email || ctx.contactEmail || '').trim() || `${ctx.contactPhone || 'cliente'}@whatsapp.edmysoft.com`;
      const motivo = String(args.motivo || 'Sesión diagnóstica').slice(0, 200);
      const timeLabel = `${labelTime(hora)} (COL)`;

      await prisma.activityLog.create({
        data: {
          action: 'MEETING_SCHEDULED',
          entityType: 'MEETING',
          entityId: `${ctx.channel === 'WEB' ? 'WEB' : 'WA'}-MEET-${Date.now()}`,
          details: JSON.stringify({
            clientName: nombre,
            email,
            phone: ctx.contactPhone || null,
            topic: motivo,
            date: fecha,
            time: timeLabel,
            time24: hora,
            status: 'Confirmada',
            modalidad,
            ubicacion,
            source: 'AI_AGENT',
          }),
        },
      });

      const enlaceCalendario = calendarLink(
        `Reunión ${modalidad.toLowerCase()} con EDMYSOFT`,
        fecha,
        hora,
        `Sesión con Edier Mery Gallego, Director Técnico de EDMYSOFT. Modalidad: ${modalidad}. Tema: ${motivo}`,
        ubicacion
      );
      await alertOwner(
        `📅 *Nueva reunión ${modalidad.toLowerCase()} agendada*\n👤 ${nombre}${ctx.contactPhone ? ` (+${ctx.contactPhone})` : ''}\n🗓 ${labelDate(fecha)} · ${labelTime(hora)} (COL)\n📌 ${ubicacion}\n🎯 ${motivo}`
      );

      return {
        result: {
          exito: true,
          mensaje: `Reunión ${modalidad.toLowerCase()} confirmada con Edier Mery Gallego el ${labelDate(fecha)} a las ${labelTime(hora)} (hora Colombia).`,
          enlaceCalendario,
          modalidad,
          ubicacion,
        },
        intent: 'SCHEDULE',
        meetingData: { topic: motivo, date: fecha, time: timeLabel, status: 'Confirmada' },
      };
    }

    case 'solicitar_asesor_humano': {
      await prisma.activityLog.create({
        data: {
          action: 'HUMAN_REQUESTED',
          entityType: 'Conversation',
          entityId: ctx.conversationId || `HUMAN-${Date.now()}`,
          details: JSON.stringify({
            motivo: String(args.motivo || 'Solicitud del cliente'),
            cliente: ctx.contactName || null,
            telefono: ctx.contactPhone || null,
            canal: ctx.channel || 'WHATSAPP',
          }),
        },
      });
      await alertOwner(
        `🙋 *Un cliente pide asesor humano*\n👤 ${ctx.contactName || 'Visitante'}${ctx.contactPhone ? ` (+${ctx.contactPhone})` : ''}\n📝 ${String(args.motivo || 'Sin motivo').slice(0, 200)}`
      );
      return {
        result: { exito: true, mensaje: 'El equipo fue notificado y un asesor continuará la conversación en breve.' },
        intent: 'HUMAN_TAKEOVER',
      };
    }

    case 'buscar_faq': {
      const hits = searchFAQ(String(args.consulta || ''));
      return {
        result: hits.length
          ? { resultados: hits }
          : { resultados: [], nota: 'Sin coincidencia exacta. Responde con honestidad lo que sepas y ofrece que Edier lo confirme.' },
      };
    }

    case 'guardar_datos_lead': {
      return { result: await upsertLead(args, ctx) };
    }

    default:
      return { result: { error: `Herramienta desconocida: ${name}` } };
  }
}

// ---------------------------------------------------------------------
// ORQUESTACIÓN: memoria + proveedores LLM con function calling
// ---------------------------------------------------------------------
interface AgentRun {
  reply: string;
  toolsUsed: string[];
  intent?: AIResponsePayload['detectedIntent'];
  quoteData?: AIResponsePayload['quoteData'];
  meetingData?: AIResponsePayload['meetingData'];
  modelUsed: string;
}

function prepareHistory(history: ChatMessage[], userMessage: string): { role: 'user' | 'assistant'; content: string }[] {
  const turns: { role: 'user' | 'assistant'; content: string }[] = history
    .filter((h) => h.role !== 'system' && h.content?.trim())
    .slice(-MAX_HISTORY_MESSAGES)
    .map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content }));
  turns.push({ role: 'user', content: userMessage });

  // Fusionar turnos consecutivos del mismo rol y exigir que el primero sea del usuario
  const merged: typeof turns = [];
  for (const t of turns) {
    const last = merged[merged.length - 1];
    if (last && last.role === t.role) last.content += '\n' + t.content;
    else merged.push({ ...t });
  }
  while (merged.length && merged[0].role !== 'user') merged.shift();
  return merged;
}

function toGeminiSchema(schema: any): any {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (schema && typeof schema === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(schema)) {
      out[k] = k === 'type' && typeof v === 'string' ? v.toUpperCase() : toGeminiSchema(v);
    }
    return out;
  }
  return schema;
}

class AgentState {
  toolsUsed: string[] = [];
  intent?: AIResponsePayload['detectedIntent'];
  quoteData?: AIResponsePayload['quoteData'];
  meetingData?: AIResponsePayload['meetingData'];

  async run(name: string, args: any, ctx: AgentContext) {
    this.toolsUsed.push(name);
    let outcome: ToolOutcome;
    try {
      outcome = await executeTool(name, args, ctx);
    } catch (err: any) {
      outcome = { result: { error: `Fallo interno de la herramienta: ${err.message}` } };
    }
    if (outcome.intent && (outcome.intent !== 'GENERAL' || !this.intent)) this.intent = outcome.intent;
    if (outcome.quoteData) this.quoteData = outcome.quoteData;
    if (outcome.meetingData) this.meetingData = outcome.meetingData;
    return outcome.result;
  }
}

// Estado del último intento con un LLM (visible en /admin/ia para diagnosticar claves/modelos)
declare global {
  // eslint-disable-next-line no-var
  var __edmysoft_ai_status: { ok: boolean; provider: string; model: string; error: string | null; at: string } | undefined;
}
function setAIStatus(ok: boolean, provider: string, model: string, error: string | null = null) {
  global.__edmysoft_ai_status = { ok, provider, model, error, at: new Date().toISOString() };
}
export function getAIStatus() {
  return global.__edmysoft_ai_status || null;
}

async function runGemini(
  apiKey: string,
  modelName: string,
  ctx: AgentContext,
  turns: ReturnType<typeof prepareHistory>,
  temperature: number
): Promise<AgentRun | null> {
  let model = modelName;
  const contents: any[] = turns.map((t) => ({
    role: t.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: t.content }],
  }));
  const state = new AgentState();
  const tools = [
    { functionDeclarations: TOOL_DEFS.map((t) => ({ name: t.name, description: t.description, parameters: toGeminiSchema(t.parameters) })) },
  ];
  const systemPrompt = buildSystemPrompt(ctx);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const request = (m: string) =>
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          tools,
          toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
          generationConfig: {
            temperature,
            maxOutputTokens: 800,
            // 2.5 Flash: sin "thinking" para respuestas rápidas en WhatsApp
            ...(/2\.5-flash/.test(m) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
        }),
      });

    let res = await request(model);
    if ((res.status === 404 || res.status === 400) && model !== 'gemini-2.0-flash') {
      // Modelo no disponible para esta clave: reintentar con uno estable
      const fallback = 'gemini-2.0-flash';
      const retry = await request(fallback);
      if (retry.ok) {
        model = fallback;
        res = retry;
      }
    }
    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      console.warn('Gemini respondió', res.status, body);
      setAIStatus(false, 'gemini', model, `HTTP ${res.status}: ${body}`);
      return null;
    }
    const data = await res.json();
    const content = data.candidates?.[0]?.content;
    const parts: any[] = content?.parts || [];
    const calls = parts.filter((p) => p.functionCall);

    if (calls.length === 0) {
      const text = parts
        .filter((p) => !p.thought)
        .map((p) => p.text || '')
        .join('')
        .trim();
      if (!text) {
        setAIStatus(false, 'gemini', model, 'Respuesta vacía del modelo');
        return null;
      }
      setAIStatus(true, 'gemini', model);
      return { reply: text, modelUsed: model, ...pickState(state) };
    }

    contents.push({ role: 'model', parts }); // conserva firmas de pensamiento si existen
    const responses: any[] = [];
    for (const c of calls) {
      const result = await state.run(c.functionCall.name, c.functionCall.args, ctx);
      responses.push({ functionResponse: { name: c.functionCall.name, response: { result } } });
    }
    contents.push({ role: 'user', parts: responses });
  }
  return null;
}

async function runOpenAICompatible(
  provider: 'openai' | 'openrouter',
  apiKey: string,
  model: string,
  ctx: AgentContext,
  turns: ReturnType<typeof prepareHistory>,
  temperature: number
): Promise<AgentRun | null> {
  const isOAI = provider === 'openai';
  const endpoint = isOAI ? 'https://api.openai.com/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';

  const messages: any[] = [{ role: 'system', content: buildSystemPrompt(ctx) }, ...turns];
  const tools = TOOL_DEFS.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }));
  const state = new AgentState();

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, tools, tool_choice: 'auto', temperature, max_tokens: 800 }),
    });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      console.warn(`${provider} respondió`, res.status, body);
      setAIStatus(false, provider, model, `HTTP ${res.status}: ${body}`);
      return null;
    }
    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    if (!msg) return null;

    if (!msg.tool_calls?.length) {
      const text = (msg.content || '').trim();
      if (!text) {
        setAIStatus(false, provider, model, 'Respuesta vacía del modelo');
        return null;
      }
      setAIStatus(true, provider, model);
      return { reply: text, modelUsed: model, ...pickState(state) };
    }

    messages.push(msg);
    for (const call of msg.tool_calls) {
      let args: any = {};
      try {
        args = JSON.parse(call.function.arguments || '{}');
      } catch {
        /* argumentos vacíos */
      }
      const result = await state.run(call.function.name, args, ctx);
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  return null;
}

function pickState(s: AgentState) {
  return { toolsUsed: s.toolsUsed, intent: s.intent, quoteData: s.quoteData, meetingData: s.meetingData };
}

// ---------------------------------------------------------------------
// AGENTE LOCAL (sin API key): contextual, con memoria y herramientas.
// No es un LLM: usa reglas, pero nunca devuelve un menú fijo ni repite.
// ---------------------------------------------------------------------
const norm = (s: any) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(en|por|de|a)\s+la\s+manana\b/g, ' am_period ');

function parseDateFromText(text: string): string | null {
  const t = norm(text);
  const now = bogotaNow();

  let m = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[0];

  m = t.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?/);
  if (m) {
    const day = +m[1], month = +m[2];
    let year = m[3] ? +m[3] : now.getUTCFullYear();
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      let d = new Date(Date.UTC(year, month - 1, day, 12));
      if (!m[3] && ymd(d) < ymd(now)) d = new Date(Date.UTC(year + 1, month - 1, day, 12));
      return ymd(d);
    }
  }

  const monthNames = MONTHS.map((x) => norm(x));
  m = t.match(new RegExp(`\\b(\\d{1,2})\\s+de\\s+(${monthNames.join('|')})`));
  if (m) {
    const month = monthNames.indexOf(m[2]);
    let d = new Date(Date.UTC(now.getUTCFullYear(), month, +m[1], 12));
    if (ymd(d) < ymd(now)) d = new Date(Date.UTC(now.getUTCFullYear() + 1, month, +m[1], 12));
    return ymd(d);
  }

  if (/pasado\s+manana/.test(t)) return ymd(addDays(now, 2));
  if (/\bmanana\b/.test(t)) return ymd(addDays(now, 1));
  if (/\bhoy\b/.test(t)) return ymd(now);

  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  for (let i = 0; i < days.length; i++) {
    if (new RegExp(`\\b${days[i]}\\b`).test(t)) {
      let diff = (i - now.getUTCDay() + 7) % 7;
      if (diff === 0) diff = 7;
      return ymd(addDays(now, diff));
    }
  }
  return null;
}

function parseTimeFromText(text: string): string | null {
  const t = norm(text);
  let m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?\s?m\.?|p\.?\s?m\.?)(?![a-z])/);
  if (m) return normalizeTime24(`${m[1]}:${m[2] || '00'} ${m[3]}`);

  m = t.match(/\ba\s+las?\s+(\d{1,2})(?::(\d{2}))?\s*(?:de\s+la\s+(manana|tarde|noche))?/);
  if (m) {
    let h = +m[1];
    const min = m[2] ? +m[2] : 0;
    if (m[3] === 'tarde' || m[3] === 'noche') {
      if (h < 12) h += 12;
    } else if (!m[3] && h >= 1 && h <= 6) {
      h += 12; // horario laboral: "a las 3" => 3 p. m.
    }
    if (h <= 23) return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  m = t.match(/\b(\d{1,2}):(\d{2})\b/);
  if (m) return normalizeTime24(`${m[1]}:${m[2]}`);
  return null;
}

function guessTopic(texts: string[]): string {
  const t = norm(texts.join(' '));
  if (/chatbot|agente|whatsapp|inteligencia|\bia\b|bot\b/.test(t)) return 'Agente de IA / chatbot para WhatsApp';
  if (/n8n|automatiz|flujo|integra|erp|dian|factura/.test(t)) return 'Automatización de procesos con n8n';
  if (/web|pagina|sitio|tienda|ecommerce|next/.test(t)) return 'Desarrollo web / Next.js';
  if (/app|movil|aplicacion/.test(t)) return 'Aplicación móvil o de escritorio';
  return 'Sesión diagnóstica de proyecto';
}

function topicFromMessage(t: string): 'ia' | 'n8n' | 'nextjs' | 'apps' | null {
  if (/chatbot|\bbot\b|agente|whatsapp|inteligencia artificial|\bia\b|asistente virtual/.test(t)) return 'ia';
  if (/n8n|automatiz|flujo|integrac|erp|dian|proceso/.test(t)) return 'n8n';
  if (/next|react|pagina web|sitio web|tienda|ecommerce|e-commerce|landing|plataforma|desarrollo web|\bweb\b/.test(t)) return 'nextjs';
  if (/\bapp\b|\bapps\b|movil|aplicacion|escritorio|software/.test(t)) return 'apps';
  return null;
}

interface IndustryPlaybook {
  id: string;
  sector: string;
  pattern: RegExp;
  diagnosis: string;
  followUp: string;
  service: 'ia' | 'nextjs' | 'n8n' | 'apps';
}

const INDUSTRY_PLAYBOOKS: IndustryPlaybook[] = [
  {
    id: 'inmobiliaria',
    sector: 'Inmobiliaria y Bienes Raíces',
    pattern: /\b(inmobiliaria|inmueble|bienes raices|arriendo|arriendos|apartamento|apartamentos|casa|casas|finca raiz|propiedad|propiedades|corretaje)\b/,
    diagnosis:
      'Para una inmobiliaria, el mayor cuello de botella suele ser que los asesores pierden horas respondiendo si un inmueble sigue disponible o enviando fotos una y otra vez a personas que no tienen el presupuesto. Con nuestro agente de IA en WhatsApp, el bot califica de inmediato si buscan compra o arriendo, el presupuesto y la zona deseada, envía las fichas disponibles con fotos y agenda la visita física directo en el calendario del asesor. Esto filtra curiosos y ahorra hasta un 80% del tiempo operativo.',
    followUp: '¿Cuántos inmuebles tienen en cartera o cuántos mensajes de clientes reciben al día aproximadamente?',
    service: 'ia',
  },
  {
    id: 'clinica_salud',
    sector: 'Salud, Clínicas y Odontología',
    pattern: /\b(clinica|clinicas|odontolog|dentista|medico|medica|consultorio|salud|estetica|psicolog|doctor|doctora|paciente|pacientes)\b/,
    diagnosis:
      'En el sector salud, el gran problema es el ausentismo (las citas a las que los pacientes no llegan) y las recepcionistas colapsadas contestando precios de tratamientos. Nuestro agente de IA resuelve dudas sobre procedimientos, consulta la agenda disponible en tiempo real, reserva la cita y envía confirmaciones automáticas 24 horas antes por WhatsApp. En clínicas hemos logrado reducir el ausentismo en más de un 40% y atender al instante a deshoras.',
    followUp: '¿Cuentan hoy con una persona dedicada a la agenda en WhatsApp o usan algún software de citas médicas?',
    service: 'ia',
  },
  {
    id: 'ecommerce_tienda',
    sector: 'E-commerce, Tiendas y Comercio',
    pattern: /\b(tienda|tiendas|ecommerce|e-commerce|comercio|vendo ropa|calzado|zapatos|prendas|accesorios|productos|catalogo|carrito|pedidos online)\b/,
    diagnosis:
      'Para tiendas y comercio, tardar 20 minutos en contestar significa que el cliente ya compró en otra cuenta de Instagram o WhatsApp. Nuestro agente muestra el catálogo interactivo con fotos, precios y stock en tiempo real, responde preguntas de tallas o envíos, envía enlaces de pago directo con Wompi (tarjetas, PSE, Nequi) y recupera carritos abandonados automáticamente.',
    followUp: '¿Manejan hoy los pagos y envíos de forma manual por chat o ya cuentan con alguna plataforma web?',
    service: 'ia',
  },
  {
    id: 'restaurante_gastronomia',
    sector: 'Restaurantes y Gastronomía',
    pattern: /\b(restaurante|restaurantes|comida|domicilio|domicilios|carta|menu|pizzeria|hamburgues|platos|pedidos de comida)\b/,
    diagnosis:
      'En gastronomía, depender de apps de domicilios te cuesta entre el 20% y 30% de comisión por plato. Nuestro agente toma pedidos completos directamente por tu WhatsApp: envía la carta digital interactiva, captura las adiciones, calcula el total, captura la dirección de entrega y envía la orden lista a cocina o caja.',
    followUp: '¿Aproximadamente cuántos pedidos a domicilio manejan al día en las horas pico?',
    service: 'ia',
  },
  {
    id: 'servicios_profesionales',
    sector: 'Servicios Profesionales, Leyes y Finanzas',
    pattern: /\b(abogad|abogados|contable|contador|contadores|firma|asesoria legal|tributari|agencia|marketing|consultoria|asesorias)\b/,
    diagnosis:
      'Para firmas y consultores, el tiempo es el activo más valioso. El agente de IA actúa como un filtro de admisión de élite: hace las preguntas clave para calificar el caso, solicita documentos preliminares en PDF/foto y agenda la sesión de asesoría diagnóstica en Google Calendar con el especialista adecuado.',
    followUp: '¿Cómo filtran actualmente a los prospectos que llegan por redes o referidos?',
    service: 'ia',
  },
  {
    id: 'talleres_automotriz',
    sector: 'Talleres Mecánicos y Automotriz',
    pattern: /\b(taller|talleres|mecanic|repuestos|vehiculo|vehiculos|carro|carros|motos|mantenimiento automotriz)\b/,
    diagnosis:
      'En el sector automotriz, los clientes siempre preguntan por disponibilidad de mantenimiento, precio de repuestos o estado de su vehículo. El agente agenda turnos en el taller, cotiza servicios frecuentes y envía notificaciones por WhatsApp cuando el vehículo está listo para entrega.',
    followUp: '¿Cuál es el servicio de mantenimiento que más les consultan?',
    service: 'ia',
  },
  {
    id: 'gimnasio_fitness',
    sector: 'Gimnasios y Centros Fitness',
    pattern: /\b(gimnasio|fitness|crossfit|entrenador|entrenamiento|clase de prueba|membresia|mensualidad gym)\b/,
    diagnosis:
      'Para gimnasios y estudios fitness, el agente responde los horarios de clases, precios de membresías, resuelve dudas de disciplinas y agenda clases de cortesía automáticamente, aumentando la conversión de curiosos a miembros activos.',
    followUp: '¿Manejan una sola sede o varias, y qué tipo de membresías ofrecen?',
    service: 'ia',
  },
  {
    id: 'educacion_cursos',
    sector: 'Educación, Cursos y Academias',
    pattern: /\b(curso|cursos|academia|instituto|colegio|universidad|diplomado|estudiantes|matricula|inscripcion)\b/,
    diagnosis:
      'Para academias e institutos, el agente entrega el pensum y temario detallado, responde requisitos de admisión, informa sobre fechas y métodos de pago, y guía al estudiante directo a la inscripción o a una videollamada de asesoría académica.',
    followUp: '¿Tienen admisiones abiertas permanentemente o por fechas específicas?',
    service: 'ia',
  },
  {
    id: 'logistica_transporte',
    sector: 'Logística y Transporte',
    pattern: /\b(logistica|transporte|flota|flotas|guias|remision|envios|camiones|cargas|rastreo)\b/,
    diagnosis:
      'Para transporte y logística, desarrollamos agentes y plataformas web donde los clientes consultan el estado de su guía por WhatsApp 24/7 sin llamar a un operador, y la empresa monitorea conductores y rutas en tiempo real. Contamos con un caso de éxito de +180 vehículos monitoreados en vivo.',
    followUp: '¿Qué volumen de despachos o guías manejan mensualmente?',
    service: 'nextjs',
  },
  {
    id: 'celulares_tecnologia',
    sector: 'Tiendas de Celulares, Tecnología y Servicio Técnico',
    pattern: /\b(celular|celulares|telefono|telefonos|smartphone|iphone|xiaomi|samsung|servicio tecnico|pantallas|baterias|accesorios celular|reparacion de celulares|tienda de celulares|reparacion)\b/,
    diagnosis:
      'En tiendas de celulares y tecnología, el mayor reto es que entran decenas de personas preguntando lo mismo: si hay disponibilidad de un modelo, precio de pantallas, costo de accesorios o el estado de reparación de su equipo. Nuestro agente de IA atiende de inmediato por WhatsApp: comparte catálogo con fotos y precios al instante, consulta el estado de servicio técnico por número de orden y califica prospectos listos para comprar de contado o a crédito.',
    followUp: '¿Más o menos cuántos mensajes o clientes atienden al día hoy?',
    service: 'ia',
  },
];

async function runLocalAgent(userMessage: string, history: ChatMessage[], ctx: AgentContext): Promise<AgentRun> {
  const state = new AgentState();
  const t = norm(userMessage);
  const prior = history.filter((h) => h.role !== 'system');
  const assistantMsgs = prior.filter((h) => h.role === 'assistant');
  const userMsgs = prior.filter((h) => h.role === 'user');
  const lastAssistant = assistantMsgs[assistantMsgs.length - 1]?.content || '';
  const lastAssistantNorm = norm(lastAssistant);
  const done = (reply: string, intent?: AIResponsePayload['detectedIntent']): AgentRun => ({
    reply,
    modelUsed: 'agente-consultor-edmysoft',
    intent: intent || state.intent || 'GENERAL',
    toolsUsed: state.toolsUsed,
    quoteData: state.quoteData,
    meetingData: state.meetingData,
  });

  // ===================================================================
  // 0. MODO DEMOSTRACIÓN TEMPORAL (Exclusivo WhatsApp para clientes)
  // ===================================================================
  if (ctx.demoConfig && isWhatsAppDemoActive()) {
    const res = handleDemoConversation(userMessage, history, ctx.demoConfig, ctx.contactName);
    return done(res.reply, res.intent);
  }

  // ===================================================================
  // 0.1 RESPUESTAS INGENIOSAS ANTE TEMAS "NADA QUE VER" (PIVOTE A LA VENTA)
  // ===================================================================
  const resolvedClientName = ctx.customerMemory?.fullName || ctx.contactName;
  const wittyPivot = checkWittyPivot(userMessage, {
    isDemo: false,
    clientName: hasRealName(resolvedClientName) ? resolvedClientName! : undefined,
  });

  if (wittyPivot && wittyPivot.isOffTopic) {
    return done(wittyPivot.reply, wittyPivot.intent);
  }

  // ===================================================================
  // 1. SOLICITUD DE ASESOR HUMANO O HABLAR CON EDIER
  // ===================================================================
  if (/\b(humano|persona real|asesor|hablar con alguien|hablar con una persona|ejecutivo|comunicar con edier|contacto directo)\b/.test(t)) {
    await state.run('solicitar_asesor_humano', { motivo: userMessage.slice(0, 150) }, ctx);
    return done(
      '¡Por supuesto! Ya notifiqué a nuestro equipo comercial para que un asesor continúe contigo por este medio. 🙌\n\nSi prefieres comunicarte de forma inmediata con nuestro Director Técnico, puedes escribirle directo a Edier Mery Gallego a su WhatsApp personal: +57 323 416 6354 (https://wa.me/573234166354). ¿Hay algún detalle específico de tu proyecto que quieras que tengamos listo?',
      'HUMAN_TAKEOVER'
    );
  }

  // ===================================================================
  // 2. AGENDAMIENTO DE REUNIÓN / VIDEOLLAMADA DIAGNÓSTICA
  // ===================================================================
  const botAskedForSlot =
    /te quedaria bien|prefieres|que dia te queda|cual te queda mejor|nombre para dejar la cita|ese horario ya no|otra fecha|otro dia|te agende una|tengo disponible:|cual de estos te conviene|cual prefieres|horarios disponibles/i.test(lastAssistantNorm) &&
    /\?/.test(lastAssistant);
  const givesSlotData =
    !!parseDateFromText(userMessage) ||
    !!parseTimeFromText(userMessage) ||
    /(lunes|martes|miercoles|jueves|viernes|sabado|hoy|manana|pasado manana)/i.test(t) ||
    /(manana|tarde|temprano|mediodia)/i.test(t) ||
    /(me llamo|mi nombre es|soy\s+[a-z]+)/.test(t) ||
    /[\w.+-]+@[\w-]+\.[\w.-]+/.test(userMessage) ||
    /^(si|sii|claro|dale|ok|vale|por favor|listo|de una|perfecto|bien|cualquiera)\b/.test(t) ||
    (t.split(/\s+/).length <= 3 && /^[a-z]+(\s[a-z]+){0,2}$/.test(t) && lastAssistantNorm.includes('nombre para dejar la cita'));
  const askedScheduling = botAskedForSlot && givesSlotData;
  const wantsSchedule = /agend|reunion|cita\b|llamada|videollamada|demo\b|calendario|hablar con edier|diagnostico/.test(t);
  const declines = /\b(no gracias|ya no|mejor no|no quiero)\b/.test(t);

  if ((wantsSchedule || askedScheduling) && !declines && ctx.allowScheduling === false) {
    return done(
      'Con todo gusto coordinamos una videollamada con Edier Mery Gallego. Por favor escríbele directo a su WhatsApp +57 323 416 6354 o cuéntame tu disponibilidad y él te confirmará el espacio.',
      'SCHEDULE'
    );
  }

  if ((wantsSchedule || askedScheduling) && !declines) {
    const recentUser = [...userMsgs.slice(-4).map((m) => m.content), userMessage];
    let date: string | null = null;
    let time: string | null = null;
    let email: string | null = null;
    let name: string | null = hasRealName(ctx.contactName) ? ctx.contactName! : null;

    for (const msg of [...recentUser].reverse()) {
      date = date || parseDateFromText(msg);
      time = time || parseTimeFromText(msg);
      email = email || msg.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] || null;
      const n = norm(msg).match(/(?:me llamo|mi nombre es|soy)\s+([a-z]{2,}(?:\s[a-z]{2,})?)/);
      if (!name && n) name = n[1].replace(/\b\w/g, (c) => c.toUpperCase());
    }

    if (!date) {
      const now = bogotaNow();
      const sugerencia1 = ymd(addDays(now, 1));
      const sugerencia2 = ymd(addDays(now, 2));
      return done(
        `¡Excelente decisión! Las sesiones diagnósticas con nuestro Director Técnico Edier duran ~45 minutos y no tienen ningún costo. Atendemos de lunes a viernes de 9:00 a. m. a 5:00 p. m. y sábados de 9:00 a. m. a 12:00 m. (hora Colombia).\n\n¿Te quedaría bien ${labelDate(sugerencia1)} o prefieres ${labelDate(sugerencia2)}?`,
        'SCHEDULE'
      );
    }

    if (!time) {
      const r: any = await state.run('consultar_disponibilidad', { fecha: date }, ctx);
      const libres: string[] = (r.horariosLibres || []).map((s: any) => s.texto);
      if (!libres.length) {
        return done(
          `Para el ${labelDate(date)} la agenda ya está completa. ¿Te serviría revisarlo para el día hábil siguiente? Dime qué día prefieres y con gusto verifico disponibilidad.`,
          'SCHEDULE'
        );
      }
      return done(
        `Para el ${labelDate(date)} tenemos disponibles los siguientes espacios (hora Colombia):\n• ${libres.slice(0, 4).join('\n• ')}\n\n¿Cuál de estos te conviene más?`,
        'SCHEDULE'
      );
    }

    if (!name) {
      return done(
        `¡Perfecto! Tengo apartado el ${labelDate(date)} a las ${labelTime(time)} (hora Colombia). ¿Me regalas tu nombre completo (y si deseas tu correo) para confirmar la cita en el calendario?`,
        'SCHEDULE'
      );
    }

    const topic = guessTopic([...userMsgs.map((m) => m.content), userMessage]);
    const r: any = await state.run(
      'agendar_reunion',
      { nombre: name, fecha: date, hora: time, motivo: topic, email: email || undefined },
      ctx
    );

    if (r.exito) {
      await state.run(
        'guardar_datos_lead',
        {
          nombre: name,
          necesidad: topic,
          email: email || undefined,
          temperatura: 'caliente',
          servicio_interes: topicFromMessage(norm(topic)) || 'ia',
        },
        ctx
      );
      return done(
        `🎉 ¡Cita agendada con éxito, ${name.split(' ')[0]}!\n\n📅 Fecha: ${labelDate(date)}\n⏰ Hora: ${labelTime(time)} (hora Colombia)\n👤 Especialista: Edier Mery Gallego (Director Técnico)\n🎯 Tema: ${topic}\n\nPuedes agregarla directamente a tu Google Calendar aquí:\n${r.enlaceCalendario}\n\nEdier llegará preparado a la llamada. Si gustas, cuéntame brevemente cuántas personas integran tu equipo hoy para afinar la propuesta técnica.`,
        'SCHEDULE'
      );
    }

    const alt: string[] = r.horariosLibresEseDia || [];
    return done(
      alt.length
        ? `Ese horario exacto acaba de ocuparse. Para ese mismo día me quedan libres:\n• ${alt.join('\n• ')}\n\n¿Cuál prefieres?`
        : `Para ese día ya no disponemos de espacios libres. ¿Intentamos con otra fecha?`,
      'SCHEDULE'
    );
  }

  // ===================================================================
  // 2.5 MEMORIA CONVERSACIONAL Y RESPUESTA A PREGUNTAS DEL BOT
  // ===================================================================
  const combinedUserText = norm([...userMsgs.map((m) => m.content), userMessage].join(' '));
  const matchedPlaybook = INDUSTRY_PLAYBOOKS.find((p) => p.pattern.test(t) || p.pattern.test(combinedUserText));
  const sectorName = matchedPlaybook ? matchedPlaybook.sector : (combinedUserText.includes('celular') ? 'tu tienda de celulares y tecnología' : 'tu negocio');

  // A) El bot preguntó por volumen de clientes/mensajes y el cliente responde una cifra o cantidad
  const botAskedVolume = /cuantos (mensajes|clientes|pedidos|inmuebles|despachos)|al dia hoy|horas pico|al dia aproximadamente/i.test(lastAssistantNorm);
  const userGivesVolume = /\b(\d+|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|quince|veinte|treinta|cincuenta|cien|pocos|bastantes|varios|muchos)\b/i.test(t) ||
    /al dia|diarios|clientes|mensajes|pedidos/i.test(t);

  if (botAskedVolume && userGivesVolume) {
    const numMatch = t.match(/\b(\d+)\b/);
    const volumeLabel = numMatch ? `${numMatch[1]} clientes o consultas al día` : (t.includes('pocos') ? 'un flujo inicial de clientes al día' : 'ese volumen de clientes al día');

    await state.run(
      'guardar_datos_lead',
      {
        nombre: hasRealName(ctx.contactName) ? ctx.contactName! : undefined,
        necesidad: `Volumen reportado: ${userMessage.slice(0, 100)} en ${sectorName}`,
        servicio_interes: 'ia',
        temperatura: 'caliente',
      },
      ctx
    );

    return done(
      `¡Excelente dato! Atendiendo aproximadamente *${volumeLabel}* en ${sectorName}, cada cliente cuenta y no puedes darte el lujo de perder ninguno.\n\n` +
      `El gran problema cuando se atiende manualmente es que si estás ocupado en el mostrador, almorzando o fuera de horario, el cliente no espera: se va a cotizar con la competencia y se pierde la venta.\n\n` +
      `Con un *Agente de IA para WhatsApp de EDMYSOFT*:\n` +
      `⚡ *Respuesta en 3 segundos*: Saluda cordialmente, responde dudas de precios, disponibilidad y características 24/7.\n` +
      `🎯 *Filtro y calificación*: Identifica quién está listo para comprar y te pasa solo los prospectos calientes para que cierres la venta.\n` +
      `📊 *Registro automático*: Guarda los datos de cada cliente en Google Sheets o tu CRM sin que tengas que digitar nada.\n\n` +
      `Para este volumen te recomiendo iniciar con nuestro *Plan Estándar ($2.200.000 COP setup + $350.000 COP/mes)* o el *Plan Plus ($3.800.000 COP setup + $550.000 COP/mes)* si deseas catálogo interactivo y recordatorios automáticos.\n\n` +
      `¿Te gustaría que agendemos una videollamada diagnóstica gratuita de ~30 minutos con nuestro Director Técnico Edier Mery Gallego para mostrarte una demo en vivo adaptada a tu negocio?`,
      'QUOTE'
    );
  }

  // B) El cliente expresa su deseo de crecer, prosperar o aumentar ventas
  if (/(quiero que mi negocio prospere|quiero prosperar|quiero crecer|aumentar ventas|mas clientes|escalar mi negocio|mejorar mi negocio|vender mas)/.test(t) && !matchedPlaybook) {
    return done(
      `¡Esa es la meta principal y en EDMYSOFT nos especializamos exactamente en eso! 🚀\n\n` +
      `Para que un negocio prospere hoy en Colombia, la clave es responder más rápido que la competencia y no depender de que estés pegado al celular todo el día.\n\n` +
      `Cuéntame un poco más: ¿de qué es exactamente tu negocio o qué producto/servicio ofreces? Así te muestro la estrategia exacta que mejor funciona para ti.`,
      'GENERAL'
    );
  }

  // C) El bot preguntó sobre equipos vs reparaciones u opciones de servicio
  const botAskedServiceType = /equipos y accesorios|servicio tecnico|reparaciones|tipo de productos/i.test(lastAssistantNorm);
  if (botAskedServiceType) {
    return done(
      `¡Perfecto! El agente de IA para tu negocio se configura con dos módulos clave:\n\n` +
      `1️⃣ *Módulo Comercial*: Responde al instante catálogo con fotos, especificaciones y precios actualizados.\n` +
      `2️⃣ *Módulo de Servicio y Soporte*: Consulta el estado de órdenes de trabajo o garantías ingresando el número de orden por WhatsApp.\n\n` +
      `¿Te gustaría que agendemos una sesión diagnóstica gratuita para enseñarte cómo se vería en tu WhatsApp o prefieres ver los planes de inversión?`,
      'GENERAL'
    );
  }

  // D) El bot preguntó si llevan la atención manual o con plataforma
  const botAskedProcess = /manual.*chat|plataforma web|como filtran|software de citas|persona dedicada/i.test(lastAssistantNorm);
  if (botAskedProcess && /(manual|chat|whatsapp|yo mismo|no tenemos|excel|redes|ninguna|ninguno|directo)/i.test(t)) {
    return done(
      `Comprendo totalmente. Llevarlo de forma manual por chat funciona al principio, pero a medida que el negocio crece se convierte en una carga muy pesada: mensajes sin responder, pedidos traspapelados y ventas perdidas por no contestar a tiempo.\n\n` +
      `Al automatizarlo con EDMYSOFT, el bot asume el 80% de las preguntas repetitivas y tú solo intervienes para despachar o recibir el dinero.\n\n` +
      `¿Aproximadamente cuántos mensajes o clientes atiendes al día hoy?`,
      'GENERAL'
    );
  }

  // ===================================================================
  // 3. DIAGNÓSTICO CONSULTIVO POR SECTOR / INDUSTRIA
  // ===================================================================
  // Solo responder con el playbook si el mensaje actual menciona el sector o describe su dolor
  if (matchedPlaybook && (matchedPlaybook.pattern.test(t) || /negocio|empresa|dedico|vendo|hago|tengo un|tengo una/.test(t))) {
    await state.run(
      'guardar_datos_lead',
      {
        nombre: hasRealName(ctx.contactName) ? ctx.contactName! : undefined,
        necesidad: `Sector ${matchedPlaybook.sector}: ${userMessage.slice(0, 150)}`,
        servicio_interes: matchedPlaybook.service,
        temperatura: 'caliente',
      },
      ctx
    );
    return done(
      `${matchedPlaybook.diagnosis}\n\n${matchedPlaybook.followUp}`,
      'GENERAL'
    );
  }

  // ===================================================================
  // 3.8 SERVICIOS Y SOLUCIONES QUE OFRECE EDMYSOFT
  // ===================================================================
  if (
    /\b(que servicios|cuales son sus servicios|cuales servicios|que hacen|a que se dedican|que ofrecen|que soluciones tienen|servicios disponibles|que productos tienen|en que me pueden ayudar|informacion de servicios|catalogo de servicios)\b/i.test(
      t
    ) ||
    (/\b(servicios|soluciones)\b/i.test(t) && /\b(tienen|ofrecen|manejan|cuales)\b/i.test(t))
  ) {
    return done(
      `En *EDMYSOFT* transformamos operaciones comerciales y multiplicamos ventas mediante 3 pilares tecnológicos de alto impacto:\n\n` +
      `1️⃣ *Agentes de IA para WhatsApp & Redes Sociales*: Asistentes inteligentes con memoria que atienden 24/7, responden dudas de tu catálogo, cotizan en tiempo real y agendan citas en tu calendario.\n\n` +
      `2️⃣ *Automatización Empresarial con n8n*: Conectamos tu WhatsApp y web con Google Sheets, tu CRM, facturación electrónica DIAN y ERPs para eliminar tareas manuales.\n\n` +
      `3️⃣ *Desarrollo de Software y Páginas Web (Next.js)*: Plataformas web ultrarrápidas (<1s de carga), tiendas virtuales con pasarela Wompi y paneles administrativos a la medida.\n\n` +
      `¿Cuál de estas tres áreas te gustaría implementar o mejorar en tu empresa?`,
      'GENERAL'
    );
  }

  // ===================================================================
  // 3.9 DEMO EN VIVO / CÓMO PROBAR LA PLATAFORMA
  // ===================================================================
  if (/\b(demo|demostracion|puedo probar|como funciona|como trabaja|verlo funcionando|ensayo|prueba|probar el bot)\b/i.test(t)) {
    return done(
      `¡Claro que sí! Puedes comprobar la efectividad de nuestras soluciones de dos formas:\n\n` +
      `1️⃣ *En este mismo chat*: Estás interactuando en vivo con nuestro agente comercial de IA. Pregúntame sobre precios, servicios, o pide agendar una cita para ver cómo responde al instante.\n\n` +
      `2️⃣ *Videollamada Diagnóstica de 15 min (Google Meet)*: Nuestro Director Técnico, Edier Mery Gallego, te muestra en pantalla cómo se adapta el bot con el catálogo y las reglas exactas de tu negocio.\n\n` +
      `¿Te gustaría que agendemos esa sesión diagnóstica gratuita para esta semana?`,
      'SCHEDULE'
    );
  }

  // ===================================================================
  // 3.95 UBICACIÓN, COBERTURA Y SEDE
  // ===================================================================
  if (/\b(donde estan|de donde son|ubicacion|ciudad|pais|oficina|donde quedan|tienen sede|direccion)\b/i.test(t)) {
    return done(
      `*EDMYSOFT* tiene su sede principal en *Colombia* 🇨🇴, bajo la dirección técnica de *Edier Mery Gallego*.\n\n` +
      `Brindamos atención, desarrollo e implementación 100% remota con soporte directo en toda Colombia (Bogotá, Medellín, Cali, Barranquilla, Bucaramanga, Pereira, etc.) y Latinoamérica.\n\n` +
      `¿En qué ciudad o país se encuentra ubicado tu negocio?`,
      'GENERAL'
    );
  }

  // ===================================================================
  // 3.96 TIEMPOS DE ENTREGA Y PLAZOS
  // ===================================================================
  if (/\b(cuanto tiempo|cuanto demora|cuanto tardan|tiempo de entrega|plazo de entrega|en cuanto tiempo|cuantos dias)\b/i.test(t)) {
    return done(
      `Nuestros tiempos de entrega son ágiles y garantizados por contrato:\n\n` +
      `⚡ *Agente de IA para WhatsApp (Plan Estándar)*: *3 a 5 días hábiles* con tu base de datos y FAQs entrenadas.\n` +
      `⭐ *Plan Plus (con cotizador, n8n y Google Calendar)*: *5 a 8 días hábiles*.\n` +
      `🌐 *Plataformas Web y Software a Medida (Next.js)*: *2 a 3 semanas* según los módulos requeridos.\n\n` +
      `Todo incluye capacitación personalizada y acompañamiento técnico directo. ¿Para qué fecha te gustaría tener tu solución operando?`,
      'GENERAL'
    );
  }

  // ===================================================================
  // 3.97 MÉTODOS DE PAGO Y CONTRATACIÓN
  // ===================================================================
  if (/\b(como se paga|formas de pago|metodos de pago|medios de pago|como se contrata|anticipo|cuotas|wompi|nequi|bancolombia|pse|tarjeta)\b/i.test(t)) {
    return done(
      `Trabajamos con un esquema de contratación transparente y seguro:\n\n` +
      `💳 *Esquema de Pago:* *50% de anticipo* para iniciar la arquitectura y desarrollo, y el *50% final contra entrega a satisfacción* tras las pruebas en vivo.\n\n` +
      `🔒 *Medios de Pago Soportados:* Pasarela segura *Wompi* (Bancolombia, Nequi, PSE de cualquier banco y Tarjetas de Crédito/Débito) o transferencia bancaria directa.\n\n` +
      `Facturación formal y contrato de prestación de servicios con cláusula de confidencialidad (Habeas Data). ¿Deseas que preparemos tu propuesta formal?`,
      'GENERAL'
    );
  }

  // ===================================================================
  // 4. PREGUNTAS TÉCNICAS FRECUENTES (FAQ & ARQUITECTURA)
  // ===================================================================
  // 4.1 WhatsApp QR vs API Oficial de Meta
  if (/(qr|api oficial|meta cloud|bloqueo|bloquear|baneo|ban|whatsapp business)/.test(t)) {
    return done(
      'En EDMYSOFT ofrecemos ambas alternativas según el volumen y etapa de tu negocio:\n\n' +
        '1️⃣ *Conexión por QR (Baileys)*: Se vincula en 60 segundos escaneando el código desde nuestro panel, sin trámites con Meta y sin costo por mensaje. Incluye simulación de escritura humana con pausas naturales para cuidar tu línea. Es la opción ideal para validar y empezar sin fricción.\n\n' +
        '2️⃣ *API Oficial de Meta (Cloud API)*: Es la conexión empresarial 100% blindada contra bloqueos. No pagas mensualidad a Meta, únicamente ~$140 COP por conversación comercial de 24 horas iniciada con un cliente. Recomendada para empresas con alto volumen o campañas publicitarias masivas.\n\n' +
        'Ambas modalidades se conectan al mismo cerebro de IA y panel CRM de EDMYSOFT. ¿Cuántos mensajes diarios esperas recibir aproximadamente?'
    );
  }

  // 4.2 ¿Qué es n8n y para qué sirve?
  if (/(n8n|automatiz|zapier|make|flujo|integrac)/.test(t)) {
    return done(
      '*n8n* es la plataforma líder de automatización e integración de sistemas. En EDMYSOFT la utilizamos para que tu WhatsApp y tu web se conecten en tiempo real con:\n\n' +
        '• Hojas de cálculo de Google Sheets o Excel en la nube.\n' +
        '• Tu CRM (HubSpot, Zoho, Salesforce o el CRM propio de EDMYSOFT).\n' +
        '• Facturación electrónica DIAN y ERPs.\n' +
        '• Notificaciones inmediatas a tu equipo por WhatsApp o correo.\n\n' +
        'La gran ventaja frente a herramientas como Zapier o Make es que no tienes límites abusivos de tareas ni costos mensuales disparados. ¿Hay algún proceso manual que hoy te quite demasiado tiempo?'
    );
  }

  // 4.3 Next.js vs WordPress / Desarrollo Web
  if (/(next|nextjs|wordpress|pagina web|sitio web|desarrollo web|tienda online|ecommerce)/.test(t)) {
    return done(
      'Desarrollamos nuestras plataformas web con *Next.js y React* (la misma tecnología utilizada por plataformas como Netflix, Twitch y OpenAI). Frente a WordPress, las ventajas son contundentes:\n\n' +
        '⚡ *Velocidad extrema*: Carga en menos de 1 segundo (calificación 95+ en Google Lighthouse).\n' +
        '🔒 *Seguridad total*: Sin plugins de PHP vulnerables a hackeos.\n' +
        '📈 *SEO superior*: Arquitectura renderizada en servidor para posicionar en los primeros puestos de Google.\n' +
        '💼 *Panel administrativo a la medida*: Diseñado exactamente para tu flujo comercial, con pasarela de pago Wompi y CRM integrado.\n\n' +
        '¿Tienes una web actualmente que quieras modernizar o estás partiendo desde cero?'
    );
  }

  // 4.4 Seguridad, Habeas Data y Privacidad
  if (/(seguridad|datos|privacidad|ley 1581|habeas data|confidencial|owasp)/.test(t)) {
    return done(
      'En EDMYSOFT la seguridad de tus datos es prioritaria:\n\n' +
        '• Cumplimos rigurosamente la *Ley 1581 de Protección de Datos Personales* de Colombia.\n' +
        '• Aplicamos estándares *OWASP*: cifrado SSL/TLS en tránsito y en reposo, sesiones blindadas y roles de usuario.\n' +
        '• La IA opera sobre una base de conocimiento restringida exclusivamente a la información oficial que tú autorices; jamás comparte datos de tus clientes con terceros.\n' +
        '• Tienes registro de auditoría de cada conversación y control humano en 1 clic.'
    );
  }

  // 4.5 ¿La IA se equivoca o inventa cosas?
  if (/(se equivoca|alucina|inventa|confianza|errores|seguro el bot)/.test(t)) {
    return done(
      'Es una excelente duda. A diferencia de un ChatGPT libre que puede inventar respuestas, nuestros agentes operan con una técnica llamada *RAG (Retrieval-Augmented Generation)*: el modelo está anclado a tus documentos, políticas, tarifas y catálogo oficial.\n\n' +
        'Si un usuario pregunta algo que no está en las reglas de tu negocio, el agente responde con total honestidad que consultará con un asesor y escala el caso. Además, en nuestro panel tienes un botón de *Control Humano*: en cualquier segundo puedes intervenir la conversación y el bot se silencia al instante.'
    );
  }

  // 4.5b Búsqueda en Preguntas Frecuentes (FAQs) administradas dinámicamente en /admin/conocimiento
  const activeKnowledge = loadBusinessKnowledge();
  if (activeKnowledge.faqs && activeKnowledge.faqs.length > 0) {
    for (const faq of activeKnowledge.faqs) {
      const qWords = norm(faq.question).split(/\s+/).filter((w) => w.length >= 4);
      const matchCount = qWords.filter((w) => t.includes(w)).length;
      if (matchCount >= 2 || (qWords.length === 1 && matchCount === 1)) {
        return done(faq.answer, 'GENERAL');
      }
    }
  }

  // ===================================================================
  // 4.6 REGATEO COMERCIAL INTELIGENTE (NEGOCIACIÓN ESTRATÉGICA)
  // ===================================================================
  if (/\b(rebaja|descuento|descuentico|muy caro|demasiado caro|esta caro|no me alcanza|muy costoso|presupuesto bajo|presupuesto ajustado|bajarle al precio|menos plata)\b/.test(t)) {
    const neg = loadNegotiationConfig();
    const livePlans = await getLivePlans();
    const plusSetup = livePlans.plus?.setupPrice || 3800000;
    const estandarSetup = livePlans.estandar?.setupPrice || 2200000;
    const discountAmount = Math.round(plusSetup * (neg.maxDiscountPercent / 100));
    const discountedPlus = plusSetup - discountAmount;

    return done(
      `Entiendo perfectamente la consideración del presupuesto. Si lo analizas en términos de retorno de inversión, un asesor humano cuesta ~$1.600.000 COP al mes con prestaciones y solo atiende 8 horas al día; mientras que un Agente de IA atiende 24/7 sin descanso por solo ${fmtCOP(livePlans.plus?.recurringPrice || 550000)}/mes.\n\n` +
        `Aun así, para facilitarte la decisión de iniciar con EDMYSOFT:\n\n` +
        (neg.allowTwoInstallments ? `1️⃣ *Facilidad de pago en 2 cuotas:* Podemos estructurar el setup en 50% de anticipo para iniciar el desarrollo y 50% contra entrega a satisfacción.\n\n` : '') +
        (neg.maxDiscountPercent > 0 ? `2️⃣ *Descuento por pronto inicio:* Si confirmas el inicio de proyecto esta misma semana, te puedo conceder un *${neg.maxDiscountPercent}% de descuento* en el setup del Plan Plus (quedando en *${fmtCOP(discountedPlus)}* en lugar de ${fmtCOP(plusSetup)}).\n\n` : '') +
        `3️⃣ *Ajuste de alcance:* Puedes arrancar con el Plan Estándar desde *${fmtCOP(estandarSetup)}* y cuando el bot te genere sus primeras ventas, escalar al Plan Plus.\n\n` +
        `¿Cuál de estas alternativas se te acomoda mejor para comenzar?`,
      'QUOTE'
    );
  }

  // ===================================================================
  // 5. PRECIOS Y PLANES OFICIALES (DINÁMICOS EN COP)
  // ===================================================================
  if (/precio|costo|cuanto|cotiz|plan(es)?\b|valor|tarifa|presupuesto|cobran|inversion/.test(t)) {
    const wantsEnterprise = /enterprise|multicanal/.test(t);
    const wantsPlus = /\bplus\b|recomendado/.test(t);
    const wantsEstandar = /estandar|basico/.test(t);
    const planKey = wantsEnterprise ? 'enterprise' : wantsPlus ? 'plus' : wantsEstandar ? 'estandar' : 'todos';

    const r: any = await state.run('consultar_planes_precios', { plan: planKey }, ctx);
    const livePlans = await getLivePlans();
    const pE = livePlans.estandar || { name: 'Plan Estándar', setupPrice: 2200000, recurringPrice: 350000 };
    const pP = livePlans.plus || { name: 'Plan Plus', setupPrice: 3800000, recurringPrice: 550000 };
    const pEnt = livePlans.enterprise || { name: 'Plan Enterprise', setupPrice: 6500000, recurringPrice: 950000 };

    if (planKey !== 'todos') {
      return done(
        `El *${r.plan}* contempla una inversión oficial de *${r.setup}* (setup y entrenamiento inicial) y *${r.mensual}* al mes (soporte, infraestructura y mejoras continuas).\n\n` +
          `✨ *Incluye:* ${r.incluye}.\n\n` +
          `Para confirmarte si este plan cubre exactamente tu operación, ¿cuántos mensajes o clientes atienden al día aproximadamente?`,
        'QUOTE'
      );
    }

    return done(
      'Manejamos tres planes transparentes para la implementación de tu Agente de IA y Automatización:\n\n' +
        `🟢 *${pE.name}*: Inversión inicial ${fmtCOP(pE.setupPrice)} + ${fmtCOP(pE.recurringPrice)}/mes.\n` +
        `• Atención 24/7 en WhatsApp, FAQs entrenadas, control humano en 1 clic.\n\n` +
        `⭐ *${pP.name} (El más vendido)*: Inversión inicial ${fmtCOP(pP.setupPrice)} + ${fmtCOP(pP.recurringPrice)}/mes.\n` +
        `• Todo lo anterior + Cotizador dinámico en chat, agendamiento sincronizado con Google Calendar, integraciones con n8n y webhooks a tu CRM o Excel.\n\n` +
        `🚀 *${pEnt.name}*: Inversión inicial ${fmtCOP(pEnt.setupPrice)} + ${fmtCOP(pEnt.recurringPrice)}/mes.\n` +
        `• Multicanal (WhatsApp + Instagram + Web), base de datos dedicada, RAG sobre documentos propios y generador de cotizaciones en PDF.\n\n` +
        'El Plan Plus es el favorito porque automatiza ventas y agenda en piloto automático. ¿Cuál se adapta mejor a tu meta actual?',
      'QUOTE'
    );
  }

  // ===================================================================
  // 6. QUIÉNES SOMOS / RESPALDO DE EDMYSOFT
  // ===================================================================
  if (/edier|quienes son|quien eres|respaldo|empresa|trayectoria|experiencia/.test(t)) {
    return done(
      '*EDMYSOFT* es una empresa colombiana especializada en inteligencia artificial aplicada a ventas, automatización de procesos y desarrollo de software de alto impacto.\n\n' +
        '• Nuestro Director Técnico es *Edier Mery Gallego*, arquitecto de software con amplia trayectoria en soluciones digitales y automatización.\n' +
        '• Contamos con infraestructura propia de alta disponibilidad, servidores dedicados y equipo multidesarrollador de *EDMYSOFT*.\n' +
        '• Casos destacados: clínicas médicas (-78% en tiempo de respuesta), logística (+180 vehículos monitoreados) y optimizaciones de facturación que redujeron de 40 horas a 15 minutos mensuales.\n\n' +
        '¿Qué aspecto específico de tu negocio te gustaría potenciar hoy?'
    );
  }

  // ===================================================================
  // 7. DESPEDIDAS Y AGRADECIMIENTOS
  // ===================================================================
  if (/\b(gracias|muchas gracias|listo|perfecto|ok|vale|chao|adios|hasta luego|genial)\b/.test(t) && t.length < 40) {
    return done(
      '¡Con el mayor gusto! Aquí estaremos cuando decidas dar el paso hacia la automatización con IA. Si quieres agendar tu videollamada diagnóstica gratuita con Edier, solo escríbenos por aquí o al WhatsApp +57 323 416 6354. ¡Muchos éxitos en tu negocio! 🚀'
    );
  }

  // ===================================================================
  // 8. SALUDOS INICIALES (CON MEMORIA ACTIVA DE CLIENTES RECURRENTES)
  // ===================================================================
  if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|saludos|que tal|holi)\b/.test(t) && !/(precio|cuanto|cotiz|plan|agend|reunion|cita|servicio|comprar|contratar)/.test(t)) {
    const memory = ctx.customerMemory;
    const clientName = memory?.fullName || (hasRealName(ctx.contactName) ? ctx.contactName! : '');
    const firstName = clientName ? clientName.split(' ')[0] : '';

    // Si es un cliente recurrente con memoria previa:
    if (memory && (memory.interactionsCount > 0 || memory.businessSector || memory.fullName)) {
      const saludoNombre = firstName ? ` *${firstName}*` : '';
      const sectorRef = memory.businessSector ? ` para tu negocio de *${memory.businessSector}*` : '';
      const planRef = memory.quotedPlan ? ` (estuvimos revisando el *${memory.quotedPlan}*)` : '';
      return done(
        `¡Hola${saludoNombre}! 👋 Qué alegría saludarte de nuevo. Me alegra tenerte por aquí.\n\n` +
          `Recuerdo perfectamente que estuvimos conversando sobre las soluciones de automatización e IA${sectorRef}${planRef}.\n\n` +
          `¿Cómo has avanzado con tu proyecto o qué duda puntual te gustaría que resolvamos hoy para dar el paso hacia la implementación?`
      );
    }

    const nameGreeting = firstName ? ` ${firstName}` : '';
    if (userMsgs.length <= 1) {
      return done(
        `¡Hola${nameGreeting}! 👋 Bienvenido a *EDMYSOFT*. Soy tu asesor comercial y consultor de inteligencia artificial.\n\n` +
          'Ayudamos a empresas a multiplicar sus ventas y automatizar su atención al cliente en WhatsApp, páginas web y procesos con n8n.\n\n' +
          'Cuéntame, ¿qué tipo de negocio tienes o qué proceso te gustaría automatizar hoy?'
      );
    }
    return done('¡Hola de nuevo! Cuéntame, ¿en qué punto de tu proyecto te puedo orientar hoy?');
  }

  // ===================================================================
  // 9. RESPUESTA CONSULTIVA GENERAL (SPIN INTELIGENTE SIN MENÚS)
  // ===================================================================
  // Si el usuario compartió información sobre su negocio o un dolor
  if (userMessage.length > 30) {
    await state.run(
      'guardar_datos_lead',
      {
        nombre: hasRealName(ctx.contactName) ? ctx.contactName! : undefined,
        necesidad: userMessage.slice(0, 150),
        temperatura: 'tibia',
      },
      ctx
    );
    return done(
      `Comprendo perfectamente tu situación. En EDMYSOFT hemos visto que cuando ese flujo se atiende manualmente, se pierden oportunidades valiosas y el equipo se satura con tareas repetitivas.\n\n` +
        `Con una solución de Agente de IA y automatización conectada a tu WhatsApp, podemos hacer que las consultas se respondan al segundo, los clientes se califiquen en automático y tú recibas solo los prospectos listos para cerrar.\n\n` +
        `Para darte una recomendación exacta: ¿más o menos cuántos mensajes o clientes atienden al día hoy?`
    );
  }

  // Respuesta corta / neutra
  return done(
    'En EDMYSOFT diseñamos agentes de Inteligencia Artificial para WhatsApp, automatizaciones con n8n y desarrollos web a medida con Next.js.\n\n' +
      '¿Te gustaría conocer nuestros planes y precios, ver cómo aplica a tu sector o agendar una llamada diagnóstica con Edier Mery Gallego?'
  );
}

// ---------------------------------------------------------------------
// PUNTO DE ENTRADA Y SUGERENCIAS DINÁMICAS
// ---------------------------------------------------------------------
function suggestChips(run: AgentRun): string[] {
  if (run.intent === 'SCHEDULE') {
    return ['Ver enlace de Google Calendar', 'Hablar por WhatsApp con Edier', 'Preparar detalles de la cita'];
  }
  if (run.intent === 'HUMAN_TAKEOVER') {
    return ['Escribir al WhatsApp de Edier', 'Ver precios mientras tanto', 'Volver con la IA'];
  }
  if (run.intent === 'QUOTE') {
    return ['¿Qué incluye el Plan Plus?', 'Agendar videollamada con Edier', '¿Diferencia entre QR y Meta API?'];
  }
  if (run.reply.includes('Inmobiliaria') || run.reply.includes('inmueble')) {
    return ['¿Cómo filtra por presupuesto?', 'Ver precios del Plan Plus', 'Agendar demo con Edier'];
  }
  if (run.reply.includes('Salud') || run.reply.includes('clínica') || run.reply.includes('citas')) {
    return ['¿Cómo reduce el ausentismo?', 'Ver precios de planes', 'Agendar videollamada diagnóstica'];
  }
  if (run.reply.includes('tienda') || run.reply.includes('catálogo') || run.reply.includes('Wompi')) {
    return ['¿Cómo se integra con Wompi?', 'Ver precios del Plan Plus', 'Agendar demo para mi tienda'];
  }
  if (run.reply.includes('QR') || run.reply.includes('Meta')) {
    return ['¿Cuánto vale el Plan Plus?', '¿Cómo se conecta en 1 minuto?', 'Agendar diagnóstico gratis'];
  }
  return ['¿Cuánto cuesta el agente de IA?', '¿Qué servicios ofrecen?', 'Agendar diagnóstico gratis con Edier'];
}

export async function generateAIResponse(
  userMessageOrOpts:
    | string
    | {
        prompt?: string;
        message?: string;
        text?: string;
        userMessage?: string;
        history?: any[];
        senderName?: string;
        senderPhone?: string;
        contactPhone?: string;
        [k: string]: any;
      },
  historyInput: ChatMessage[] = [],
  ctxInput: AgentContext = {}
): Promise<AIResponsePayload> {
  const userMessage =
    typeof userMessageOrOpts === 'string'
      ? userMessageOrOpts
      : userMessageOrOpts?.prompt ||
        userMessageOrOpts?.message ||
        userMessageOrOpts?.text ||
        userMessageOrOpts?.userMessage ||
        '';

  const history =
    typeof userMessageOrOpts === 'object' && Array.isArray(userMessageOrOpts.history)
      ? userMessageOrOpts.history
      : historyInput;

  const ctx: AgentContext = {
    ...ctxInput,
    ...(typeof userMessageOrOpts === 'object'
      ? {
          contactName: userMessageOrOpts.senderName || ctxInput.contactName,
          contactPhone: userMessageOrOpts.senderPhone || userMessageOrOpts.contactPhone || ctxInput.contactPhone,
          clientIdentifier: userMessageOrOpts.senderPhone || ctxInput.clientIdentifier,
        }
      : {}),
  };

  // 1. Resolver identificador y cargar memoria persistente del cliente
  const identifier =
    ctx.clientIdentifier ||
    ctx.contactPhone ||
    ctx.contactEmail ||
    ctx.contactId ||
    ctx.conversationId ||
    '';

  if (!ctx.customerMemory && identifier) {
    try {
      ctx.customerMemory = await getCustomerMemory(identifier);
    } catch (e) {
      console.warn('[ai-engine] Error al cargar memoria:', e);
    }
  }

  // Sincronizar nombre si está disponible en la memoria y no en ctx
  if (!ctx.contactName && ctx.customerMemory?.fullName) {
    ctx.contactName = ctx.customerMemory.fullName;
  }

  const turns = prepareHistory(history, userMessage);
  const cfg = loadAIConfig();
  let run: AgentRun | null = null;

  const wants = (p: AIConfig['provider']) => cfg.provider === 'auto' || cfg.provider === p;

  if (wants('gemini') && cfg.geminiApiKey && cfg.provider !== 'local') {
    try {
      run = await runGemini(cfg.geminiApiKey, cfg.geminiModel, ctx, turns, cfg.temperature);
    } catch (err: any) {
      setAIStatus(false, 'gemini', cfg.geminiModel, err?.message || String(err));
      console.warn('Fallo en Gemini, probando siguiente proveedor:', err);
    }
  }

  if (!run && wants('openai') && cfg.openaiApiKey && cfg.provider !== 'local') {
    try {
      run = await runOpenAICompatible('openai', cfg.openaiApiKey, cfg.openaiModel, ctx, turns, cfg.temperature);
    } catch (err: any) {
      setAIStatus(false, 'openai', cfg.openaiModel, err?.message || String(err));
      console.warn('Fallo en OpenAI, probando siguiente proveedor:', err);
    }
  }

  if (!run && wants('openrouter') && cfg.openrouterApiKey && cfg.provider !== 'local') {
    try {
      run = await runOpenAICompatible('openrouter', cfg.openrouterApiKey, cfg.openrouterModel, ctx, turns, cfg.temperature);
    } catch (err: any) {
      setAIStatus(false, 'openrouter', cfg.openrouterModel, err?.message || String(err));
      console.warn('Fallo en OpenRouter, usando agente local:', err);
    }
  }

  if (!run) run = await runLocalAgent(userMessage, history, ctx);

  // 2. Extraer insights del mensaje y actualizar la memoria persistente en segundo plano
  if (identifier) {
    try {
      const insights = extractClientInsights(userMessage, ctx.customerMemory);
      saveCustomerMemory(identifier, {
        ...insights,
        contactId: ctx.contactId || undefined,
        fullName: insights.fullName || (hasRealName(ctx.contactName) ? ctx.contactName! : undefined),
        lastSummary: run.reply.slice(0, 160),
      }).catch(() => {});
    } catch {
      /* no crítico */
    }
  }

  // Telemetría del agente (modelo + herramientas invocadas)
  if (ctx.conversationId) {
    prisma.aILog
      .create({
        data: {
          conversationId: ctx.conversationId,
          modelUsed: run.modelUsed,
          toolCalls: JSON.stringify(run.toolsUsed || []),
          aiDecision: run.intent || 'GENERAL',
        },
      })
      .catch(() => {});
  }

  return {
    reply: run.reply,
    detectedIntent: run.intent || 'GENERAL',
    quoteData: run.quoteData,
    meetingData: run.meetingData,
    toolsUsed: run.toolsUsed,
    modelUsed: run.modelUsed,
    suggestions: suggestChips(run),
  };
}
