import fs from 'fs';
import path from 'path';
import { checkWittyPivot } from './witty-pivots';

export interface WhatsAppDemoConfig {
  active: boolean;
  expiresAt: string | null; // ISO timestamp o null para indefinido
  clientBusinessName: string;
  clientIndustry: string;
  clientDescription: string;
  clientCatalog: string;
  clientFaqs: string;
  clientTone: string;
  bookingUrl?: string;
  // Aliases compatibles con el panel visual
  businessDescription?: string;
  servicesAndPrices?: string;
  faqs?: string;
  specialInstructions?: string;
  updatedAt?: string;
}

const CONFIG_DIR = path.join(process.cwd(), '.edmysoft');
const DEMO_FILE = path.join(CONFIG_DIR, 'whatsapp-demo.json');

export const DEFAULT_DEMO_CONFIG: WhatsAppDemoConfig = {
  active: false,
  expiresAt: null,
  clientBusinessName: 'Clínica Dental Sonrisas Bogotá',
  clientIndustry: 'Salud Oral y Odontología',
  clientDescription: 'Centro odontológico de alta especialidad en diseño de sonrisa, implantes dentales, ortodoncia invisible y urgencias en Chicó, Bogotá.',
  clientCatalog: '• Valoración odontológica inicial: $30.000 COP (Gratis al iniciar tratamiento)\n• Limpieza profunda con ultrasonido: $85.000 COP\n• Calzas estéticas en resina (caries): desde $90.000 COP por pieza\n• Ortodoncia invisible (mensualidad): $130.000 COP\n• Blanqueamiento LED profesional: $280.000 COP\n• Urgencias odontológicas: Atención prioritaria sin cita',
  clientFaqs: '• Horario: Lunes a Sábado de 8:00 AM a 7:00 PM.\n• Ubicación: Cra 15 # 93-40, Piso 3, Chicó, Bogotá.\n• Medios de pago: Efectivo, Nequi, Daviplata, PSE y todas las tarjetas de crédito.\n• Parqueadero: Contamos con convenio de parqueadero en el edificio.',
  clientTone: 'cálido, tranquilizador, empático y orientado a agendar citas',
  bookingUrl: 'https://wa.me/573234166354?text=Quiero%20agendar%20cita%20odontologica',
};

export function loadWhatsAppDemoConfig(): WhatsAppDemoConfig {
  try {
    if (fs.existsSync(DEMO_FILE)) {
      const data: Partial<WhatsAppDemoConfig> = JSON.parse(fs.readFileSync(DEMO_FILE, 'utf-8'));
      const isGeneric = (s?: string) => !s || s.includes('Empresa dedicada a la venta y asesoría') || s.includes('Servicio / Producto Principal');
      
      let clientDescription = data.clientDescription || '';
      if (isGeneric(clientDescription) && data.businessDescription && !isGeneric(data.businessDescription)) {
        clientDescription = data.businessDescription;
      } else if (!clientDescription) {
        clientDescription = data.businessDescription || DEFAULT_DEMO_CONFIG.clientDescription;
      }

      let clientCatalog = data.clientCatalog || '';
      if (isGeneric(clientCatalog) && data.servicesAndPrices && !isGeneric(data.servicesAndPrices)) {
        clientCatalog = data.servicesAndPrices;
      } else if (!clientCatalog) {
        clientCatalog = data.servicesAndPrices || DEFAULT_DEMO_CONFIG.clientCatalog;
      }

      const clientFaqs = data.faqs || data.clientFaqs || DEFAULT_DEMO_CONFIG.clientFaqs;
      const clientTone = data.specialInstructions || data.clientTone || DEFAULT_DEMO_CONFIG.clientTone;

      const merged: WhatsAppDemoConfig = {
        ...DEFAULT_DEMO_CONFIG,
        ...data,
        clientDescription,
        clientCatalog,
        clientFaqs,
        clientTone,
        businessDescription: clientDescription,
        servicesAndPrices: clientCatalog,
        faqs: clientFaqs,
        specialInstructions: clientTone,
      };

      // Verificar si la demo expiró por tiempo
      if (merged.active && merged.expiresAt) {
        if (new Date(merged.expiresAt).getTime() <= Date.now()) {
          merged.active = false;
          saveWhatsAppDemoConfig(merged);
        }
      }
      return merged;
    }
  } catch {
    /* fallback */
  }
  return DEFAULT_DEMO_CONFIG;
}

