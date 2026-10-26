import prisma from './prisma';

export interface CustomerProfile {
  contactId?: string;
  identifier: string; // phone, email o sessionId
  fullName?: string;
  companyName?: string;
  businessSector?: string;
  businessDescription?: string;
  dailyVolume?: string;
  quotedPlan?: string;
  keyPain?: string;
  objections?: string[];
  agreedAction?: string;
  lastSummary?: string;
  sentiment?: 'interesado' | 'escéptico' | 'listo_para_cerrar' | 'curioso';
  interactionsCount: number;
  lastInteractionAt: string;
}

const MEMORY_PREFIX = 'CLIENT_MEM_';

/**
 * Obtiene la memoria persistente del cliente dado un teléfono, correo, id de contacto o id de sesión web.
 */
export async function getCustomerMemory(identifier: string): Promise<CustomerProfile | null> {
  if (!identifier || !identifier.trim()) return null;
  const cleanKey = identifier.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');

  try {
    // 1. Buscar en SystemSetting (almacén estructurado rápido)
    const setting = await prisma.systemSetting.findUnique({
      where: { key: `${MEMORY_PREFIX}${cleanKey}` },
    });

    if (setting?.value) {
      try {
        return JSON.parse(setting.value) as CustomerProfile;
      } catch {
        // Formato dañado, continuar a reconstrucción
      }
    }

    // 2. Si no existe en setting, intentar inferir del Contacto y Oportunidad en el CRM
    const contact = await prisma.contact.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { email: identifier },
          { id: identifier },
        ],
      },
      include: {
        opportunities: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
        conversations: {
          orderBy: { lastMessageAt: 'desc' },
          take: 2,
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (contact) {
      const opp = contact.opportunities[0];
      const recentMsgs = contact.conversations.flatMap(c => c.messages).slice(0, 10);
      const profile: CustomerProfile = {
        contactId: contact.id,
        identifier: contact.phone || contact.email || contact.id,
        fullName: contact.fullName !== 'Visitante' && contact.fullName !== 'Cliente WhatsApp' ? contact.fullName : undefined,
        companyName: contact.companyName || undefined,
        businessSector: opp?.serviceInterest || undefined,
        keyPain: opp?.identifiedNeed || undefined,
        agreedAction: opp?.nextActionNote || undefined,
        interactionsCount: recentMsgs.length > 0 ? recentMsgs.length : 1,
        lastInteractionAt: contact.updatedAt.toISOString(),
      };
      return profile;
    }

    return null;
  } catch (error) {
    console.warn('[customer-memory] Error al leer memoria:', error);
    return null;
  }
}

/**
 * Guarda o actualiza la memoria persistente de un cliente.
 */
export async function saveCustomerMemory(
  identifier: string,
  updates: Partial<CustomerProfile>
): Promise<CustomerProfile> {
  const cleanKey = identifier.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');
  const existing = (await getCustomerMemory(identifier)) || {
    identifier,
    interactionsCount: 0,
    lastInteractionAt: new Date().toISOString(),
  };

  const merged: CustomerProfile = {
    ...existing,
    ...updates,
    fullName: updates.fullName || existing.fullName,
    companyName: updates.companyName || existing.companyName,
    businessSector: updates.businessSector || existing.businessSector,
    businessDescription: updates.businessDescription || existing.businessDescription,
    dailyVolume: updates.dailyVolume || existing.dailyVolume,
    quotedPlan: updates.quotedPlan || existing.quotedPlan,
    keyPain: updates.keyPain || existing.keyPain,
    agreedAction: updates.agreedAction || existing.agreedAction,
    lastSummary: updates.lastSummary || existing.lastSummary,
    sentiment: updates.sentiment || existing.sentiment,
    interactionsCount: (existing.interactionsCount || 0) + 1,
    lastInteractionAt: new Date().toISOString(),
  };

  try {
    await prisma.systemSetting.upsert({
      where: { key: `${MEMORY_PREFIX}${cleanKey}` },
      create: {
        key: `${MEMORY_PREFIX}${cleanKey}`,
        value: JSON.stringify(merged),
        description: `Memoria del cliente ${merged.fullName || identifier}`,
        group: 'CRM_MEMORY',
      },
      update: {
        value: JSON.stringify(merged),
        description: `Memoria del cliente ${merged.fullName || identifier}`,
      },
    });

    // Sincronizar también con el Contacto en Prisma si existe
    if (merged.contactId || updates.fullName || updates.companyName) {
      const contactWhere = merged.contactId
        ? { id: merged.contactId }
        : identifier.includes('@')
        ? { email: identifier }
        : { phone: identifier };

      const existingContact = await prisma.contact.findFirst({ where: contactWhere });
      if (existingContact) {
        await prisma.contact.update({
          where: { id: existingContact.id },
          data: {
            fullName: merged.fullName && merged.fullName.length > 2 ? merged.fullName : existingContact.fullName,
            companyName: merged.companyName || existingContact.companyName,
          },
        });
      }
    }
  } catch (err) {
    console.warn('[customer-memory] Error al persistir memoria:', err);
  }

  return merged;
}

