/**
 * Módulo de Respuestas Ingeniosas y Pivotes Comerciales (Witty Sales Bridge).
 * Permite a la IA responder con carisma, ingenio y humor ante comentarios "nada que ver"
 * (chistes, clima, fútbol, comida, filosofía, memes, cansancio, etc.),
 * reencuadrando la conversación de inmediato hacia la automatización, el valor y el cierre de venta.
 */

export interface WittyPivotResult {
  isOffTopic: boolean;
  reply: string;
  category?: string;
  intent: 'GENERAL' | 'QUOTE' | 'SCHEDULE';
}

interface PivotRule {
  category: string;
  pattern: RegExp;
  templates: ((bizContext?: { isDemo?: boolean; bizName?: string; clientName?: string }) => string)[];
}

const PIVOT_RULES: PivotRule[] = [
  // 1. CHISTES, HUMOR Y MEMES
  {
    category: 'humor',
    pattern: /\b(chiste|cuentame un chiste|hazme reir|gracioso|un meme|chistoso|broma)\b/i,
    templates: [
      (ctx) =>
        `😄 Va uno bien empresarial:\n\n` +
        `— ¿Por qué el dueño de negocio no podía dormir tranquilo?\n` +
        `— Porque soñaba que un cliente le escribía a las 11:59 PM preguntando *"¿precio?"* y él no tenía su Agente de IA para responderle al instante. 😂\n\n` +
        `Ahora en serio: nada da más paz mental que saber que tu WhatsApp vende 24/7 sin que tú tengas que sacrificar tus horas de descanso.\n\n` +
        `Cuéntame${ctx?.clientName ? `, ${ctx.clientName}` : ''}, ¿en tu negocio quién se encarga hoy de contestar todos esos mensajes que llegan a deshoras?`,
      () =>
        `¡Jajaja, me encanta el buen humor! Dicen que la risa es el mejor remedio, pero en los negocios, el mejor remedio para el estrés es tener un Agente de IA que te responda todos los chats al segundo y te filtre los prospectos listos para comprar. 🚀\n\n` +
        `¿Qué tipo de clientes atiendes y qué proceso sientes que hoy te quita más energía?`,
    ],
  },

  // 2. FÚTBOL, DEPORTES Y PASATIEMPOS
  {
    category: 'deportes',
    pattern: /\b(futbol|partido|gol|champions|seleccion colombia|nacional|millonarios|santa fe|junior|america|gym|gimnasio|ciclismo|bici|trotar|pesos)\b/i,
    templates: [
      (ctx) =>
        `⚽ ¡Totalmente de acuerdo! Y fíjate que en los negocios pasa exactamente igual que en la cancha:\n\n` +
        `Si el goleador (tú o tu equipo de ventas) tiene que estar de arquero tapando mensajes repetitivos todo el día, ¿quién se encarga de meter los goles de la facturación? 🥅\n\n` +
        `Justo ahí entra nuestro Agente de IA de EDMYSOFT: te deja la portería asegurada respondiendo en 3 segundos en WhatsApp para que tú solo tengas que rematar y cerrar las ventas.\n\n` +
        `¿En tu negocio hoy quién está "tapando" todos los mensajes que entran a diario?`,
      () =>
        `🏋️‍♂️ ¡Esa es la actitud! La disciplina y el alto rendimiento se notan. Y en una empresa, el rendimiento se dispara cuando liberas a tu equipo de tareas pesadas y repetitivas.\n\n` +
        `Con un bot de IA bien entrenado, tus clientes reciben cotizaciones y agendan citas en automático mientras tú estás entrenando o enfocado en la estrategia. ¿Qué vendes en tu negocio y qué te gustaría dejar funcionando solo?`,
    ],
  },

  // 3. COMIDA, HAMBRE, CAFÉ Y DESCANSO
  {
    category: 'comida_cafe',
    pattern: /\b(tengo hambre|almorzar|almuerzo|cafe|un tintico|comida|pizza|hamburguesa|cenar|desayuno|antojo|comiendo)\b/i,
    templates: [
      (ctx) => {
        if (ctx?.isDemo && ctx?.bizName) {
          return `¡Qué delicia! En *${ctx.bizName}* el sabor y la buena atención son sagrados. 🍽️\n\n¿Te antojaste de algo especial de nuestra carta o te gustaría que te reservemos una mesa para disfrutarlo al máximo?`;
        }
        return `☕ ¡Uff, un buen café (o un almuerzo tranquilo) no se le niega a nadie! Y lo mejor es poder disfrutarlo sin el estrés de que el celular esté sonando cada 2 minutos con clientes preguntando lo mismo.\n\n` +
          `Esa es la verdadera libertad que da tener un Agente de IA en EDMYSOFT: te cubre la espalda 24/7 mientras tú disfrutas de tu café o tu comida con total tranquilidad. 😌\n\n` +
          `¿De qué es tu empresa y cuántas horas al día calculas que se te van contestando mensajes manualmente?`;
      },
    ],
  },

  // 4. CLIMA (LLUVIA, CALOR, FRÍO)
  {
    category: 'clima',
    pattern: /\b(lloviendo|lluvia|mucho frio|hace calor|calor insoportable|aguacero|clima loco|soleado|frio)\b/i,
    templates: [
      () =>
        `🌧️ ¡Totalmente! El clima está tremendo. Pero fíjate en lo bueno: llueva, truene o relampaguee, tu negocio digital nunca se moja ni se frena si tienes un Agente de IA atendiendo a tus clientes en WhatsApp.\n\n` +
        `Mientras afuera cae el diluvio, tu canal de ventas sigue atendiendo, cotizando y cerrando prospectos en caliente. 🚀\n\n` +
        `¿Tu negocio atiende a nivel local o vendes a nivel nacional en Colombia?`,
    ],
  },

  // 5. CANSANCIO, PEREZA O ESTRÉS
  {
    category: 'cansancio',
    pattern: /\b(estoy cansado|tengo pereza|aburrido|mucho trabajo|estresado|harto|no quiero trabajar|agotado)\b/i,
    templates: [
      () =>
        `💡 Dicen los grandes emprendedores que la "pereza" bien entendida es la madre de toda automatización.\n\n` +
        `Nadie montó una empresa para pasar 8 horas al día copiando y pegando precios en WhatsApp. El ser humano nació para crear, negociar y disfrutar; los robots nacieron para las tareas repetitivas y aburridas.\n\n` +
        `Si pudieras delegarle a una Inteligencia Artificial una sola tarea de tu negocio para no volverla a hacer tú nunca más, ¿cuál sería?`,
    ],
  },

  // 6. EXTRATERRESTRES, FILOSOFÍA Y ROBOTS
  {
    category: 'filosofia_aliens',
    pattern: /\b(extraterrestres|aliens|ovni|sentido de la vida|dios|la ia va a dominar|skynet|terminator|robot|tienes sentimientos|estas viva|eres real)\b/i,
    templates: [
      () =>
        `🛸 Jajaja, si los extraterrestres llegan a la Tierra, ¡seguro van a querer que sus negocios atiendan por WhatsApp con la IA de EDMYSOFT!\n\n` +
        `Ahora, sobre si las máquinas van a dominar el mundo: lo que sí es un hecho es que los empresarios que usan IA ya están superando por goleada a los que siguen contestando mensajes manuales con libreta y lápiz.\n\n` +
        `¿Prefieres que la IA sea tu mejor aliada comercial o seguir compitiendo a la antigua? Cuéntame de qué es tu negocio y te muestro el impacto real.`,
    ],
  },

  // 7. POLÍTICA, ECONOMÍA O NOTICIAS
  {
    category: 'economia_politica',
    pattern: /\b(el presidente|la politica|politicos|la inflacion|la economia esta dura|impuestos|la situacion del pais|dolar|noticias)\b/i,
    templates: [
      () =>
        `Entiendo tu punto; las noticias y la economía siempre traen incertidumbre. Pero fíjate que justamente en momentos donde todo el mundo busca cuidar el presupuesto, optimizar costos con tecnología es la jugada más inteligente:\n\n` +
        `• Un asesor humano cuesta ~$1.600.000 COP al mes más prestaciones y solo atiende 8 horas.\n` +
        `• Un Agente de IA atiende 24/7 a cientos de personas al mismo tiempo por una fracción de ese costo, sin incapacidades ni ausencias.\n\n` +
        `Es la forma más rápida de blindar tu negocio y aumentar el margen de ganancia. ¿Qué proceso comercial quisieras hacer más eficiente hoy?`,
    ],
  },

  // 8. PIROPOS, COQUETEO O PREGUNTAS PERSONALES
  {
    category: 'personal_coqueteo',
    pattern: /\b(estas soltera|estas soltero|tienes novio|tienes novia|eres linda|eres lindo|casate conmigo|te amo|que haces hoy)\b/i,
    templates: [
      () =>
        `😉 ¡Agradezco el cumplido! Pero mi corazón le pertenece 100% a la tecnología, a la automatización y a ayudar a los negocios a multiplicar sus ventas en WhatsApp.\n\n` +
        `Eso sí: prometo ser el compañero más fiel para tu empresa, porque nunca llego tarde, no me tomo vacaciones y respondo en 2 segundos a cada uno de tus clientes. 🚀\n\n` +
        `¿Qué tipo de negocio tienes y cómo te gustaría que empecemos a potenciarlo?`,
    ],
  },

  // 9. CURIOSIDADES O DESAFÍOS ("A VER QUÉ SABES", "PRUÉBAME ALGO")
  {
    category: 'desafio',
    pattern: /\b(a ver que sabes|prueba|demuestramelo|sorprendeme|que puedes hacer|a ver si eres inteligente)\b/i,
    templates: [
      () =>
        `🎯 ¡Me encantan los retos! Lo más sorprendente no es lo que sé, sino lo que puedo hacer por tu cuenta bancaria:\n\n` +
        `Puedo recibir a un cliente a las 2:00 AM, calificar si tiene presupuesto para comprar, enviarle tu catálogo con precios exactos en pesos colombianos, agendarle una cita sincronizada en Google Calendar y dejarte la venta lista en tu CRM... todo en menos de 40 segundos y sin que tú toques el celular.\n\n` +
        `¿Te gustaría ver cómo funcionaría esa magia con tu propio catálogo o servicio?`,
    ],
  },
];

function norm(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Evalúa si un mensaje del usuario es "nada que ver" / off-topic,
 * y en tal caso genera una respuesta ingeniosa de pivote hacia la venta.
 */
export function checkWittyPivot(
  userMessage: string,
  ctx?: {
    isDemo?: boolean;
    bizName?: string;
    clientName?: string;
  }
): WittyPivotResult | null {
  const text = userMessage.trim();
  if (text.length < 3) return null;
  const normalized = norm(text);

  for (const rule of PIVOT_RULES) {
    if (rule.pattern.test(normalized) || rule.pattern.test(text)) {
      const template = rule.templates[Math.floor(Math.random() * rule.templates.length)];
      const reply = template(ctx);
      return {
        isOffTopic: true,
        reply,
        category: rule.category,
        intent: 'GENERAL',
      };
    }
  }

  return null;
}
