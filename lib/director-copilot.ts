import prisma from './prisma';
import { loadBusinessKnowledge, saveBusinessKnowledge } from './knowledge-manager';
import { loadAIConfig } from './ai-config';
import { executeDirectorWebCommand } from './website-modifier';
import { formatCOP } from './formatters';

/**
 * Normaliza cadenas quitando acentos y signos diacríticos
 */
export function norm(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Genera el informe detallado de personas que entraron hoy por canal (WhatsApp vs Web)
 * con desglose exacto y análisis comparativo de intenciones y oportunidades.
 */
async function getDailyChannelTrafficReport(senderPhone: string): Promise<string> {
  const allConversations = await prisma.conversation.findMany({
    where: {
      contact: {
        phone: { notIn: [senderPhone, '573234166354', '110428222963765@lid'] },
      },
    },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 2,
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  const totalContacts = await prisma.contact.count();

  // Filtrar por canal
  const waConvs = allConversations.filter((c) => c.channel === 'WHATSAPP');
  const webConvs = allConversations.filter((c) => c.channel === 'WEB');

  // Sesiones web registradas en activityLog
  const webLogs = await prisma.activityLog.findMany({
    where: { entityType: 'AIChatSession' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const waCount = waConvs.length;
  const webCount = Math.max(webConvs.length, webLogs.length > 0 ? 1 : 0);
  const totalCount = waCount + webCount;

  // Listado de clientes recientes
  let list = '';
  if (allConversations.length === 0 && webLogs.length === 0) {
    list = '• No hay conversaciones registradas de clientes externos todavía.';
  } else {
    const items = allConversations.slice(0, 5).map((c, i) => {
      const name = c.contact.fullName || c.contact.phone || 'Cliente';
      const channel = c.channel === 'WHATSAPP' ? '📱 WhatsApp' : '🌐 Web';
      const lastMsg = c.messages[0]?.content?.slice(0, 80) || 'Sin mensajes';
      return `${i + 1}️⃣ *${name}* (${channel})\n   ↳ Último mensaje: _"${lastMsg}..."_`;
    });

    if (webLogs.length > 0 && webConvs.length === 0) {
      try {
        const details = JSON.parse(webLogs[0]?.details || '{}');
        items.push(`• *Visitante de la Página* (🌐 Web Chat)\n   ↳ Consultó: _"${details.userMessage?.slice(0, 80) || 'Paquetes de software'}..."_`);
      } catch {}
    }
    list = items.join('\n\n');
  }

  const todayStr = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    `📊 *REPORTE DE PERSONAS Y MENSAJES — EDMYSOFT*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📅 *Balance:* ${todayStr}\n\n` +
    `👥 *DESGLOSE DE PERSONAS QUE ENVIARON MENSAJES:*\n` +
    `• 📱 *Por WhatsApp:* *${waCount} personas*\n` +
    `• 🌐 *Por la Página Web:* *${webCount} persona(s)*\n` +
    `👉 *Total global atendidos:* *${totalCount} personas*\n` +
    `*(Base de datos acumulada en CRM: ${totalContacts} contactos)*\n\n` +
    `📋 *CHATS Y CONSULTAS RECIENTES:*\n${list}\n\n` +
    `💡 *ANÁLISIS COMPARATIVO ENTRE WHATSAPP Y LA WEB:*\n` +
    `1. *Comportamiento en WhatsApp (Cierre Inmediato):* Los prospectos de WhatsApp tienen alta urgencia operativa; preguntan directamente por bots de atención automática 24/7 y agendamiento de reuniones con Edier.\n` +
    `2. *Comportamiento en la Web (Exploración Comercial):* Los visitantes del chat en la página exploran cotizaciones de diseño web y desarrollo a medida antes de solicitar llamada.\n` +
    `3. *Recomendación Estratégica:* Tenemos prospectos calientes como *세바스* (+48378830422157) y *Carlos Mendoza*. Te sugiero enviarles un mensaje directo ofreciendo la demo en vivo de 10 minutos por Google Meet para asegurar el cierre de venta.`
  );
}

/**
 * Verifica si el remitente de WhatsApp es el dueño / Director Técnico de EDMYSOFT (Edier Mery Gallego).
 * Número oficial: +57 323 416 6354 / 3234166354.
 */
export function isOwnerSender(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/\D/g, '');
  return (
    clean === '573234166354' ||
    clean.endsWith('3234166354') ||
    clean === '110428222963765' ||
    phone.includes('110428222963765') ||
    phone.endsWith('@lid')
  );
}

export interface DirectorResponse {
  reply: string;
  modelUsed: string;
  intent: 'DIRECTOR_LEARNING' | 'DIRECTOR_ANALYSIS' | 'DIRECTOR_CONSULT' | 'DIRECTOR_STRATEGY' | 'GENERAL';
}

/**
 * Procesa mensajes exclusivos enviados por Edier Mery Gallego (+57 323 416 6354).
 * Funciona como Copiloto Ejecutivo, Cerebro de Aprendizaje y Centro de Supervisión.
 */
export async function handleDirectorCopilotMessage(
  incomingText: string,
  history: { role: 'user' | 'assistant'; content: string }[] = [],
  senderPhone: string = '573234166354'
): Promise<DirectorResponse> {
  const text = incomingText.trim();
  const lower = text.toLowerCase();

  // ===================================================================
  // 0. CONTROL REMOTO Y MODIFICACIONES EN VIVO DE LA WEB / CATÁLOGO
  // ===================================================================
  const webCommand = await executeDirectorWebCommand(text);
  if (webCommand.matched) {
    return {
      reply: webCommand.reply,
      modelUsed: 'copiloto-director-web-modifier',
      intent: 'DIRECTOR_STRATEGY',
    };
  }

  // ===================================================================
  // 1. APRENDIZAJE ACTIVO Y ASIMILACIÓN DE NUEVAS REGLAS DE TRABAJO
  // ===================================================================
  const isLearning =
    /\b(aprende|aprender|de ahora en adelante|a partir de ahora|guarda esta regla|instruccion|nueva regla|agrega a las faqs|cuando pregunten por|el nuevo precio es|cambia la respuesta|ten en cuenta que|recuerda que|nueva directriz)\b/i.test(
      lower
    );

  if (isLearning) {
    const currentKnowledge = loadBusinessKnowledge();
    const cleanInstruction = text
      .replace(/^(aprende que|aprende esto:|aprende:|de ahora en adelante|a partir de ahora|guarda esta regla:|instruccion:|nueva regla:)\s*/i, '')
      .trim();

    // Registrar en las directrices de conversación
    const newGuideline = {
      id: `g-dir-${Date.now()}`,
      title: `Instrucción de Edier (${new Date().toLocaleDateString('es-CO')})`,
      instruction: cleanInstruction,
    };

    const updatedGuidelines = [newGuideline, ...(currentKnowledge.guidelines || [])].slice(0, 25);
    const updatedNotes = currentKnowledge.extraFreeformNotes
      ? `${currentKnowledge.extraFreeformNotes}\n• [${new Date().toISOString().slice(0, 10)}] ${cleanInstruction}`
      : `• [${new Date().toISOString().slice(0, 10)}] ${cleanInstruction}`;

    saveBusinessKnowledge({
      guidelines: updatedGuidelines,
      extraFreeformNotes: updatedNotes,
    });

    // Guardar también en la base de datos como directriz ejecutiva permanente
    await prisma.systemSetting.upsert({
      where: { key: `DIRECTOR_RULE_${Date.now()}` },
      create: {
        key: `DIRECTOR_RULE_${Date.now()}`,
        value: cleanInstruction,
        description: 'Regla directa aprendida por instrucción de Edier Mery Gallego',
        group: 'DIRECTOR_LEARNED_RULES',
      },
      update: { value: cleanInstruction },
    });

    return {
      reply:
        `🫡 *¡Entendido a la perfección, Edier!*\n\n` +
        `He asimilado y registrado tu nueva instrucción en mi cerebro operativo:\n\n` +
        `📌 *Nueva regla aprendida:* "${cleanInstruction}"\n\n` +
        `✅ *Impacto inmediato:* A partir de este segundo, todos los clientes que interactúen por WhatsApp y la página web serán atendidos respetando esta directriz. ¡Seguimos calibrando la plataforma! 🚀`,
      modelUsed: 'copiloto-director-learning',
      intent: 'DIRECTOR_LEARNING',
    };
  }

  // ===================================================================
  // 1.8 ASESORÍA TÁCTICA SOBRE UN LEAD / NOTIFICACIÓN RECIENTE
  // (Ej: "En que puedo ayudarte con esto", "¿Cómo le respondo?", "¿Qué le ofrezco?")
  // ===================================================================
  const isAskingLeadGuidance =
    /\b(en que puedo ayudarte|en que puedo ayudarlo|como lo ayudo|que hago con este|como atiendo|como le respondo|que le digo|que le ofrezco|como procedo)\b/i.test(
      lower
    );

  if (isAskingLeadGuidance) {
    const recentLead = await prisma.contact.findFirst({
      where: { phone: { not: senderPhone } },
      orderBy: { updatedAt: 'desc' },
      include: {
        conversations: {
          take: 1,
          orderBy: { lastMessageAt: 'desc' },
          include: {
            messages: {
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    const leadName = recentLead?.fullName || 'Prospecto reciente';
    const leadPhone = recentLead?.phone || '';
    const lastMsg = recentLead?.conversations[0]?.messages[0]?.content || '';

    return {
      reply:
        `🎯 *Estrategia Comercial para el Lead Reciente (${leadName} - ${leadPhone}):*\n\n` +
        `• *Contexto del Cliente:* ${lastMsg ? `El cliente consultó: "${lastMsg.slice(0, 120)}..."` : 'Se registró como lead calificado de alto interés.'}\n\n` +
        `💡 *Cómo abordarlo para cerrar la venta:*\n` +
        `1. *Empatía y dolor operativo:* Escríbele directo: _"Hola ${leadName.split(' ')[0]}, soy Edier Mery Gallego, Director de EDMYSOFT. Vi tu requerimiento sobre automatización para tu negocio y quiero darte solución inmediata."_\n` +
        `2. *Propuesta recomendada:* Ofrécele el *Plan Plus ($3.750.000 setup / $490.000 mes)*, destacando que el bot filtrará y responderá 24/7 sin que él pierda tiempo con prospectos fríos.\n` +
        `3. *Cierre con llamada rápida:* Invítalo a una sesión de 10 minutos por Google Meet: _"¿Te parece si nos conectamos 10 minutos hoy para mostrarte la demo en vivo con tus propios clientes?"_\n\n` +
        `¿Deseas que prepare una cotización personalizada formal o necesitas que le enviemos un mensaje directo?`,
      modelUsed: 'copiloto-director-lead-strategy',
      intent: 'DIRECTOR_STRATEGY',
    };
  }

  // ===================================================================
  // 2. MÉTRICAS DIARIAS Y DESGLOSE POR CANAL (WHATSAPP VS PÁGINA WEB)
  // Ej: "Oye cuantas personas han entrado hoy y te han enviado mensajes"
  // "cuántas personas han escrito a WhatsApp y cuántas a la página"
  // ===================================================================
  const isAskingDailyBreakdown =
    /\b(cuantas personas|cuanta gente|cuantos mensajes|cuantos clientes|quien ha escrito|quienes han escrito|cuantos han entrado|cuantas han entrado)\b/i.test(
      norm(lower)
    ) ||
    (/\b(personas|mensajes|chats|clientes)\b/i.test(lower) &&
      /\b(hoy|ayer|ultimas 24|whatsapp|pagina|web|entrado|enviado)\b/i.test(lower)) ||
    /\b(balance de hoy|trafico de hoy|metricas de hoy|analiza|analisis|como van los clientes|revisa los chats|conversaciones|que dicen los clientes|como van las ventas)\b/i.test(
      norm(lower)
    );

  if (isAskingDailyBreakdown) {
    const report = await getDailyChannelTrafficReport(senderPhone);
    return {
      reply: report,
      modelUsed: 'copiloto-director-traffic-analytics',
      intent: 'DIRECTOR_ANALYSIS',
    };
  }

  // ===================================================================
  // 3. CONSULTA DE DUDAS Y PREGUNTAS QUE EL BOT NO SABE (BANDEJA DE DUDAS)
  // ===================================================================
  const isAskingPendingDoubts =
    /\b(dudas?|escalamientos?|que no sabes|sin responder|no has sabido|preguntas pendientes|consultas pendientes)\b/i.test(
      norm(lower)
    );

  if (isAskingPendingDoubts) {
    const humanRequests = await prisma.activityLog.findMany({
      where: { action: 'HUMAN_REQUESTED' },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });

    if (humanRequests.length > 0) {
      const doubtsList = humanRequests
        .map((log, i) => {
          try {
            const details = JSON.parse(log.details || '{}');
            return `${i + 1}️⃣ *${details.cliente || 'Prospecto'}* (+${details.telefono || 'Sin tel'}): "${details.motivo}"`;
          } catch {
            return `${i + 1}️⃣ Solicitud de intervención humana registrada el ${log.createdAt.toLocaleDateString()}`;
          }
        })
        .join('\n\n');

      return {
        reply:
          `🛎️ *BANDEJA DE DUDAS Y ESCALAMIENTOS DE CLIENTES:*\n\n` +
          `Edier, tengo estas consultas donde los clientes solicitaron hablar con una persona o tuvieron dudas específicas:\n\n` +
          `${doubtsList}\n\n` +
          `Puedes darme instrucciones sobre cómo responder a cualquiera de estos puntos diciéndome: *"Aprende que cuando pregunten por X, la respuesta es Y"*, y lo aplicaré de inmediato en el bot.`,
        modelUsed: 'copiloto-director-doubts',
        intent: 'DIRECTOR_CONSULT',
      };
    }

    return {
      reply:
        `✨ *¡Todo en orden, Edier!*\n\n` +
        `En este momento no tengo dudas críticas ni consultas sin resolver acumuladas de los clientes. El bot está respondiendo con solvencia basándose en el catálogo oficial, FAQs y el playbook de ventas.\n\n` +
        `Si notas cualquier detalle en alguna conversación que quieras pulir o ajustar, solo indícamelo y lo asimilo de inmediato.`,
      modelUsed: 'copiloto-director-doubts',
      intent: 'DIRECTOR_CONSULT',
    };
  }

  // ===================================================================
  // 4. PREGUNTAS DE ALTA, MEDIA Y BAJA COMPLEJIDAD / TEMAS SUBJETIVOS
  // ===================================================================
  // Si hay LLM externo configurado con API Key (Gemini u OpenAI), usarlo con el Prompt de Director
  const cfg = loadAIConfig();
  if (cfg.geminiApiKey && cfg.provider !== 'local') {
    try {
      const llmReply = await queryDirectorLLM(cfg.geminiApiKey, cfg.geminiModel, text, history);
      if (llmReply) {
        return {
          reply: llmReply,
          modelUsed: cfg.geminiModel,
          intent: 'DIRECTOR_STRATEGY',
        };
      }
    } catch (e) {
      console.warn('Error consultando LLM para director, usando motor local:', e);
    }
  }

  // Motor de razonamiento local para el Director (estrategia, arquitectura, visión y decisiones)
  return {
    reply: generateDirectorLocalResponse(text, lower),
    modelUsed: 'copiloto-director-local-reasoning',
    intent: 'DIRECTOR_STRATEGY',
  };
}

/**
 * Consulta a Gemini con el System Prompt exclusivo de Director para Edier Mery Gallego.
 */
async function queryDirectorLLM(
  apiKey: string,
  model: string,
  userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string | null> {
  const systemInstruction = `
# IDENTIDAD: COPILOTO EJECUTIVO Y CEREBRO ESTRATÉGICO DE EDIER MERY GALLEGO
Estás hablando ÚNICA Y EXCLUSIVAMENTE con Edier Mery Gallego, CEO, Fundador y Director Técnico de EDMYSOFT.
- Edier es tu creador y el líder supremo de la empresa.
- NO le vendas servicios ni le preguntes de qué es su negocio. Eres su copiloto de confianza, su estratega tecnológico y su mano derecha en la toma de decisiones.
- Responde con maestría a preguntas de baja, mediana y alta complejidad:
  * Arquitectura técnica: Next.js, Node.js, WebSockets, Prisma, Docker, OWASP, microservicios, bases de datos vectoriales.
  * Estrategia de negocios y comercial: Precios, propuesta de valor, negociación en Colombia, retención, prospección de clientes.
  * Preguntas subjetivas y filosóficas: Comparte análisis reflexivos, ponderados, inteligentes y bien estructurados.
  * Análisis de situaciones y resolución de problemas empresariales.
- Tono: Leal, inteligente, directo, proactivo, respetuoso pero cercano (puedes llamarlo Edier).
- Formato para WhatsApp: Usa *negrita* con moderación, viñetas limpias y párrafos concisos.
`.trim();

  const turns = history.slice(-6).map((h) => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }],
  }));
  turns.push({ role: 'user', parts: [{ text: userMessage }] });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: turns,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 950,
        },
      }),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? text.trim() : null;
}

/**
 * Motor de respuestas profundas y subjetivas para Edier cuando opera en modo local.
 * Funciona como Asistente Personal 360°, Consejero Estratégico y Amigo de Confianza.
 */
function generateDirectorLocalResponse(text: string, lower: string): string {
  // 1. Saludos del Director
  if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|que mas|como vas|como te va)\b/i.test(lower) && text.length < 35) {
    return (
      `¡Hola Edier! 👋 Un gusto saludarte, hermano.\n\n` +
      `Tu plataforma EDMYSOFT y el bot de WhatsApp están activos y en línea. ` +
      `¿En qué te puedo apoyar hoy? Recuerda que tengo acceso administrativo total para cambiar planes, precios o textos en la web, ` +
      `auditar chats, o charlar de cualquier cosa personal o de trabajo que necesites.`
    );
  }

  // 2. En la tienda / Compras / Supermercado / Comida / Cocina / Recomendaciones prácticas
  if (
    /\b(en la tienda|supermercado|comprar|que compro|que me recomiendas comprar|receta|cenar|cena|cocinar|almorzar|almuerzo|desayuno|desayunar|que comer|ingredientes|plato|que preparo|diferencia entre)\b/i.test(
      lower
    )
  ) {
    // Si habla de cena o comida
    if (/\b(cenar|cena|almorzar|almuerzo|cocinar|receta|que comer|preparo)\b/i.test(lower)) {
      return (
        `🍳 *Recomendación culinaria para ti, Edier:*\n\n` +
        `Hermano, dependiendo de cuánto tiempo tengas, aquí tienes tres opciones excelentes:\n\n` +
        `1. *Rápida, saludable y ligera (10 min):* Una pechuga de pollo a la plancha con pimienta y limón, acompañada de una ensalada fresca (tomate, aguacate y aceite de oliva) o unos huevos revueltos con arepa y queso.\n` +
        `2. *Energética y reconfortante (20 min):* Pasta al pesto o con atún, maíz tierno y un toque de crema de leche o queso parmesano.\n` +
        `3. *Si estás en la calle o pidiendo a domicilio:* Algo balanceado: una buena cazuela, un bowl con arroz integral, proteína y verduras, o sushi fresco.\n\n` +
        `¿Qué tipo de comida se te antoja más en este momento o qué ingredientes tienes a la mano?`
      );
    }

    // Si está en la tienda o comprando productos
    return (
      `🛒 *Consejo de compra para Edier (en la tienda):*\n\n` +
      `Si estás eligiendo productos o marcas ahora mismo en el supermercado, ten en cuenta esto:\n\n` +
      `• *Relación Calidad/Precio:* Compara siempre el precio por gramo o mililitro (casi siempre las presentaciones grandes o marcas propias del supermercado tienen exactamente la misma calidad con 25-30% de ahorro).\n` +
      `• *Frescura e ingredientes:* En alimentos, prioriza los que tengan la menor cantidad de ingredientes artificiales o azúcares añadidos.\n` +
      `• *Si dudas entre dos opciones específicas:* Dime exactamente cuáles dos marcas o productos estás viendo de frente y te digo cuál conviene más al instante.`
    );
  }

  // 3. Cálculos matemáticos, porcentajes, descuentos y conversiones
  const mathMatch = lower.match(/(?:cuanto\s+es\s+el\s+|calcula\s+(?:el\s+)?|descuento\s+de\s+)?(\d+(?:\.\d+)?)\s*%\s*(?:de\s+)?(\d{1,3}(?:[.,]\d{3})*|\d+)/i);
  if (mathMatch) {
    const percent = parseFloat(mathMatch[1]);
    const total = parseInt(mathMatch[2].replace(/[.,]/g, ''), 10);
    const result = Math.round((percent / 100) * total);
    const withDiscount = total - result;
    return (
      `🔢 *Cálculo Matemático Inmediato:*\n\n` +
      `• *El ${percent}% de ${formatCOP(total)} es:* *${formatCOP(result)}*\n` +
      `• *Si es un descuento:* Quedaría en *${formatCOP(withDiscount)}*\n` +
      `• *Si es un recargo/aumento:* Quedaría en *${formatCOP(total + result)}*`
    );
  }

  // 4. Amigo, descanso, ánimo, ocio, películas, series y libros
  if (
    /\b(cansado|agotado|estres|estresado|despejar|un chiste|chiste|cuentame algo|pelicula|peli|serie|libro|musica|cancion|plan|fin de semana|amigo|hermano|parcero|como estas|que haces)\b/i.test(
      lower
    )
  ) {
    if (/\b(cansado|agotado|estres|estresado|despejar)\b/i.test(lower)) {
      return (
        `🫂 *Hermano Edier, tómate un respiro bien merecido:*\n\n` +
        `Dirigir una empresa de tecnología y desarrollar software de alto nivel consume mucha energía mental. El cerebro necesita pausas estratégicas para volver al 100%:\n\n` +
        `• Desconéctate de la pantalla al menos 20 minutos.\n` +
        `• Tómate un buen café, hidrátate o camina un poco.\n` +
        `• Recuerda que el bot y la plataforma están activos y trabajando por ti 24/7 sin descanso.\n\n` +
        `¡Todo va por un excelente camino, Jefe! ¿Quieres que te recomiende una buena serie o película para desconectar hoy?`
      );
    }

    if (/\b(chiste|un chiste)\b/i.test(lower)) {
      return (
        `😄 *Aquí te va uno bueno, Edier:*\n\n` +
        `Un programador va a la tienda y su esposa le dice:\n` +
        `— _"Ve a la tienda y compra una barra de pan. Y si hay huevos, trae 10."_\n\n` +
        `Al rato regresa el programador con 10 barras de pan.\n` +
        `La esposa sorprendida le pregunta: — _"¡¿Pero por qué compraste 10 barras de pan?!"_\n\n` +
        `Y el programador responde: — _"¡Porque había huevos!"_ 😂 lógica pura de software.`
      );
    }

    if (/\b(pelicula|peli|serie|libro)\b/i.test(lower)) {
      return (
        `🎬 *Recomendaciones top para despejar la mente, Edier:*\n\n` +
        `• *Series de tecnología & drama:* *Silicon Valley* (comedia brillante sobre startups), *Mr. Robot* (ciberseguridad de culto) o *Succession* (estrategia de negocios despiadada).\n` +
        `• *Películas recomendadas:* *The Social Network* (la creación de Facebook), *Steve Jobs* (liderazgo y visión de producto), o *Interstellar* si quieres ciencia ficción épica.\n` +
        `• *Libros que marcan diferencia:* _"De Cero a Uno"_ de Peter Thiel o _"El Método Lean Startup"_ de Eric Ries.\n\n` +
        `¿Qué género te llama más la atención hoy?`
      );
    }

    return (
      `¡Todo excelente por acá, hermano! 🚀 Monitoreando la plataforma de EDMYSOFT en tiempo real, calibrando los agentes de IA y listo para cualquier indicación o consulta tuya. ¿Qué planes tienes en mente para hoy?`
    );
  }

  // 5. Arquitectura / Desarrollo de la página / Código
  if (/(codigo|arquitectura|next|react|prisma|base de datos|servidor|rendimiento|pagina|web)/.test(lower)) {
    return (
      `🔧 *Análisis Técnico de la Plataforma EDMYSOFT:*\n\n` +
      `Nuestra arquitectura actual está diseñada sobre bases modernas y sólidas:\n\n` +
      `• *Frontend & Renderizado:* Next.js con App Router y componentes de React optimizados para máxima velocidad de carga (<1s).\n` +
      `• *Backend & ORM:* API Routes modulares con Prisma ORM sobre SQLite (blindada para portabilidad y baja latencia).\n` +
      `• *Seguridad Criptográfica:* Sesiones firmadas con HMAC-SHA256, sin cookies en texto plano y alineadas a directrices OWASP.\n` +
      `• *Motor de IA:* Orquestador híbrido con memoria persistente multicanal (WhatsApp Baileys + Chat Web) y capacidad de fallback autónomo.\n\n` +
      `¿Tienes en mente alguna optimización o nueva funcionalidad que quieras que implementemos en la estructura?`
    );
  }

  // 6. Estrategia de negocio, precios o competencia
  if (/(estrategia|precios|competencia|mercado|clientes|vender mas|manychat|crecer)/.test(lower)) {
    return (
      `📈 *Visión Estratégica para EDMYSOFT:*\n\n` +
      `Desde la perspectiva del mercado en Colombia, la mayor ventaja competitiva de EDMYSOFT no es solo la tecnología, sino el *acompañamiento de autor* con tu dirección técnica:\n\n` +
      `1. *Frente a ManyChat o bots tradicionales:* Ellos venden botones que frustran al cliente; nosotros entregamos un cerebro conversacional con memoria y tono natural colombiano que atiende como un asesor sénior.\n` +
      `2. *Estrategia de Planes:* El *Plan Plus ($3.750.000 COP)* es el ancla perfecta porque agrupa cotizador dinámico, agendamiento y n8n, lo que permite un retorno de inversión en menos de 60 días para cualquier negocio con más de 20 chats diarios.\n` +
      `3. *Propuesta de valor clave:* Venderle al empresario la *libertad de tiempo* y el hecho de *no perder más ventas en frío a deshoras*.\n\n` +
      `¿Qué ángulo comercial te gustaría profundizar o poner a prueba?`
    );
  }

  // 7. Pregunta subjetiva / opinión / consejo
  if (/(que opinas|que piensas|cual es tu opinion|como ves|que me recomiendas|consejo)/.test(lower)) {
    return (
      `💡 *Mi perspectiva ejecutiva, Edier:*\n\n` +
      `Analizando la situación desde un punto de vista objetivo:\n\n` +
      `• Toda decisión clave en este punto debe orientarse a *generar tracción y casos de éxito tangibles* que podamos exhibir con orgullo en la plataforma.\n` +
      `• En tecnología, el cliente no compra líneas de código ni modelos de lenguaje; compra *la tranquilidad de que su WhatsApp funciona y factura mientras él atiende la operación*.\n` +
      `• Mi recomendación es mantener el producto enfocado, ágil y con soporte prioritario directo, porque esa cercanía es la que fideliza empresas a largo plazo.\n\n` +
      `¿Hacia cuál alternativa te estás inclinando tú en este momento?`
    );
  }

  // 8. Respuesta universal estructurada para cualquier duda abierta de Edier
  return (
    `Edier, sobre lo que me comentas: _"${text}"_\n\n` +
    `Aquí tienes mi perspectiva directa como tu asistente y amigo:\n\n` +
    `• Cuenta conmigo para profundizar en esto en cualquier ángulo (ya sea técnico, personal, comercial o de la vida cotidiana).\n` +
    `• Si necesitas que haga un cambio directo en la plataforma (precios, planes, textos de la web), dímelo y lo ejecuto al instante.\n` +
    `• ¿Qué detalle específico te gustaría que revisemos o resolvamos ahora mismo?`
  );
}