/**
 * Analiza un mensaje entrante y el contexto para extraer datos del perfil del cliente en tiempo real.
 */
export function extractClientInsights(text: string, currentMemory?: CustomerProfile | null): Partial<CustomerProfile> {
  const insights: Partial<CustomerProfile> = {};
  const t = text.trim();
  const lower = t.toLowerCase();

  // 1. Extracción de Nombre
  const nameMatch = t.match(/(?:mi nombre es|me llamo|soy)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]{3,}(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]{3,})?)/i);
  if (nameMatch && nameMatch[1]) {
    const rawName = nameMatch[1].trim();
    if (!/^(un|una|el|la|de|para|tengo|quiero)$/i.test(rawName)) {
      insights.fullName = rawName;
    }
  }

  // 2. Extracción del Tipo de Negocio / Sector
  if (/\b(inmobiliaria|bienes raices|arriendos|ventas de casas|apartamentos)\b/i.test(lower)) {
    insights.businessSector = 'Inmobiliaria y Bienes Raíces';
  } else if (/\b(clinica|consultorio|odontolog|medico|dermatolog|estetica|spa|salud)\b/i.test(lower)) {
    insights.businessSector = 'Salud, Odontología y Estética';
  } else if (/\b(restaurante|cafeteria|bar|comida|asados|pizza|hamburguesa|domicilios)\b/i.test(lower)) {
    insights.businessSector = 'Gastronomía y Restaurantes';
  } else if (/\b(tienda|ecommerce|e-commerce|vendo ropa|calzado|accesorios|productos|bodega)\b/i.test(lower)) {
    insights.businessSector = 'E-commerce y Retail';
  } else if (/\b(abogado|contador|agencia|consultor|asesoria|firma)\b/i.test(lower)) {
    insights.businessSector = 'Servicios Profesionales';
  } else if (/\b(celular|celulares|tecnologia|computadores|accesorios de celular)\b/i.test(lower)) {
    insights.businessSector = 'Tecnología y Telefonía';
  } else if (/\b(transporte|logistica|camiones|fletes|envios|rutas)\b/i.test(lower)) {
    insights.businessSector = 'Logística y Transporte';
  }

  // 3. Extracción de Dolor / Cuello de Botella
  if (/\b(no alcanzo a responder|muchos mensajes|se pierden clientes|demoro en responder|saturado|respondo tarde|no tengo tiempo)\b/i.test(lower)) {
    insights.keyPain = 'Saturación en WhatsApp y pérdida de ventas por respuesta tardía';
  } else if (/\b(cotizar|cotizaciones|quitan mucho tiempo|repetitivo)\b/i.test(lower)) {
    insights.keyPain = 'Pérdida de tiempo elaborando cotizaciones manuales';
  } else if (/\b(no van a las citas|cancelan a ultima hora|ausentismo|no asisten)\b/i.test(lower)) {
    insights.keyPain = 'Ausentismo en citas y falta de confirmación automática';
  }

  // 4. Volumen
  const volumeMatch = t.match(/(\d+)\s*(?:mensajes|clientes|chats|personas|pedidos|consultas)\s*(?:al dia|diarios|por dia)?/i);
  if (volumeMatch) {
    insights.dailyVolume = `${volumeMatch[1]} mensajes/clientes al día`;
  }

  // 5. Plan cotizado
  if (/\b(plan plus|el plus)\b/i.test(lower)) {
    insights.quotedPlan = 'Plan Plus ($3.800.000 + $550k/mes)';
  } else if (/\b(plan estandar|el estandar|el basico)\b/i.test(lower)) {
    insights.quotedPlan = 'Plan Estándar ($2.200.000 + $350k/mes)';
  } else if (/\b(plan enterprise|el enterprise)\b/i.test(lower)) {
    insights.quotedPlan = 'Plan Enterprise ($6.500.000 + $950k/mes)';
  }

  // 6. Actitud / Sentimiento
  if (/\b(agendemos|de una|hagale|me interesa|cuando empezamos|cuanto tardan|hacerlo ya)\b/i.test(lower)) {
    insights.sentiment = 'listo_para_cerrar';
  } else if (/\b(caro|rebaja|descuento|lo pensare|no se)\b/i.test(lower)) {
    insights.sentiment = 'escéptico';
  } else if (insights.businessSector || insights.keyPain) {
    insights.sentiment = 'interesado';
  }

  return insights;
}

