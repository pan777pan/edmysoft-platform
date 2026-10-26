import prisma from './prisma';
import { notifyOwner } from './whatsapp-baileys';
import { loadAIConfig } from './ai-config';

const BOGOTA_OFFSET_MS = -5 * 3600 * 1000;

function getBogotaDayBounds(d: Date = new Date()) {
  const bogotaTime = new Date(d.getTime() + BOGOTA_OFFSET_MS);
  const yyyy = bogotaTime.getUTCFullYear();
  const mm = String(bogotaTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(bogotaTime.getUTCDate()).padStart(2, '0');

  // Rango UTC equivalente al día de Colombia (UTC-5)
  const startUTC = new Date(`${yyyy}-${mm}-${dd}T05:00:00.000Z`);
  const endUTC = new Date(startUTC.getTime() + 24 * 3600 * 1000 - 1);
  const dateFormatted = `${dd}/${mm}/${yyyy}`;

  return { startUTC, endUTC, dateFormatted };
}

export interface DailyReportData {
  date: string;
  totalConversationsToday: number;
  totalMessagesToday: number;
  hotLeads: Array<{
    name: string;
    phone: string;
    need: string;
    service: string;
    budget: string | null;
  }>;
  followUpLeads: Array<{
    name: string;
    phone: string;
    channel: string;
  }>;
  meetings: Array<{
    clientName: string;
    time: string;
    topic: string;
    modality: string;
  }>;
  quotesCount: number;
  textReport: string;
}

/**
 * Genera el informe consolidado del día.
 */
export async function generateDailyReport(date: Date = new Date()): Promise<DailyReportData> {
  const { startUTC, endUTC, dateFormatted } = getBogotaDayBounds(date);

  // 1. Mensajes del día
  const totalMessagesToday = await prisma.message.count({
    where: { createdAt: { gte: startUTC, lte: endUTC } },
  }).catch(() => 0);

  // 2. Conversaciones activas hoy
  const conversationsToday = await prisma.conversation.findMany({
    where: { lastMessageAt: { gte: startUTC, lte: endUTC } },
    include: { contact: true },
  }).catch(() => []);

  // 3. Oportunidades / Leads captados hoy
  const oppsToday = await prisma.opportunity.findMany({
    where: { updatedAt: { gte: startUTC, lte: endUTC } },
    include: { contact: true },
    orderBy: { updatedAt: 'desc' },
  }).catch(() => []);

  const hotLeads: DailyReportData['hotLeads'] = [];
  const followUpLeads: DailyReportData['followUpLeads'] = [];

  for (const opp of oppsToday) {
    const isHot = opp.stage === 'CALIFICADO' || opp.stage === 'PROPUESTA' || opp.stage === 'NEGOCIACION';
    const entry = {
      name: opp.contact?.fullName || opp.title || 'Prospecto sin nombre',
      phone: opp.contact?.phone || opp.contact?.email || 'Sin teléfono',
      need: opp.identifiedNeed || 'Interés general en automatización',
      service: opp.serviceInterest || 'IA / Software',
      budget: opp.targetBudget ? `$${opp.targetBudget.toLocaleString('es-CO')} COP` : null,
    };
    if (isHot) hotLeads.push(entry);
    else followUpLeads.push({ name: entry.name, phone: entry.phone, channel: opp.contact?.preferredChannel || 'WHATSAPP' });
  }

  // 4. Contactos nuevos creados hoy que aún no tienen oportunidad
  const contactsToday = await prisma.contact.findMany({
    where: {
      createdAt: { gte: startUTC, lte: endUTC },
      opportunities: { none: {} },
    },
  }).catch(() => []);

  for (const c of contactsToday) {
    followUpLeads.push({
      name: c.fullName,
      phone: c.phone || c.email || 'Sin contacto',
      channel: c.preferredChannel,
    });
  }

  // 5. Citas agendadas hoy
  const meetingLogs = await prisma.activityLog.findMany({
    where: {
      action: 'MEETING_SCHEDULED',
      createdAt: { gte: startUTC, lte: endUTC },
    },
  }).catch(() => []);

  const meetings: DailyReportData['meetings'] = [];
  for (const log of meetingLogs) {
    try {
      const d = JSON.parse(log.details || '{}');
      meetings.push({
        clientName: d.clientName || 'Cliente',
        time: `${d.date} a las ${d.time}`,
        topic: d.topic || 'Sesión diagnóstica',
        modality: d.modality || (d.topic?.toLowerCase().includes('presencial') ? 'Presencial' : 'Virtual (Google Meet)'),
      });
    } catch {
      /* ignorar registros corruptos */
    }
  }

  // 6. Cotizaciones solicitadas hoy
  const quotesCount = await prisma.activityLog.count({
    where: {
      action: { in: ['AI_QUOTE_INTERACTION', 'QUOTE_GENERATED'] },
      createdAt: { gte: startUTC, lte: endUTC },
    },
  }).catch(() => 0);

  // Construcción del texto en WhatsApp con negritas limpias
  const lines = [
    `📊 *INFORME DIARIO COMERCIAL — EDMYSOFT*`,
    `🗓️ *Fecha:* ${dateFormatted} · 06:00 p. m. (Colombia)`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🔥 *PROSPECTOS INTERESADOS HOY (${hotLeads.length}):*`,
  ];

  if (hotLeads.length > 0) {
    hotLeads.slice(0, 8).forEach((h) => {
      lines.push(`• *${h.name}* (${h.phone})`);
      lines.push(`  🎯 *Interés:* ${h.service} — ${h.need}`);
      if (h.budget) lines.push(`  💰 *Presupuesto:* ${h.budget}`);
    });
  } else {
    lines.push(`_No se registraron prospectos calificados hoy._`);
  }

  lines.push(``);
  lines.push(`❄️ *PROSPECTOS EN SEGUIMIENTO / NUEVOS (${followUpLeads.length}):*`);
  if (followUpLeads.length > 0) {
    followUpLeads.slice(0, 6).forEach((f) => {
      lines.push(`• ${f.name} (${f.phone}) — Canal: ${f.channel}`);
    });
  } else {
    lines.push(`_Sin nuevos contactos fríos._`);
  }

  lines.push(``);
  lines.push(`📅 *CITAS AGENDADAS HOY (${meetings.length}):*`);
  if (meetings.length > 0) {
    meetings.forEach((m) => {
      lines.push(`• *${m.clientName}*: ${m.time}`);
      lines.push(`  📌 *Modalidad:* ${m.modality} · Tema: ${m.topic}`);
    });
  } else {
    lines.push(`_No se agendaron reuniones hoy._`);
  }

  lines.push(``);
  lines.push(`📈 *MÉTRICAS DEL DÍA:*`);
  lines.push(`• Conversaciones activas: *${conversationsToday.length}*`);
  lines.push(`• Mensajes procesados: *${totalMessagesToday}*`);
  lines.push(`• Cotizaciones solicitadas: *${quotesCount}*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`_Reporte automático enviado a Edier Mery Gallego (+57 323 416 6354)_`);

  const textReport = lines.join('\n');

  return {
    date: dateFormatted,
    totalConversationsToday: conversationsToday.length,
    totalMessagesToday,
    hotLeads,
    followUpLeads,
    meetings,
    quotesCount,
    textReport,
  };
}

/**
 * Envía el informe diario consolidado al WhatsApp del dueño.
 */
export async function sendDailyReportToOwner(): Promise<{ success: boolean; message: string; report?: DailyReportData }> {
  try {
    const report = await generateDailyReport();
    const sent = await notifyOwner(report.textReport);

    if (sent) {
      await prisma.activityLog.create({
        data: {
          action: 'DAILY_REPORT_SENT',
          entityType: 'REPORT',
          entityId: `REPORT-${Date.now()}`,
          details: JSON.stringify({
            hotLeadsCount: report.hotLeads.length,
            meetingsCount: report.meetings.length,
            totalConversations: report.totalConversationsToday,
          }),
        },
      }).catch(() => {});
      return { success: true, message: 'Informe enviado con éxito a tu WhatsApp.', report };
    }
    return {
      success: false,
      message: 'No se pudo enviar por WhatsApp: verifica que el código QR esté conectado en /admin/whatsapp.',
      report,
    };
  } catch (err: any) {
    return { success: false, message: `Error generando informe: ${err?.message || err}` };
  }
}

// Singleton de ejecución del cron diario a las 6:00 PM (18:00 Colombia)
declare global {
  // eslint-disable-next-line no-var
  var __edmysoft_daily_report_timer: NodeJS.Timeout | undefined;
  // eslint-disable-next-line no-var
  var __edmysoft_last_report_sent_date: string | undefined;
}

export function startDailyReportScheduler() {
  if (global.__edmysoft_daily_report_timer) return;

  global.__edmysoft_daily_report_timer = setInterval(async () => {
    try {
      const now = new Date();
      // Formato hora militar en Colombia (UTC-5)
      const colTimeStr = now.toLocaleTimeString('en-US', { timeZone: 'America/Bogota', hour12: false });
      const colDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }); // YYYY-MM-DD
      const [hour, minute] = colTimeStr.split(':').map(Number);

      // Si son las 18:00 (6:00 PM) en Colombia y no se ha enviado hoy
      if (hour === 18 && minute >= 0 && minute <= 5 && global.__edmysoft_last_report_sent_date !== colDateStr) {
        console.log(`[DailyReportScheduler] 18:${String(minute).padStart(2, '0')} COL detectado. Despachando informe diario al WhatsApp de Edier...`);
        global.__edmysoft_last_report_sent_date = colDateStr;
        await sendDailyReportToOwner();
      }
    } catch (err) {
      console.error('[DailyReportScheduler] Error en ciclo:', err);
    }
  }, 60000);
}

// Inicializar automáticamente
startDailyReportScheduler();

