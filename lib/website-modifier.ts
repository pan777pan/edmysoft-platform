import prisma from './prisma';
import { formatCOP } from './formatters';
import { saveNegotiationConfig } from './pricing-manager';

/**
 * Motor de Modificación Remota de la Web vía WhatsApp
 * Permite a Edier Mery Gallego actualizar precios, servicios, textos y generar
 * desgloses de cotización ejecutiva desde su chat de WhatsApp en tiempo real.
 */

export interface PriceUpdateResult {
  success: boolean;
  message: string;
  planName?: string;
  oldSetup?: number;
  newSetup?: number;
  oldMonthly?: number;
  newMonthly?: number;
}

/**
 * 1. Muestra el catálogo de precios actual de la web
 */
export async function getCurrentWebsiteOverview(): Promise<string> {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { setupPrice: 'asc' },
    include: { service: true },
  });

  const modules = await prisma.serviceModule.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  let text = `🌐 *CATÁLOGO DE PRECIOS EN VIVO — EDMYSOFT*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `📦 *PLANES PRINCIPALES ACTIVOS EN LA WEB:*\n`;

  for (const p of plans) {
    text += `• *${p.name}* (${p.service?.name || 'Servicio'}):\n`;
    text += `   ↳ Setup Inicial: *${formatCOP(p.setupPrice)}*\n`;
    text += `   ↳ Mensualidad: *${formatCOP(p.recurringPrice)}/mes*\n`;
  }

  text += `\n🧩 *MÓDULOS Y SERVICIOS ADICIONALES:*\n`;
  for (const m of modules.slice(0, 8)) {
    text += `• *${m.name}*: Setup *${formatCOP(m.setupPrice)}* | Mensual *${formatCOP(m.recurringPrice)}/mes*\n`;
  }

  text += `\n💡 *Comandos que puedes enviarme:*`;
  text += `\n- _"Cambia el precio del Plan Plus a 3.500.000 setup y 500.000 mensual"_`;
  text += `\n- _"Cambia el precio del Plan Básico a 1.800.000"_`;
  text += `\n- _"Calcula cotización para restaurante con 2 módulos y 10% de descuento"_`;

  return text;
}

/**
 * 2. Modifica el precio de un plan oficial en la base de datos y sincroniza
 */
export async function changePlanPrice(params: {
  planQuery: string;
  setupPrice?: number;
  monthlyPrice?: number;
}): Promise<PriceUpdateResult> {
  const { planQuery, setupPrice, monthlyPrice } = params;
  const q = planQuery.trim().toLowerCase();

  // Buscar plan coincidente en la base de datos
  const plans = await prisma.plan.findMany();
  let matchedPlan = plans.find(
    (p) =>
      p.slug.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      q.includes(p.slug.toLowerCase()) ||
      q.includes(p.name.toLowerCase())
  );

  // Si no coincide exactamente, buscar por palabras clave
  if (!matchedPlan) {
    if (q.includes('basico') || q.includes('básico') || q.includes('estandar') || q.includes('estándar')) {
      matchedPlan = plans.find((p) => p.slug.includes('estandar') || p.slug.includes('basico') || p.name.toLowerCase().includes('básico'));
    } else if (q.includes('plus') || q.includes('crecimiento') || q.includes('medio')) {
      matchedPlan = plans.find((p) => p.slug.includes('plus') || p.name.toLowerCase().includes('plus'));
    } else if (q.includes('enterprise') || q.includes('avanzado') || q.includes('corporativo')) {
      matchedPlan = plans.find((p) => p.slug.includes('enterprise') || p.name.toLowerCase().includes('enterprise'));
    }
  }

  if (!matchedPlan) {
    return {
      success: false,
      message: `No encontré ningún plan en la base de datos que coincida con "${planQuery}". Revisa los planes con el comando _"muestra los precios"_ para ver los nombres exactos.`,
    };
  }

  const oldSetup = matchedPlan.setupPrice;
  const oldMonthly = matchedPlan.recurringPrice;
  const newSetup = setupPrice !== undefined ? setupPrice : oldSetup;
  const newMonthly = monthlyPrice !== undefined ? monthlyPrice : oldMonthly;

  // Actualizar en Prisma
  const updated = await prisma.plan.update({
    where: { id: matchedPlan.id },
    data: {
      setupPrice: newSetup,
      recurringPrice: newMonthly,
      updatedAt: new Date(),
    },
  });

  // Si es uno de los 3 planes centrales, actualizar también pisos de regateo
  try {
    const slug = matchedPlan.slug.toLowerCase();
    if (slug.includes('estandar') || slug.includes('basico')) {
      saveNegotiationConfig({ minSetupFloorCOP: { estandar: Math.round(newSetup * 0.9), plus: 3400000, enterprise: 5800000 } });
    } else if (slug.includes('plus')) {
      saveNegotiationConfig({ minSetupFloorCOP: { estandar: 2000000, plus: Math.round(newSetup * 0.9), enterprise: 5800000 } });
    } else if (slug.includes('enterprise')) {
      saveNegotiationConfig({ minSetupFloorCOP: { estandar: 2000000, plus: 3400000, enterprise: Math.round(newSetup * 0.9) } });
    }
  } catch {
    /* opcional */
  }

  return {
    success: true,
    planName: updated.name,
    oldSetup,
    newSetup,
    oldMonthly,
    newMonthly,
    message:
      `✅ *¡Precio del plan actualizado con éxito en la web!*\n\n` +
      `📌 *Plan modificado:* ${updated.name}\n` +
      `💵 *Setup inicial:* De ~${formatCOP(oldSetup)}~ a *${formatCOP(newSetup)}*\n` +
      `📅 *Mensualidad recurrente:* De ~${formatCOP(oldMonthly)}~ a *${formatCOP(newMonthly)}/mes*\n\n` +
      `🚀 *Efecto inmediato:* La página web principal, el cotizador y el bot de WhatsApp ya ofrecen este nuevo importe oficial en tiempo real.`,
  };
}

/**
 * 3. Modifica el precio de un módulo adicional en la web
 */
export async function changeModulePrice(params: {
  moduleQuery: string;
  setupPrice?: number;
  monthlyPrice?: number;
}): Promise<PriceUpdateResult> {
  const { moduleQuery, setupPrice, monthlyPrice } = params;
  const q = moduleQuery.trim().toLowerCase();

  const modules = await prisma.serviceModule.findMany();
  const matched = modules.find(
    (m) =>
      m.code.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      q.includes(m.code.toLowerCase()) ||
      q.includes(m.name.toLowerCase())
  );

  if (!matched) {
    return {
      success: false,
      message: `No encontré ningún módulo adicional que coincida con "${moduleQuery}".`,
    };
  }

  const oldSetup = matched.setupPrice;
  const oldMonthly = matched.recurringPrice;
  const newSetup = setupPrice !== undefined ? setupPrice : oldSetup;
  const newMonthly = monthlyPrice !== undefined ? monthlyPrice : oldMonthly;

  const updated = await prisma.serviceModule.update({
    where: { id: matched.id },
    data: {
      setupPrice: newSetup,
      recurringPrice: newMonthly,
    },
  });

  return {
    success: true,
    planName: updated.name,
    oldSetup,
    newSetup,
    oldMonthly,
    newMonthly,
    message:
      `✅ *¡Módulo adicional actualizado en la web!*\n\n` +
      `🧩 *Módulo:* ${updated.name}\n` +
      `💵 *Setup:* De ~${formatCOP(oldSetup)}~ a *${formatCOP(newSetup)}*\n` +
      `📅 *Mensualidad:* De ~${formatCOP(oldMonthly)}~ a *${formatCOP(newMonthly)}/mes*\n\n` +
      `El cotizador dinámico de la web ya refleja este ajuste.`,
  };
}

/**
 * 4. Calcula un desglose ejecutivo de cotización con análisis de margen para Edier
 */
export async function calculateExecutiveQuote(params: {
  clientSector: string;
  planName: string;
  modulesCount: number;
  discountPct?: number;
}): Promise<string> {
  const { clientSector, planName, modulesCount, discountPct = 0 } = params;

  // Precios base estimados
  let baseSetup = 3800000;
  let baseMonthly = 480000;

  const lowerPlan = planName.toLowerCase();
  if (lowerPlan.includes('basico') || lowerPlan.includes('básico') || lowerPlan.includes('estandar')) {
    baseSetup = 2200000;
    baseMonthly = 280000;
  } else if (lowerPlan.includes('enterprise') || lowerPlan.includes('corporativo')) {
    baseSetup = 6500000;
    baseMonthly = 850000;
  }

  const moduleSetupTotal = modulesCount * 650000;
  const moduleMonthlyTotal = modulesCount * 90000;

  const subtotalSetup = baseSetup + moduleSetupTotal;
  const subtotalMonthly = baseMonthly + moduleMonthlyTotal;

  const discountAmount = Math.round(subtotalSetup * (discountPct / 100));
  const finalSetup = subtotalSetup - discountAmount;

  // Análisis de costes y rentabilidad
  const estimatedHours = 35 + modulesCount * 8;
  const serverCostUSD = 25; // ~$100.000 COP/mes
  const estimatedMetaConversations = 1000;
  const metaCostCOP = Math.round(estimatedMetaConversations * 130); // ~$130.000 COP
  const totalDirectCostMonthly = 100000 + metaCostCOP;
  const netMonthlyProfit = subtotalMonthly - totalDirectCostMonthly;
  const grossMarginPercent = Math.round((netMonthlyProfit / subtotalMonthly) * 100);

  let reply = `📊 *ANÁLISIS DE COTIZACIÓN EJECUTIVA — EDMYSOFT*\n`;
  reply += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  reply += `🏢 *Sector / Cliente:* ${clientSector}\n`;
  reply += `📦 *Plan Recomendado:* ${planName.toUpperCase()}\n`;
  reply += `🧩 *Módulos adicionales:* ${modulesCount} módulo(s)\n\n`;

  reply += `💰 *DESGLOSE FINANCIERO COMERCIAL:*\n`;
  reply += `• Setup base: *${formatCOP(baseSetup)}*\n`;
  if (modulesCount > 0) {
    reply += `• Setup módulos (${modulesCount}): *${formatCOP(moduleSetupTotal)}*\n`;
  }
  if (discountPct > 0) {
    reply += `• Descuento comercial (${discountPct}%): *- ${formatCOP(discountAmount)}*\n`;
  }
  reply += `👉 *TOTAL SETUP A COBRAR: ${formatCOP(finalSetup)} COP*\n`;
  reply += `👉 *MENSUALIDAD SUGERIDA: ${formatCOP(subtotalMonthly)} COP/mes*\n\n`;

  reply += `📈 *ANÁLISIS DE RENTABILIDAD Y MÁRGENES (USO INTERNO):*\n`;
  reply += `• Horas estimadas de desarrollo: *~${estimatedHours} horas*\n`;
  reply += `• Costos directos de infraestructura: *~${formatCOP(totalDirectCostMonthly)}/mes* (VPS + Meta API)\n`;
  reply += `• Beneficio neto mensual estimado: *${formatCOP(netMonthlyProfit)}/mes*\n`;
  reply += `• Margen bruto operativo: *${grossMarginPercent}%*\n\n`;

  reply += `📝 *Propuesta de texto para copiar y enviar al cliente:*\n`;
  reply += `_"Hola! Para tu negocio en el sector de ${clientSector}, estructuramos una solución llave en mano con arquitectura dedicada de software y automatización IA. La inversión es de ${formatCOP(finalSetup)} de implementación inicial (incluye configuración total y pruebas) y ${formatCOP(subtotalMonthly)}/mes de mantenimiento, actualizaciones y soporte prioritario. ¿Cuándo te viene bien coordinar la videollamada para iniciar?"_`;

  return reply;
}

/**
 * 4.5 Renombra un plan oficial en la base de datos y la web
 */
export async function renamePlan(params: {
  planQuery: string;
  newName: string;
}): Promise<{ success: boolean; message: string }> {
  const { planQuery, newName } = params;
  const q = planQuery.trim().toLowerCase();
  const plans = await prisma.plan.findMany();
  let matchedPlan = plans.find(
    (p) =>
      p.slug.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      q.includes(p.slug.toLowerCase()) ||
      q.includes(p.name.toLowerCase())
  );
  if (!matchedPlan) {
    if (q.includes('basico') || q.includes('básico') || q.includes('estandar') || q.includes('estándar')) {
      matchedPlan = plans.find((p) => p.slug.includes('estandar') || p.slug.includes('basico') || p.name.toLowerCase().includes('básico'));
    } else if (q.includes('plus') || q.includes('crecimiento')) {
      matchedPlan = plans.find((p) => p.slug.includes('plus') || p.name.toLowerCase().includes('plus'));
    } else if (q.includes('enterprise') || q.includes('avanzado') || q.includes('corporativo') || q.includes('empresarial')) {
      matchedPlan = plans.find((p) => p.slug.includes('enterprise') || p.name.toLowerCase().includes('enterprise') || p.name.toLowerCase().includes('empresarial'));
    }
  }

  if (!matchedPlan) {
    return {
      success: false,
      message: `No encontré ningún plan que coincida con "${planQuery}". Los planes actuales son:\n${plans.map((p) => `• ${p.name}`).join('\n')}`,
    };
  }

  const oldName = matchedPlan.name;
  const cleanNewName = newName.replace(/["'*]/g, '').trim();

  const updated = await prisma.plan.update({
    where: { id: matchedPlan.id },
    data: { name: cleanNewName, updatedAt: new Date() },
  });

  return {
    success: true,
    message:
      `✅ *¡Nombre del plan actualizado en la web!*\n\n` +
      `• *Plan anterior:* ~${oldName}~\n` +
      `• *Nuevo nombre oficial:* *${updated.name}*\n` +
      `• *Setup actual:* ${formatCOP(updated.setupPrice)}\n` +
      `• *Mensualidad actual:* ${formatCOP(updated.recurringPrice)}/mes\n\n` +
      `🚀 *Efecto en vivo:* Ya aparece actualizado en la página web principal, en el cotizador dinámico y en las respuestas del bot.`,
  };
}

/**
 * 4.6 Actualiza textos de la página web (Hero, Subtítulo, etc.)
 */
export async function updateWebsiteContent(params: {
  title?: string;
  subtitle?: string;
}): Promise<{ success: boolean; message: string }> {
  const heroSection = await prisma.pageSection.findFirst({
    where: { sectionKey: 'hero' },
  });

  if (!heroSection) {
    return { success: false, message: 'No se encontró la sección principal (hero) en la base de datos.' };
  }

  const dataToUpdate: any = {};
  if (params.title) dataToUpdate.title = params.title.trim();
  if (params.subtitle) dataToUpdate.subtitle = params.subtitle.trim();

  const updated = await prisma.pageSection.update({
    where: { id: heroSection.id },
    data: dataToUpdate,
  });

  return {
    success: true,
    message:
      `✅ *¡Contenido de la página web actualizado!*\n\n` +
      (params.title ? `📌 *Nuevo Título:* "${updated.title}"\n` : '') +
      (params.subtitle ? `📝 *Nuevo Subtítulo:* "${updated.subtitle}"\n` : '') +
      `\n🌐 Los cambios ya están reflejados en vivo en la plataforma.`,
  };
}

/**
 * 4.7 Activa o pausa un plan en la web
 */
export async function togglePlanStatus(planQuery: string, active: boolean): Promise<{ success: boolean; message: string }> {
  const q = planQuery.trim().toLowerCase();
  const plans = await prisma.plan.findMany();
  const matchedPlan = plans.find(
    (p) =>
      p.slug.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      q.includes(p.slug.toLowerCase()) ||
      q.includes(p.name.toLowerCase())
  );

  if (!matchedPlan) {
    return { success: false, message: `No encontré el plan "${planQuery}".` };
  }

  const updated = await prisma.plan.update({
    where: { id: matchedPlan.id },
    data: { isActive: active, updatedAt: new Date() },
  });

  return {
    success: true,
    message: `✅ El plan *${updated.name}* ha sido ${active ? '*activado*' : '*pausado/desactivado*'} en la web con éxito.`,
  };
}

/**
 * 5. Intérprete maestro de comandos de texto enviados por Edier vía WhatsApp
 */
export async function executeDirectorWebCommand(text: string): Promise<{ matched: boolean; reply: string }> {
  const lower = text.toLowerCase();

  // A. Ver catálogo de precios
  if (
    /\b(muestra|ver|consultar|cuales son|lista|dime)\b/i.test(lower) &&
    /\b(precios|planes|tarifas|catalogo|costos)\b/i.test(lower)
  ) {
    const overview = await getCurrentWebsiteOverview();
    return { matched: true, reply: overview };
  }

  // B. Renombrar un plan
  // Ej: "cambia el nombre del plan inicial a plan starter"
  // "renombra el plan basico como plan emprendedor"
  const renameMatch = lower.match(/(?:cambia|cambiar|actualiza|actualizar|modifica|modificar|renombra|renombrar|ponle)\s+(?:el\s+)?nombre\s+(?:del?|al?)\s+plan\s+([^\s]+(?:\s+[^\s]+)?)\s+(?:a|por|como)\s+(.+)/i);
  if (renameMatch) {
    const targetPlanQuery = renameMatch[1].trim();
    const newName = renameMatch[2].trim();
    const result = await renamePlan({ planQuery: targetPlanQuery, newName });
    return { matched: true, reply: result.message };
  }

  // C. Cambiar título o subtítulo de la web
  // Ej: "cambia el titulo de la pagina a Software de IA y Automatización"
  const titleMatch = text.match(/(?:cambia|cambiar|actualiza|actualizar|pon)\s+(?:el\s+)?t[ií]tulo\s+(?:de\s+la\s+(?:pagina|web|inicio|hero))?\s*(?:a|por|:)\s*(.+)/i);
  if (titleMatch) {
    const newTitle = titleMatch[1].trim().replace(/^["']|["']$/g, '');
    const result = await updateWebsiteContent({ title: newTitle });
    return { matched: true, reply: result.message };
  }

  const subtitleMatch = text.match(/(?:cambia|cambiar|actualiza|actualizar|pon)\s+(?:el\s+)?subt[ií]tulo\s+(?:de\s+la\s+(?:pagina|web|inicio|hero))?\s*(?:a|por|:)\s*(.+)/i);
  if (subtitleMatch) {
    const newSubtitle = subtitleMatch[1].trim().replace(/^["']|["']$/g, '');
    const result = await updateWebsiteContent({ subtitle: newSubtitle });
    return { matched: true, reply: result.message };
  }

  // D. Activar o pausar plan
  if (/\b(desactiva|pausa|oculta)\s+(?:el\s+)?plan\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)/i.test(lower)) {
    const match = lower.match(/\b(?:desactiva|pausa|oculta)\s+(?:el\s+)?plan\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)/i);
    if (match) {
      const result = await togglePlanStatus(match[1].trim(), false);
      return { matched: true, reply: result.message };
    }
  }

  if (/\b(activa|muestra|publica)\s+(?:el\s+)?plan\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)/i.test(lower)) {
    const match = lower.match(/\b(?:activa|muestra|publica)\s+(?:el\s+)?plan\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)/i);
    if (match) {
      const result = await togglePlanStatus(match[1].trim(), true);
      return { matched: true, reply: result.message };
    }
  }

  // E. Poner un plan más caro / más costoso (con o sin número)
  // Ej: "pon el plan plus mas caro", "haz el plan basico mas costoso"
  const isAskingExpensive = /\b(pon|haz|sube|coloca)\s+(?:el\s+)?plan\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?)\s+(?:m[aá]s\s+(?:caro|costoso|alto))/i.test(lower);
  if (isAskingExpensive) {
    const match = lower.match(/\b(?:pon|haz|sube|coloca)\s+(?:el\s+)?plan\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?)\s+(?:m[aá]s\s+(?:caro|costoso|alto))/i);
    const targetPlanQuery = match ? match[1].trim() : 'plus';

    // Extraer si especificó número, o aumentar 25% por defecto
    const rawNumbers = text.match(/\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b|\b\d{6,8}\b/g) || [];
    const parsedNumbers = rawNumbers
      .map((numStr) => parseInt(numStr.replace(/[.,]/g, ''), 10))
      .filter((n) => !isNaN(n) && n >= 50000);

    if (parsedNumbers.length > 0) {
      const result = await changePlanPrice({ planQuery: targetPlanQuery, setupPrice: parsedNumbers[0] });
      return { matched: true, reply: result.message };
    } else {
      // Aumentar un 25% el setup actual
      const plans = await prisma.plan.findMany();
      const p = plans.find((x) => x.name.toLowerCase().includes(targetPlanQuery) || x.slug.toLowerCase().includes(targetPlanQuery));
      if (p) {
        const newSetup = Math.round((p.setupPrice * 1.25) / 10000) * 10000;
        const newMonthly = Math.round((p.recurringPrice * 1.2) / 10000) * 10000;
        const result = await changePlanPrice({ planQuery: targetPlanQuery, setupPrice: newSetup, monthlyPrice: newMonthly });
        return {
          matched: true,
          reply:
            `📈 *¡Plan ajustado a un rango superior más rentable!*\n\n` +
            `Como me pediste poner el plan *${p.name}* más caro, incrementé el setup en +25% y la mensualidad en +20%:\n\n` +
            `• *Setup inicial:* De ~${formatCOP(p.setupPrice)}~ a *${formatCOP(newSetup)}*\n` +
            `• *Mensualidad:* De ~${formatCOP(p.recurringPrice)}~ a *${formatCOP(newMonthly)}/mes*\n\n` +
            `✅ Actualizado de inmediato en la web y en el bot de ventas. Si quieres una cifra específica, solo dímelo (ej: _"pon el plan ${p.name} a ${formatCOP(newSetup + 500000)}"_).`,
        };
      }
    }
  }

  // F. Cambiar precio de un plan o módulo
  // Ejemplos: "cambia el precio del plan plus a 3500000 setup y 450000 mensual"
  // "cambiar precio plan basico a 2000000"
  // "sube el precio del plan enterprise a 7.000.000"
  // "pon el plan estandar a 2.500.000"
  if (
    /\b(cambia|cambiar|actualiza|actualizar|modifica|modificar|pon|sube|baja)\b/i.test(lower) &&
    (/\b(precio|precios|tarifa|valor|setup|mensualidad)\b/i.test(lower) || /\b\d{6,8}\b|\b\d{1,3}(?:[.,]\d{3})+\b/.test(text)) &&
    /\b(plan|modulo|módulo|servicio|estandar|estándar|plus|enterprise|landing)\b/i.test(lower)
  ) {
    // Detectar si es plan o módulo
    const isModule = /\b(modulo|módulo)\b/i.test(lower);

    // Extraer nombre del plan o módulo
    let targetName = 'plus';
    if (/\b(basico|básico|estandar|estándar)\b/i.test(lower)) targetName = 'básico';
    else if (/\b(enterprise|corporativo|avanzado|empresarial)\b/i.test(lower)) targetName = 'enterprise';
    else if (/\b(plus|crecimiento)\b/i.test(lower)) targetName = 'plus';
    else if (/\b(landing|corporativo|ecommerce|flotas)\b/i.test(lower)) {
      const match = lower.match(/\b(landing|corporativo|ecommerce|flotas)\b/i);
      if (match) targetName = match[1];
    } else if (/\b(inmobiliaria|restaurante|clinica|abogados)\b/i.test(lower)) {
      const match = lower.match(/\b(inmobiliaria|restaurante|clinica|abogados)\b/i);
      if (match) targetName = match[1];
    }

    // Extraer números (precios)
    const rawNumbers = text.match(/\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b|\b\d{6,8}\b/g) || [];
    const parsedNumbers = rawNumbers
      .map((numStr) => parseInt(numStr.replace(/[.,]/g, ''), 10))
      .filter((n) => !isNaN(n) && n >= 50000); // al menos $50.000

    let setupPrice: number | undefined = undefined;
    let monthlyPrice: number | undefined = undefined;

    if (parsedNumbers.length === 1) {
      if (/\b(mes|mensual|mensualidad|recurrente)\b/i.test(lower) && !/\b(setup|inicial)\b/i.test(lower)) {
        monthlyPrice = parsedNumbers[0];
      } else {
        setupPrice = parsedNumbers[0];
      }
    } else if (parsedNumbers.length >= 2) {
      if (parsedNumbers[0] > parsedNumbers[1]) {
        setupPrice = parsedNumbers[0];
        monthlyPrice = parsedNumbers[1];
      } else {
        monthlyPrice = parsedNumbers[0];
        setupPrice = parsedNumbers[1];
      }
    }

    if (setupPrice === undefined && monthlyPrice === undefined) {
      return {
        matched: true,
        reply: `⚠️ Entendí que deseas cambiar un precio, pero no logré identificar el importe en pesos. Por favor indícamelo claramente, por ejemplo: _"Cambia el precio del Plan Plus a 3.500.000 setup y 500.000 mensual"_`,
      };
    }

    if (isModule) {
      const result = await changeModulePrice({ moduleQuery: targetName, setupPrice, monthlyPrice });
      return { matched: true, reply: result.message };
    } else {
      const result = await changePlanPrice({ planQuery: targetName, setupPrice, monthlyPrice });
      return { matched: true, reply: result.message };
    }
  }

  // G. Calcular cotización y análisis de rentabilidad
  if (
    /\b(calcula|calcular|cotiza|cotizar|cuanto cobrar|desglose|presupuesto)\b/i.test(lower) &&
    /\b(cotizacion|cotización|cliente|proyecto|para|descuento|margen)\b/i.test(lower)
  ) {
    let clientSector = 'Negocio General / Empresa';
    if (/\b(restaurante|comida|gastronomia)\b/i.test(lower)) clientSector = 'Restaurante / Gastronomía';
    else if (/\b(inmobiliaria|bienes raices|propiedades)\b/i.test(lower)) clientSector = 'Inmobiliaria / Bienes Raíces';
    else if (/\b(clinica|consultorio|medico|odontologia|salud)\b/i.test(lower)) clientSector = 'Clínica / Sector Salud';
    else if (/\b(tienda|ecommerce|comercio|ropa)\b/i.test(lower)) clientSector = 'Tienda Online / E-Commerce';
    else if (/\b(abogados|legal|firma|asesoria)\b/i.test(lower)) clientSector = 'Firma Legal / Consultoría';

    let planName = 'Plan Plus (Recomendado)';
    if (/\b(basico|básico|estandar|estándar)\b/i.test(lower)) planName = 'Plan Básico';
    else if (/\b(enterprise|corporativo|grande)\b/i.test(lower)) planName = 'Plan Enterprise';

    const modMatch = lower.match(/(\d+)\s*m[oó]dulo/i);
    const modulesCount = modMatch ? parseInt(modMatch[1], 10) : 1;

    const discMatch = lower.match(/(\d+)\s*%\s*(?:de\s*)?descuento/i);
    const discountPct = discMatch ? parseInt(discMatch[1], 10) : 0;

    const analysis = await calculateExecutiveQuote({
      clientSector,
      planName,
      modulesCount,
      discountPct,
    });

    return { matched: true, reply: analysis };
  }

  return { matched: false, reply: '' };
}