/**
 * Formatea la memoria del cliente como una directiva clara para inyectar en el System Prompt.
 */
export function formatCustomerMemoryForPrompt(profile?: CustomerProfile | null): string {
  if (!profile || profile.interactionsCount === 0) {
    return '';
  }

  const parts: string[] = [
    '# 🧠 MEMORIA PERMANENTE DEL CLIENTE (RECONOCIMIENTO ACTIVO)',
    'Este cliente YA ha hablado antes contigo. Posee un historial acumulado que DEBES recordar y respetar:',
  ];

  if (profile.fullName) {
    parts.push(`- Nombre del cliente: ${profile.fullName}`);
  }
  if (profile.businessSector) {
    parts.push(`- Negocio / Sector: ${profile.businessSector}`);
  }
  if (profile.companyName) {
    parts.push(`- Empresa: ${profile.companyName}`);
  }
  if (profile.dailyVolume) {
    parts.push(`- Volumen que atiende: ${profile.dailyVolume}`);
  }
  if (profile.keyPain) {
    parts.push(`- Cuello de botella identificado: ${profile.keyPain}`);
  }
  if (profile.quotedPlan) {
    parts.push(`- Plan de interés o cotizado: ${profile.quotedPlan}`);
  }
  if (profile.agreedAction) {
    parts.push(`- Próximo paso acordado anteriormente: ${profile.agreedAction}`);
  }
  if (profile.lastSummary) {
    parts.push(`- Resumen de charlas previas: ${profile.lastSummary}`);
  }

  parts.push(
    '',
    '⚠️ DIRECTIVAS DE CONTINUIDAD OBLIGATORIAS:',
    '1. Si saluda o retoma contacto, RECONÓCELO cálidamente por su nombre o haciendo alusión a su negocio (ej: "¡Hola! Qué gusto saludarte de nuevo. ¿Cómo va todo con tu negocio de...?").',
    '2. PROHIBIDO volver a preguntarle datos que ya están en esta memoria (ej. si ya sabes qué negocio tiene, no preguntes de qué es su negocio).',
    '3. Construye sobre lo que ya hablaron y avanza hacia el agendamiento con Edier o la resolución de su duda pendiente.'
  );

  return parts.join('\n');
}