export function saveWhatsAppDemoConfig(patch: Partial<WhatsAppDemoConfig>): WhatsAppDemoConfig {
  const current = loadWhatsAppDemoConfig();

  // Si el usuario edita businessDescription o clientDescription, tomar el nuevo valor explícito
  const clientDescription = patch.businessDescription ?? patch.clientDescription ?? current.clientDescription;
  const clientCatalog = patch.servicesAndPrices ?? patch.clientCatalog ?? current.clientCatalog;
  const clientFaqs = patch.faqs ?? patch.clientFaqs ?? current.clientFaqs;
  const clientTone = patch.specialInstructions ?? patch.clientTone ?? current.clientTone;

  const next: WhatsAppDemoConfig = {
    ...current,
    ...patch,
    clientDescription,
    clientCatalog,
    clientFaqs,
    clientTone,
    businessDescription: clientDescription,
    servicesAndPrices: clientCatalog,
    faqs: clientFaqs,
    specialInstructions: clientTone,
    updatedAt: new Date().toISOString(),
  };

  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(DEMO_FILE, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

export function isWhatsAppDemoActive(): boolean {
  const cfg = loadWhatsAppDemoConfig();
  if (!cfg.active) return false;
  if (cfg.expiresAt && new Date(cfg.expiresAt).getTime() <= Date.now()) {
    saveWhatsAppDemoConfig({ active: false });
    return false;
  }
  return true;
}

/**
 * Genera el System Prompt de demostración para WhatsApp y LLMs externos.
 */
export function buildDemoSystemPrompt(cfg: WhatsAppDemoConfig): string {
  const desc = cfg.clientDescription || cfg.businessDescription || 'Empresa comprometida con brindar la mejor experiencia.';
  const cat = cfg.clientCatalog || cfg.servicesAndPrices || 'Consulta con nuestro equipo para disponibilidad y tarifas.';
  const faqs = cfg.clientFaqs || cfg.faqs || 'Horarios habituales de atención.';
  const tone = cfg.clientTone || cfg.specialInstructions || 'cercano, empático y orientado a servir y vender';

  return `
# IDENTIDAD
Eres el asistente virtual oficial de "${cfg.clientBusinessName}".
Estás atendiendo a través del canal oficial de WhatsApp de la empresa.
Tu tono es ${tone}.

# ACERCA DE LA EMPRESA
${desc}

# CATÁLOGO DE PRODUCTOS / SERVICIOS Y PRECIOS
${cat}

# POLÍTICAS, HORARIOS Y PREGUNTAS FRECUENTES
${faqs}

# REGLAS DE ATENCIÓN EN WHATSAPP
1. Hablas en nombre de "${cfg.clientBusinessName}".
2. NUNCA menciones que eres una demostración, ni menciones a EDMYSOFT ni a plataformas externas. Eres el asesor real de ${cfg.clientBusinessName}.
3. Atiende con calidez humana, empatía y respuestas ágiles (1 a 3 párrafos cortos). Resalta datos con *negrita*.
4. Cuando un cliente mencione su nombre y el motivo o procedimiento deseado (ej. "Edier mery gallego para una revisión odontológica y sacar un acarie"), salúdalo por su nombre, confirma de inmediato que tomaste nota de su solicitud de revisión y tratamiento, infórmale las tarifas y facilidades relevantes, y ofrécele de forma concreta dos opciones de horario (mañana o tarde) para agendarlo.
5. Si preguntan precios, cita las tarifas oficiales del catálogo con exactitud.
6. Si preguntan horarios o ubicación, responde con los datos oficiales.
`.trim();
}

export interface DemoChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DemoAgentResult {
  reply: string;
  modelUsed: string;
  intent: 'GENERAL' | 'SCHEDULE' | 'QUOTE' | 'HUMAN_TAKEOVER';
}

function normText(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function capitalizeWords(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Motor conversacional contextual multi-turno para el Modo Demostración.
 * Diseñado para responder con empatía humana, retención de contexto,
 * reconocimiento de nombres, diagnóstico de procedimientos, cotización exacta
 * y flujo de agendamiento sin bucles robóticos.
 */
export function handleDemoConversation(
  userMessage: string,
  history: DemoChatMessage[] = [],
  cfg: WhatsAppDemoConfig,
  ctxName?: string | null
): DemoAgentResult {
  const t = normText(userMessage);
  const rawMsg = userMessage.trim();

  // Historial de la conversación
  const userHistory = history.filter((h) => h.role === 'user');
  const assistantHistory = history.filter((h) => h.role === 'assistant');
  const lastAssistant = assistantHistory[assistantHistory.length - 1]?.content || '';
  const lastAssistantNorm = normText(lastAssistant);
  const isFirstTurn = userHistory.length === 0;

  const bizName = cfg.clientBusinessName || 'Nuestro Centro';
  const catalog = cfg.clientCatalog || cfg.servicesAndPrices || '';
  const faqs = cfg.clientFaqs || cfg.faqs || '';

  // -------------------------------------------------------------
  // 1. EXTRACCIÓN DE NOMBRE DEL CLIENTE (Memoria de la conversación)
  // -------------------------------------------------------------
  let extractedName = '';
  // Si en el mensaje actual el usuario se presenta:
  // "Edier mery gallego para una revisión..."
  // "Soy Edier Gallego..."
  // "Me llamo Maria Camila..."
  const nameMatchWithPrefix = rawMsg.match(/(?:soy|me llamo|mi nombre es|hablas con)\s+([a-záéíóúñA-ZÁÉÍÓÚÑ]{2,}(?:\s+[a-záéíóúñA-ZÁÉÍÓÚÑ]{2,}){1,3})/i);
  const nameMatchBeforeFor = rawMsg.match(/^([a-záéíóúñA-ZÁÉÍÓÚÑ]{2,}(?:\s+[a-záéíóúñA-ZÁÉÍÓÚÑ]{2,}){1,3})\s+(?:para|necesito|quiero|solicito|busco|mi|con|tengo)\b/i);
  const nameMatchOnly = rawMsg.match(/^([a-záéíóúñA-ZÁÉÍÓÚÑ]{2,}(?:\s+[a-záéíóúñA-ZÁÉÍÓÚÑ]{2,}){1,3})$/i);

  if (nameMatchWithPrefix) {
    extractedName = nameMatchWithPrefix[1].trim();
  } else if (nameMatchBeforeFor) {
    extractedName = nameMatchBeforeFor[1].trim();
  } else if (lastAssistantNorm.includes('nombre') && nameMatchOnly) {
    extractedName = nameMatchOnly[1].trim();
  } else if (ctxName && !/^\+?\d+$/.test(ctxName) && !/^(visitante|invitado|cliente)/i.test(ctxName)) {
    extractedName = ctxName;
  }

  // Buscar si el nombre ya se había presentado en turnos anteriores
  if (!extractedName) {
    for (const pastUser of userHistory) {
      const pmBeforeFor = pastUser.content.match(/^([a-záéíóúñA-ZÁÉÍÓÚÑ]{2,}(?:\s+[a-záéíóúñA-ZÁÉÍÓÚÑ]{2,}){1,3})\s+(?:para|necesito|quiero|solicito)\b/i);
      const pmPrefix = pastUser.content.match(/(?:soy|me llamo|mi nombre es)\s+([a-záéíóúñA-ZÁÉÍÓÚÑ]{2,}(?:\s+[a-záéíóúñA-ZÁÉÍÓÚÑ]{2,}){1,3})/i);
      if (pmBeforeFor) {
        extractedName = pmBeforeFor[1].trim();
        break;
      }
      if (pmPrefix) {
        extractedName = pmPrefix[1].trim();
        break;
      }
    }
  }

  const firstName = extractedName ? capitalizeWords(extractedName.split(/\s+/)[0]) : '';
  const fullNameFormatted = extractedName ? capitalizeWords(extractedName) : '';

  // -------------------------------------------------------------
  // 2. DETECCIÓN DE PROCEDIMIENTO O SERVICIO DESEADO
  // -------------------------------------------------------------
  const allUserText = [...userHistory.map((u) => u.content), rawMsg].join(' ');
  const allUserNorm = normText(allUserText);

  const hasCaries = /carie|calza|resina|curacion|tapadura|sacar.*acarie|sacar.*carie/.test(allUserNorm);
  const hasLimpieza = /limpieza|profilaxis|ultrasonido|sarro|tartaro/.test(allUserNorm);
  const hasOrtodoncia = /ortodoncia|bracket|frenillo|alineador|invisible/.test(allUserNorm);
  const hasBlanqueamiento = /blanqueamiento|aclaramiento|dientes blancos/.test(allUserNorm);
  const hasDiseno = /diseno|carilla|lente dental|estetica dental/.test(allUserNorm);
  const hasImplante = /implante|corona|protesis|tornillo/.test(allUserNorm);
  const hasUrgencia = /dolor|urgencia|emergencia|molestia|partio|rompio|muela|hinchad/.test(allUserNorm);
  const hasRevision = /revision|valoracion|diagnostico|chequeo|consulta/.test(allUserNorm);

  // Formular título del procedimiento detectado
  let procedureTitle = '';
  if (hasCaries && hasRevision) {
    procedureTitle = 'revisión odontológica y curación de caries (calza estética en resina)';
  } else if (hasCaries) {
    procedureTitle = 'curación y retiro de caries con calza en resina estética';
  } else if (hasLimpieza) {
    procedureTitle = 'limpieza profunda con ultrasonido y profilaxis';
  } else if (hasOrtodoncia) {
    procedureTitle = 'valoración para ortodoncia y diseño de alineación';
  } else if (hasBlanqueamiento) {
    procedureTitle = 'blanqueamiento LED profesional';
  } else if (hasDiseno) {
    procedureTitle = 'diseño de sonrisa y estética dental';
  } else if (hasImplante) {
    procedureTitle = 'valoración para implantes dentales y rehabilitación';
  } else if (hasUrgencia) {
    procedureTitle = 'atención prioritaria de urgencia odontológica';
  } else if (hasRevision) {
    procedureTitle = 'valoración y chequeo odontológico integral';
  }

  // -------------------------------------------------------------
  // 2.5 COMENTARIOS "NADA QUE VER" (PIVOTE INGENIOSO AL NEGOCIO)
  // -------------------------------------------------------------
  if (!procedureTitle) {
    const pivot = checkWittyPivot(rawMsg, { isDemo: true, bizName, clientName: firstName });
    if (pivot && pivot.isOffTopic) {
      return {
        reply: pivot.reply,
        modelUsed: 'demo-agent-contextual',
        intent: 'GENERAL',
      };
    }
  }

  // -------------------------------------------------------------
  // 3. DETECCIÓN DE FECHA / HORA / JORNADA
  // -------------------------------------------------------------
  const hasSlot = /manana|hoy|tarde|temprano|\b\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)\b|lunes|martes|miercoles|jueves|viernes|sabado|en la manana|en la tarde/i.test(t);
  const isMorning = /manana|temprano|\b(8|9|10|11)\b|am|a\.m\./i.test(t);
  const isAfternoon = /tarde|\b(1|2|3|4|5|6)\b|pm|p\.m\./i.test(t);

  // -------------------------------------------------------------
  // 4. DETECCIÓN DE SOLICITUD DE ASESOR HUMANO
  // -------------------------------------------------------------
  if (/\b(asesor|humano|persona real|hablar con alguien|ejecutivo|agente humano)\b/.test(t)) {
    return {
      reply: `¡Por supuesto! Ya comuniqué tu solicitud a nuestro equipo de atención de *${bizName}*. En unos momentos un asesor continuará la gestión contigo por este chat. 🙌`,
      modelUsed: 'demo-agent-contextual',
      intent: 'HUMAN_TAKEOVER',
    };
  }

  // -------------------------------------------------------------
  // 5. DETECCIÓN DE CONFIRMACIÓN FINAL ("sí", "perfecto", "dale", "listo")
  // -------------------------------------------------------------
  const isConfirmation = /^(si|dale|perfecto|listo|de una|de acuerdo|confirmado|claro que si|muchas gracias|gracias)/i.test(t);
  if (isConfirmation && (lastAssistantNorm.includes('recordatorio') || lastAssistantNorm.includes('pre-agendado') || lastAssistantNorm.includes('confirmamos'))) {
    return {
      reply: `¡Cita confirmada con total éxito${firstName ? `, *${firstName}*` : ''}! 🎉 Ya registramos tu espacio en la agenda de *${bizName}*.\n\nTe esperamos con el mejor cuidado para tu sonrisa. Si llegas a tener cualquier novedad o requieres reprogramar, escríbenos por aquí con total confianza. ¡Que tengas un excelente día! ✨`,
      modelUsed: 'demo-agent-contextual',
      intent: 'SCHEDULE',
    };
  }

  // -------------------------------------------------------------
  // 6. FLUJO PASO 3: EL CLIENTE ESCOGE DÍA O HORA ("Mañana a las 10am")
  // -------------------------------------------------------------
  if (hasSlot && (lastAssistantNorm.includes('jornada') || lastAssistantNorm.includes('disponibilidad') || lastAssistantNorm.includes('turno') || lastAssistantNorm.includes('que dia'))) {
    let slotDisplay = 'el horario solicitado';
    if (t.includes('manana')) {
      slotDisplay = isMorning ? 'mañana en la mañana (10:00 AM)' : 'mañana en la tarde (3:00 PM)';
    } else if (t.includes('hoy')) {
      slotDisplay = isAfternoon ? 'hoy en la tarde (4:00 PM)' : 'hoy en la mañana';
    } else if (isMorning) {
      slotDisplay = 'en la jornada de la mañana (10:00 AM)';
    } else if (isAfternoon) {
      slotDisplay = 'en la jornada de la tarde (3:30 PM)';
    }

    const procedureDesc = procedureTitle || 'tu valoración y tratamiento dental';

    return {
      reply: `¡Excelente${firstName ? `, *${firstName}*` : ''}! 🗓️ Te dejamos pre-agendado(a) para *${procedureDesc}* para *${slotDisplay}* en *${bizName}*.\n\n📍 *Ubicación*: Cra 15 # 93-40, Piso 3, Chicó, Bogotá.\n💳 *Medios de pago*: Efectivo, Nequi, Daviplata, PSE y tarjetas.\n🚗 *Parqueadero*: Convenio en el edificio.\n\nTe sugerimos llegar 10 minutos antes. ¿Te confirmamos este horario y te enviamos el recordatorio a este WhatsApp?`,
      modelUsed: 'demo-agent-contextual',
      intent: 'SCHEDULE',
    };
  }

  // -------------------------------------------------------------
  // 7. FLUJO PASO 2: EL CLIENTE ENVÍA NOMBRE Y/O PROCEDIMIENTO
  // (¡ESTE ES EL CASO CRÍTICO DE LA CAPTURA: "Edier mery gallego para una revisión odontológica y sacar un acarie"!)
  // -------------------------------------------------------------
  const userGaveNameOrProcedure =
    Boolean(nameMatchWithPrefix || nameMatchBeforeFor || (lastAssistantNorm.includes('nombre') && (extractedName || hasCaries || hasRevision || hasLimpieza)));

  if (userGaveNameOrProcedure || (extractedName && (hasCaries || hasRevision || hasLimpieza || hasOrtodoncia || hasBlanqueamiento))) {
    const saludoPersonal = firstName ? `¡Mucho gusto, *${firstName}*! 👋 Qué alegría saludarte.` : `¡Con el mayor gusto! 👋`;
    const procedureDesc = procedureTitle || 'tu revisión y procedimiento';

    // Cotización contextual con tarifas transparentes del catálogo
    let pricingBlock = '';
    if (hasCaries) {
      pricingBlock = `• *Valoración odontológica inicial*: $30.000 COP (¡Completamente GRATIS si inicias tu tratamiento con nosotros!).\n• *Calzas estéticas en resina (caries)*: desde $90.000 COP por pieza con resinas de alta estética y acabado natural.`;
    } else if (hasLimpieza) {
      pricingBlock = `• *Limpieza profunda con ultrasonido*: $85.000 COP (remueve cálculo, sarro y manchas con profilaxis completa).\n• *Valoración general*: Gratis con la limpieza.`;
    } else if (hasBlanqueamiento) {
      pricingBlock = `• *Blanqueamiento LED profesional*: $280.000 COP (resultados estéticos visibles desde la primera sesión).`;
    } else if (hasOrtodoncia) {
      pricingBlock = `• *Ortodoncia invisible (mensualidad)*: $130.000 COP con alineadores estéticos.\n• *Valoración y diagnóstico de ortodoncia*: $30.000 COP (gratis con el tratamiento).`;
    } else {
      pricingBlock = `• *Valoración odontológica integral*: $30.000 COP (Gratis al iniciar tratamiento).`;
    }

    return {
      reply: `${saludoPersonal}\n\nTomamos atenta nota de tu solicitud para *${procedureDesc}*.\n\nTe comparto nuestras tarifas y beneficios vigentes:\n${pricingBlock}\n\nContamos con disponibilidad para atenderte esta semana en dos turnos:\n☀️ *Jornada de la mañana*: entre 8:30 AM y 11:30 AM\n🌅 *Jornada de la tarde*: entre 2:00 PM y 5:30 PM\n\n¿Para qué día y en cuál de estos dos turnos te quedaría mejor asistir?`,
      modelUsed: 'demo-agent-contextual',
      intent: 'SCHEDULE',
    };
  }

  // -------------------------------------------------------------
  // 8. PREGUNTAS SOBRE PRECIOS O CATÁLOGO
  // -------------------------------------------------------------
  const isAskingPrice = /precio|costo|cuanto|vale|cobran|tarifa|catalogo|planes/i.test(t);
  if (isAskingPrice) {
    if (hasLimpieza) {
      return {
        reply: `En *${bizName}*, la *Limpieza profunda con ultrasonido* tiene un valor de *$85.000 COP* e incluye remoción de placa y sarro, profilaxis y pulido dental. ✨\n\n¿Deseas que te agendemos un turno para esta semana?`,
        modelUsed: 'demo-agent-contextual',
        intent: 'QUOTE',
      };
    }
    if (hasOrtodoncia) {
      return {
        reply: `En *${bizName}*, la mensualidad del tratamiento de *Ortodoncia invisible con alineadores estéticos* es de *$130.000 COP*. Incluye seguimiento periódico y controles de evolución.\n\n¿Te gustaría agendar una valoración diagnóstica para evaluar tu caso?`,
        modelUsed: 'demo-agent-contextual',
        intent: 'QUOTE',
      };
    }
    if (hasBlanqueamiento) {
      return {
        reply: `En *${bizName}*, el *Blanqueamiento LED profesional* tiene un valor de *$280.000 COP*. Es un procedimiento rápido, seguro y con resultados notorios desde la primera sesión. ✨\n\n¿Deseas programar tu sesión de blanqueamiento?`,
        modelUsed: 'demo-agent-contextual',
        intent: 'QUOTE',
      };
    }
    if (hasCaries) {
      return {
        reply: `En *${bizName}*, las *calzas estéticas en resina para caries* van desde *$90.000 COP* por pieza dental. Además, la *valoración odontológica* ($30.000 COP) te queda totalmente GRATIS si inicias tu tratamiento con nosotros. 🙌\n\n¿Te gustaría programar una valoración para que un especialista revise tu caso?`,
        modelUsed: 'demo-agent-contextual',
        intent: 'QUOTE',
      };
    }
    return {
      reply: `En *${bizName}* manejamos las siguientes opciones y tarifas oficiales:\n\n${catalog}\n\n¿Cuál de estos tratamientos se ajusta a lo que buscas o deseas que te asesoremos?`,
      modelUsed: 'demo-agent-contextual',
      intent: 'QUOTE',
    };
  }

  // -------------------------------------------------------------
  // 9. PREGUNTAS SOBRE UBICACIÓN, HORARIOS, PAGOS, PARQUEADERO
  // -------------------------------------------------------------
  const isAskingContact = /horario|donde|ubicacion|direccion|telefono|contacto|como llegar|parqueadero|pago|tarjeta|nequi/i.test(t);
  if (isAskingContact) {
    return {
      reply: `Con gusto te comparto la información de atención de *${bizName}*:\n\n${faqs}\n\n¿Tienes alguna duda puntual o te gustaría coordinar tu cita previa?`,
      modelUsed: 'demo-agent-contextual',
      intent: 'GENERAL',
    };
  }

  // -------------------------------------------------------------
  // 10. EL USUARIO PIDE CITA O RESERVA DE FORMA GENERAL ("Para un cita")
  // -------------------------------------------------------------
  const isAskingAppointment = /cita|agendar|reservar|apartar|turno|disponibilidad/i.test(t);
  if (isAskingAppointment) {
    return {
      reply: `¡Excelente! Con gusto organizamos tu cita en *${bizName}* 😊.\n\nPor favor indícanos tu *nombre completo* y el *procedimiento o motivo* de tu consulta (o si presentas alguna molestia o dolor puntual).`,
      modelUsed: 'demo-agent-contextual',
      intent: 'SCHEDULE',
    };
  }

  // -------------------------------------------------------------
  // 11. SALUDOS ("Hola", "Buenas tardes", "Hola buenas")
  // -------------------------------------------------------------
  const isGreeting = /^(hola|buenas|buenos dias|buenas tardes|que tal|cordial saludo)/i.test(t);
  if (isGreeting) {
    if (isFirstTurn) {
      const desc = cfg.clientDescription || cfg.businessDescription || 'Atención personalizada y tratamientos especializados.';
      return {
        reply: `¡Hola! 👋 Te damos la bienvenida a *${bizName}*.\n\n${desc}\n\n¿En qué te podemos ayudar hoy? (Puedes consultarnos por tratamientos, tarifas o agendamiento de citas).`,
        modelUsed: 'demo-agent-contextual',
        intent: 'GENERAL',
      };
    }
    return {
      reply: `¡Hola de nuevo${firstName ? `, *${firstName}*` : ''}! 👋 Cuéntanos, ¿en qué te podemos colaborar o qué consulta deseas resolver hoy?`,
      modelUsed: 'demo-agent-contextual',
      intent: 'GENERAL',
    };
  }

  // -------------------------------------------------------------
  // 12. RESPUESTA DE CONTINUIDAD NATURAL (Evita reinicio robótico)
  // -------------------------------------------------------------
  if (procedureTitle) {
    return {
      reply: `Entendido${firstName ? `, *${firstName}*` : ''}. Respecto a *${procedureTitle}*, estamos listos para atenderte en *${bizName}*.\n\n¿Te gustaría que te presentemos horarios disponibles para tu valoración o prefieres conocer algún detalle adicional de las tarifas?`,
      modelUsed: 'demo-agent-contextual',
      intent: 'GENERAL',
    };
  }

  return {
    reply: `En *${bizName}* estamos para servirte. Contamos con atención personalizada para cuidar tu salud y bienestar.\n\n¿Te podemos orientar con tarifas de algún tratamiento en particular o te gustaría agendar una valoración con nuestros especialistas?`,
    modelUsed: 'demo-agent-contextual',
    intent: 'GENERAL',
  };
}
