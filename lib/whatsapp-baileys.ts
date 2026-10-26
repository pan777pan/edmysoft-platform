import path from 'path';
import fs from 'fs';
import os from 'os';
import QRCode from 'qrcode';
import prisma from './prisma';
import { generateAIResponse } from './ai-engine';
import { loadAIConfig } from './ai-config';
import { isWhatsAppDemoActive, loadWhatsAppDemoConfig } from './whatsapp-demo';
import { isOwnerSender, handleDirectorCopilotMessage } from './director-copilot';

export function getBaileysAuthFolder(): string {
  const customPath = process.env.BAILEYS_AUTH_DIR;
  if (customPath) return customPath;

  const appData = process.env.LOCALAPPDATA || process.env.APPDATA || os.tmpdir();
  const targetDir = path.join(appData, 'edmysoft-baileys-auth');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    // Migrar credenciales existentes si había en .baileys_auth
    const oldDir = path.join(process.cwd(), '.baileys_auth');
    if (fs.existsSync(oldDir)) {
      try {
        fs.cpSync(oldDir, targetDir, { recursive: true });
      } catch {
        /* ignorar */
      }
    }
  }
  return targetDir;
}

export interface BaileysState {
  status: 'DISCONNECTED' | 'CONNECTING_QR' | 'CONNECTED' | 'ERROR';
  qrCode: string | null;
  phoneNumber: string | null;
  accountName: string | null;
  lastConnectedAt: Date | null;
  errorLog: string | null;
  autoReplyAI: boolean;
  autoCalendar: boolean;
}

// Singleton global para persistir la conexión Baileys entre peticiones en Next.js
declare global {
  // eslint-disable-next-line no-var
  var __edmysoft_baileys_instance: any;
  // eslint-disable-next-line no-var
  var __edmysoft_baileys_state: BaileysState | undefined;
}

if (!global.__edmysoft_baileys_state) {
  global.__edmysoft_baileys_state = {
    status: 'DISCONNECTED',
    qrCode: null,
    phoneNumber: null,
    accountName: null,
    lastConnectedAt: null,
    errorLog: null,
    autoReplyAI: true,
    autoCalendar: true,
  };
}

export function getBaileysState(): BaileysState {
  return global.__edmysoft_baileys_state!;
}

export function setBaileysSettings(settings: { autoReplyAI?: boolean; autoCalendar?: boolean }) {
  if (settings.autoReplyAI !== undefined) {
    global.__edmysoft_baileys_state!.autoReplyAI = settings.autoReplyAI;
  }
  if (settings.autoCalendar !== undefined) {
    global.__edmysoft_baileys_state!.autoCalendar = settings.autoCalendar;
  }
  return global.__edmysoft_baileys_state!;
}

// Cola por chat: garantiza que los mensajes de un mismo cliente se procesen en orden
const chatQueues = new Map<string, Promise<void>>();

/** WhatsApp usa *negrita* (un asterisco); convertimos el **markdown** del modelo y transformamos enlaces. */
function toWhatsAppFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1: $2');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Divide una respuesta larga en hasta 3 burbujas por párrafos, como escribiría una persona. */
function splitIntoBubbles(text: string): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length <= 1) return [text.trim()];
  const bubbles: string[] = [];
  for (const p of paragraphs) {
    const last = bubbles[bubbles.length - 1];
    if (last && (bubbles.length >= 3 || last.length + p.length < 120)) bubbles[bubbles.length - 1] = `${last}\n\n${p}`;
    else bubbles.push(p);
  }
  return bubbles;
}

// Almacén en memoria de IDs y textos de mensajes emitidos por el software/bot
// para distinguirlos de los mensajes que Edier escribe manualmente desde su teléfono
const botSentMessageIds = new Set<string>();
const botSentTexts = new Set<string>();

/** Registra y envía un mensaje desde el bot, recordando su ID y contenido para no hacer eco */
export async function sendBotMessage(sock: any, jid: string, content: { text: string }) {
  if (!sock) return null;
  const clean = content.text.trim();
  botSentTexts.add(clean);
  if (botSentTexts.size > 1000) {
    const [first] = botSentTexts;
    botSentTexts.delete(first);
  }

  const sent = await sock.sendMessage(jid, content);
  if (sent?.key?.id) {
    botSentMessageIds.add(sent.key.id);
    if (botSentMessageIds.size > 2000) {
      const [first] = botSentMessageIds;
      botSentMessageIds.delete(first);
    }
  }
  return sent;
}

/** Determina si un mensaje fue emitido por el sistema del bot o si fue escrito por Edier */
function isBotGeneratedMessage(msg: any, text: string): boolean {
  const msgId = msg.key?.id;
  if (msgId && botSentMessageIds.has(msgId)) return true;

  const clean = text.trim();
  if (!clean) return true;
  if (botSentTexts.has(clean)) return true;

  // Prefijos y firmas inequívocas de mensajes y notificaciones emitidas por el sistema
  const botSignatures = [
    '🔥 Lead caliente en EDMYSOFT',
    '🔥 *Lead caliente en EDMYSOFT*',
    '📅 Nueva reunión virtual agendada',
    '📅 *Nueva reunión virtual agendada*',
    '⚠️ Escalación a Asesor Humano',
    '⚠️ *Escalación a Asesor Humano*',
    '🤖 Alerta del Asistente',
    '🤖 *Alerta del Asistente*',
    '🫡 *¡Entendido a la perfección, Edier!*',
    '📊 *ANÁLISIS DE CHATS CON CLIENTES*',
    '📈 *ANÁLISIS DE COTIZACIÓN EJECUTIVA*',
    '🌐 *CATÁLOGO DE PRECIOS EN VIVO*',
    '✅ *¡Precio del plan actualizado con éxito en la web!*',
    '✅ *¡Módulo adicional actualizado en la web!*',
    '🧠 *Respuesta Estratégica para el Director:*',
    '¡Hola Edier! 👋',
    '✨ *¡Todo en orden, Edier!*',
    '🔧 *Análisis Técnico de la Plataforma EDMYSOFT:*',
    '💡 *Mi perspectiva ejecutiva, Edier:*',
    '🎯 *Estrategia Comercial para el Lead Reciente',
    'Edier, recibí tu mensaje:',
  ];

  if (botSignatures.some((sig) => clean.startsWith(sig))) return true;

  return false;
}

/**
 * Envía una alerta al WhatsApp del dueño (lead caliente, cita agendada, asesor humano).
 * Devuelve false si no hay sesión conectada o las alertas están desactivadas.
 */
export async function notifyOwner(text: string): Promise<boolean> {
  const cfg = loadAIConfig();
  const sock = global.__edmysoft_baileys_instance;
  if (!cfg.notifyOwner || !cfg.ownerWhatsApp || !sock || global.__edmysoft_baileys_state?.status !== 'CONNECTED') {
    return false;
  }
  try {
    const cleanOwner = cfg.ownerWhatsApp.replace(/\D/g, '');
    await sendBotMessage(sock, `${cleanOwner}@s.whatsapp.net`, { text });
    return true;
  } catch (err) {
    console.warn('No se pudo notificar al dueño:', err);
    return false;
  }
}

/**
 * Procesa un mensaje entrante: CRM → memoria de la conversación → agente IA → respuesta.
 */
async function handleIncomingMessage(
  sock: any,
  fromJid: string,
  incomingText: string,
  pushName: string | null,
  state: BaileysState
): Promise<void> {
  const isOwner =
    isOwnerSender(fromJid) ||
    fromJid.endsWith('@lid') ||
    fromJid.includes('110428222963765') ||
    fromJid === 'me' ||
    fromJid.includes('3234166354') ||
    isOwnerSender(fromJid.split('@')[0].split(':')[0]);

  let senderPhone = fromJid.split('@')[0].split(':')[0].replace(/\D/g, '');
  if (isOwner || !senderPhone) {
    senderPhone = '573234166354';
  }
  const senderName = pushName || (isOwner ? 'Edier Mery Gallego (Director)' : senderPhone);

  // 1. Contacto en el CRM
  let contact = await prisma.contact.findFirst({ where: { phone: senderPhone } });
  if (!contact) {
    contact = await prisma.contact.create({
      data: { fullName: senderName, phone: senderPhone, preferredChannel: 'WHATSAPP' },
    });
  } else if (pushName && contact.fullName === senderPhone) {
    contact = await prisma.contact.update({ where: { id: contact.id }, data: { fullName: pushName } });
  }

  // 2. Conversación
  let conversation = await prisma.conversation.findFirst({ where: { contactId: contact.id } });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { contactId: contact.id, channel: 'WHATSAPP', status: 'AI_HANDLING' },
    });
  }

  // 3. Memoria: historial de la sesión (se carga ANTES de guardar el mensaje actual)
  let previousMessages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // Si esta conversación es nueva o tiene pocos mensajes, consultar mensajes históricos del contacto
  if (previousMessages.length < 5) {
    const contactHistory = await prisma.message.findMany({
      where: { conversation: { contactId: contact.id } },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });
    if (contactHistory.length > previousMessages.length) {
      previousMessages = contactHistory;
    }
  }

  const history = previousMessages
    .reverse()
    .filter((msg) => msg.senderType !== 'SYSTEM')
    .map((msg) => ({
      role: (msg.senderType === 'CLIENT' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content,
    }));

  await prisma.message.create({
    data: { conversationId: conversation.id, senderType: 'CLIENT', senderName, content: incomingText },
  });

  // ===================================================================
  // 3.5 CANAL EXCLUSIVO DE DIRECCIÓN / COPILOTO PARA EDIER MERY GALLEGO
  // (+57 323 416 6354) — Solo y exclusivamente en su chat personal ("Yo / Tú").
  // Siempre responde de forma prioritaria, sin verse bloqueado por HUMAN_CONTROL ni autoReplyAI.
  // ===================================================================
  if (isOwner) {
    const targetJid = fromJid.endsWith('@lid') ? fromJid : '573234166354@s.whatsapp.net';
    console.log(`[Baileys Copilot] 📥 Mensaje de Edier en "Yo (Tú)": "${incomingText}" (destino: ${targetJid})`);

    try {
      await sock.sendPresenceUpdate('composing', targetJid);
    } catch {}

    const directorRes = await handleDirectorCopilotMessage(incomingText, history, senderPhone);
    const bubbles = splitIntoBubbles(directorRes.reply);
    for (let i = 0; i < bubbles.length; i++) {
      if (i > 0) {
        try {
          await sock.sendPresenceUpdate('composing', targetJid);
        } catch {}
        await sleep(Math.min(1800, 500 + bubbles[i].length * 12));
      }
      console.log(`[Baileys Copilot] 📤 Enviando respuesta a Edier burbuja ${i + 1}/${bubbles.length}: "${bubbles[i].slice(0, 60)}..."`);
      try {
        await sendBotMessage(sock, targetJid, { text: bubbles[i] });
      } catch (sendErr: any) {
        console.warn(`[Baileys Copilot] Error enviando a ${targetJid}: ${sendErr?.message}. Reintentando con s.whatsapp.net`);
        if (targetJid !== '573234166354@s.whatsapp.net') {
          await sendBotMessage(sock, '573234166354@s.whatsapp.net', { text: bubbles[i] });
        }
      }
    }
    try {
      await sock.sendPresenceUpdate('paused', targetJid);
    } catch {}

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'AI',
        senderName: 'Copiloto de Dirección (IA)',
        content: directorRes.reply,
        rawPayload: JSON.stringify({ model: directorRes.modelUsed, intent: directorRes.intent }),
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    return; // TERMINA: Jamás ejecuta el flujo de ventas con Edier
  }

  // Control humano o agente desactivado: no responder automáticamente a clientes
  if (conversation.status === 'HUMAN_CONTROL' || !state.autoReplyAI) return;

  // 4. Indicador "escribiendo..." mientras el agente piensa
  try {
    await sock.sendPresenceUpdate('composing', fromJid);
  } catch {
    /* no crítico */
  }

  // 5. Agente de IA con memoria y herramientas (o Modo Demo si está activo)
  const demoActive = isWhatsAppDemoActive();
  const demoConfig = demoActive ? loadWhatsAppDemoConfig() : null;

  const aiResult = await generateAIResponse(incomingText, history, {
    channel: 'WHATSAPP',
    contactName: contact.fullName,
    contactPhone: senderPhone,
    contactEmail: contact.email,
    conversationId: conversation.id,
    contactId: contact.id,
    clientIdentifier: senderPhone,
    allowScheduling: state.autoCalendar,
    demoConfig,
  });

  // Respuesta en burbujas cortas con pausa de "escribiendo..." proporcional al largo
  const bubbles = splitIntoBubbles(toWhatsAppFormat(aiResult.reply));
  for (let i = 0; i < bubbles.length; i++) {
    if (i > 0) {
      try {
        await sock.sendPresenceUpdate('composing', fromJid);
      } catch {
        /* no crítico */
      }
      await sleep(Math.min(1800, 500 + bubbles[i].length * 12));
    }
    const targetJid = fromJid.includes(':')
      ? `${fromJid.split('@')[0].split(':')[0]}@s.whatsapp.net`
      : fromJid;
    await sendBotMessage(sock, targetJid, { text: bubbles[i] });
  }
  try {
    await sock.sendPresenceUpdate('paused', fromJid);
  } catch {
    /* no crítico */
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderType: 'AI',
      senderName: 'EDMYSOFT Atiende (IA)',
      content: aiResult.reply,
      rawPayload: JSON.stringify({ model: aiResult.modelUsed, tools: aiResult.toolsUsed || [] }),
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      // Si el cliente pidió un asesor, pasa a control humano (el bot deja de responder)
      ...(aiResult.detectedIntent === 'HUMAN_TAKEOVER' ? { status: 'HUMAN_CONTROL' } : {}),
    },
  });
}

/**
 * Inicia el socket real de Baileys conectando a los servidores de WhatsApp Web.
 * Genera el QR real para vincular dispositivos con WhatsApp Business o WhatsApp estándar.
 *
 * Manejo de cierres (códigos de DisconnectReason):
 * - 515 restartRequired: normal justo después de escanear el QR → se recrea el socket.
 * - 401 loggedOut / 500 badSession / 411 / 403: la sesión guardada ya no sirve → se borra
 *   y, si nunca llegó a abrirse, se genera automáticamente un QR nuevo (una vez).
 * - 408 sin haber abierto: el QR expiró sin escanearse → se detiene y se pide generar otro.
 * - 440 connectionReplaced: la sesión se abrió en otro lugar → no se reconecta.
 * - Otros (428, 408 con sesión abierta, 503): reconexión con espera progresiva (máx. 5).
 */
declare global {
  // eslint-disable-next-line no-var
  var __edmysoft_baileys_gen: number | undefined;
  // eslint-disable-next-line no-var
  var __edmysoft_baileys_retries: number | undefined;
  // eslint-disable-next-line no-var
  var __edmysoft_baileys_starting: Promise<BaileysState> | null | undefined;
}

const MAX_RECONNECT_ATTEMPTS = 5;

const DISCONNECT_REASON_TEXT: Record<number, string> = {
  401: 'sesión cerrada desde el teléfono o expirada',
  403: 'acceso denegado por WhatsApp',
  408: 'tiempo de espera agotado',
  411: 'versión multidispositivo incompatible',
  428: 'conexión cerrada por el servidor',
  440: 'la sesión se abrió en otro dispositivo o navegador',
  500: 'sesión corrupta',
  503: 'servicio de WhatsApp no disponible',
  515: 'reinicio requerido',
};

function wipeBaileysAuth() {
  for (const dir of [getBaileysAuthFolder(), path.join(process.cwd(), '.baileys_auth')]) {
    try {
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    } catch (err) {
      console.error('[Baileys] No se pudo borrar la carpeta de sesión', dir, err);
    }
  }
}

function endCurrentSocket() {
  const sock = global.__edmysoft_baileys_instance;
  global.__edmysoft_baileys_instance = null;
  if (!sock) return;
  try {
    sock.end(undefined);
  } catch {
    /* el socket ya estaba cerrado */
  }
}

async function syncConnectionRow(data: Record<string, unknown>) {
  try {
    await prisma.whatsAppConnection.updateMany({ data });
  } catch (err) {
    console.error('[Baileys] No se pudo sincronizar whatsAppConnection:', err);
  }
}

export async function startBaileysSocket(opts: { force?: boolean; note?: string } = {}): Promise<BaileysState> {
  const state = global.__edmysoft_baileys_state!;

  // Si ya está conectado, retornar estado actual
  if (state.status === 'CONNECTED' && global.__edmysoft_baileys_instance) {
    return state;
  }
  // Ya hay un socket esperando el escaneo: no crear otro (evita sockets duplicados que se pisan)
  if (!opts.force && state.status === 'CONNECTING_QR' && global.__edmysoft_baileys_instance) {
    return state;
  }
  // Dos clics seguidos: reutilizar el arranque en curso
  if (global.__edmysoft_baileys_starting) {
    return global.__edmysoft_baileys_starting;
  }

  const run = async (): Promise<BaileysState> => {
    try {
      const {
        default: makeWASocket,
        useMultiFileAuthState,
        DisconnectReason,
        fetchLatestBaileysVersion,
      } = await import('@whiskeysockets/baileys');

      // Cerrar cualquier socket previo e invalidar sus eventos
      endCurrentSocket();
      const gen = (global.__edmysoft_baileys_gen ?? 0) + 1;
      global.__edmysoft_baileys_gen = gen;
      const isCurrent = () => global.__edmysoft_baileys_gen === gen;

      const authFolder = getBaileysAuthFolder();
      const { state: authState, saveCreds } = await useMultiFileAuthState(authFolder);

      let version = [2, 3000, 1015901307] as [number, number, number];
      try {
        const versionPromise = fetchLatestBaileysVersion();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Version timeout')), 1500)
        );
        const v = (await Promise.race([versionPromise, timeoutPromise])) as any;
        if (v?.version) version = v.version;
      } catch {
        // Fallback ultrarrápido a versión estándar estable
      }

      let logger: any = undefined;
      try {
        const pino = (await import('pino')).default;
        logger = pino({ level: 'silent' });
      } catch {
        // Sin logger
      }

      state.status = 'CONNECTING_QR';
      state.qrCode = null;
      state.errorLog = opts.note || null;

      const sock = makeWASocket({
        version,
        auth: authState,
        printQRInTerminal: false,
        logger,
        browser: ['EDMYSOFT Atiende', 'Chrome', '124.0.0.0'],
        syncFullHistory: false,
      });

      global.__edmysoft_baileys_instance = sock;
      let opened = false;

      sock.ev.on('creds.update', async () => {
        if (!isCurrent()) return;
        try {
          await saveCreds();
        } catch (err) {
          console.error('[Baileys] Error guardando credenciales:', err);
        }
      });

      sock.ev.on('connection.update', async (update) => {
        if (!isCurrent()) return; // evento de un socket antiguo
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrDataUrl = await QRCode.toDataURL(qr, {
              margin: 2,
              scale: 8,
              color: { dark: '#070b14', light: '#ffffff' },
            });
            if (!isCurrent()) return;
            state.status = 'CONNECTING_QR';
            state.qrCode = qrDataUrl;
            state.errorLog = null;
            await syncConnectionRow({
              status: 'CONNECTING_QR',
              qrCode: qrDataUrl,
              qrExpiresAt: new Date(Date.now() + 60000),
            });
          } catch (err: any) {
            state.errorLog = `Error al convertir QR a imagen: ${err.message}`;
          }
        }

        if (connection === 'open') {
          opened = true;
          global.__edmysoft_baileys_retries = 0;
          const phone = sock.user?.id ? sock.user.id.split(':')[0] : 'Conectado';
          const name = sock.user?.name || 'WhatsApp Business';

          state.status = 'CONNECTED';
          state.phoneNumber = phone;
          state.accountName = name;
          state.qrCode = null;
          state.lastConnectedAt = new Date();
          state.errorLog = null;

          await syncConnectionRow({
            status: 'CONNECTED',
            phoneNumber: phone,
            accountName: name,
            qrCode: null,
            lastConnectedAt: new Date(),
          });
        }

        if (connection === 'close') {
          const code: number | undefined = (lastDisconnect?.error as any)?.output?.statusCode;
          const reason = (code && DISCONNECT_REASON_TEXT[code]) || `código ${code ?? 'desconocido'}`;
          console.warn(`[Baileys] Conexión cerrada (${code}): ${reason}`);

          global.__edmysoft_baileys_instance = null;
          state.qrCode = null;

          const sessionInvalid =
            code === DisconnectReason.loggedOut ||
            code === DisconnectReason.badSession ||
            code === DisconnectReason.multideviceMismatch ||
            code === DisconnectReason.forbidden;

          // 1. Sesión guardada inválida: borrarla siempre (si no, nunca vuelve a salir un QR)
          if (sessionInvalid) {
            wipeBaileysAuth();
            state.phoneNumber = null;
            state.accountName = null;
            await syncConnectionRow({ status: 'DISCONNECTED', phoneNumber: null, accountName: null, qrCode: null });

            const retries = global.__edmysoft_baileys_retries ?? 0;
            if (!opened && retries < 1) {
              // Credenciales viejas al arrancar: generar un QR nuevo automáticamente
              global.__edmysoft_baileys_retries = retries + 1;
              state.status = 'CONNECTING_QR';
              setTimeout(() => {
                startBaileysSocket({
                  force: true,
                  note: 'La sesión guardada ya no era válida y fue eliminada. Generando un QR nuevo...',
                }).catch((e) => console.error('[Baileys] Reintento fallido:', e));
              }, 1000);
            } else {
              state.status = 'DISCONNECTED';
              state.errorLog = `WhatsApp cerró la sesión (${reason}). Pulsa "Generar Código QR" para vincular de nuevo.`;
            }
            return;
          }

          // 2. Sesión abierta en otro lugar: no pelear por ella
          if (code === DisconnectReason.connectionReplaced) {
            state.status = 'DISCONNECTED';
            state.errorLog = `Desconectado: ${reason}. Cierra la otra sesión y vuelve a conectar.`;
            await syncConnectionRow({ status: 'DISCONNECTED', qrCode: null });
            return;
          }

          // 3. Reinicio requerido (normal justo después de escanear): reconectar ya
          if (code === DisconnectReason.restartRequired) {
            state.status = 'CONNECTING_QR';
            startBaileysSocket({ force: true }).catch((e) => console.error('[Baileys] Reinicio fallido:', e));
            return;
          }

          // 4. QR expirado sin escanear: detener y pedir uno nuevo (evita bucles infinitos)
          if (!opened && code === DisconnectReason.timedOut && !authState.creds.registered) {
            state.status = 'DISCONNECTED';
            state.errorLog = 'El código QR expiró sin ser escaneado. Pulsa "Generar Código QR" para obtener uno nuevo.';
            await syncConnectionRow({ status: 'DISCONNECTED', qrCode: null });
            return;
          }

          // 5. Cortes de red / servidor: reconexión con espera progresiva
          const attempt = (global.__edmysoft_baileys_retries ?? 0) + 1;
          global.__edmysoft_baileys_retries = attempt;
          if (attempt > MAX_RECONNECT_ATTEMPTS) {
            state.status = 'ERROR';
            state.errorLog = `No fue posible reconectar con WhatsApp tras ${MAX_RECONNECT_ATTEMPTS} intentos (${reason}). Pulsa "Reconectar".`;
            await syncConnectionRow({ status: 'ERROR', qrCode: null });
            return;
          }
          state.status = 'CONNECTING_QR';
          state.errorLog = `Conexión interrumpida (${reason}). Reintentando (${attempt}/${MAX_RECONNECT_ATTEMPTS})...`;
          setTimeout(() => {
            if (!isCurrent()) return;
            startBaileysSocket({ force: true }).catch((e) => console.error('[Baileys] Reconexión fallida:', e));
          }, Math.min(15000, 2000 * attempt));
        }
      });

      // Escuchar mensajes entrantes: el agente de IA responde con memoria y herramientas
      const processedMessageIds = new Set<string>();

      sock.ev.on('messages.upsert', async (m) => {
        if (!isCurrent()) return;

        for (const msg of m.messages) {
          if (!msg.message) continue;

          // Evitar procesar mensajes duplicados de sincronización
          const msgId = msg.key?.id;
          if (msgId) {
            if (processedMessageIds.has(msgId)) continue;
            processedMessageIds.add(msgId);
            if (processedMessageIds.size > 5000) {
              const [first] = processedMessageIds;
              processedMessageIds.delete(first);
            }
          }

          const fromJid = msg.key.remoteJid;
          if (!fromJid || fromJid.endsWith('@broadcast') || fromJid.endsWith('@g.us')) continue;

          // Extracción universal de texto (soporta conversation, extendedTextMessage, ephemeral, viewOnce)
          const mInner =
            msg.message.ephemeralMessage?.message ||
            msg.message.viewOnceMessage?.message ||
            msg.message.viewOnceMessageV2?.message ||
            msg.message;

          const incomingText = (
            mInner.conversation ||
            mInner.extendedTextMessage?.text ||
            mInner.imageMessage?.caption ||
            mInner.videoMessage?.caption ||
            ''
          ).trim();

          if (!incomingText) continue;

          const myPhone = (sock.user?.id || '573234166354').replace(/\D/g, '');
          const myLid = (sock.user?.lid || '110428222963765').split(':')[0].replace(/\D/g, '');
          const remoteDigits = (fromJid || '').replace(/\D/g, '');
          const participantDigits = (msg.key.participant || '').replace(/\D/g, '');

          // Detección exhaustiva del chat consigo mismo ("Yo / Tú" - Edier Mery Gallego)
          // En WhatsApp Multi-Device el chat propio se enruta mediante identificador @lid (ej: 110428222963765@lid)
          const isSelfChat =
            fromJid.endsWith('@lid') ||
            fromJid.includes('110428222963765') ||
            (Boolean(myLid) && remoteDigits === myLid) ||
            remoteDigits === myPhone ||
            remoteDigits.endsWith('3234166354') ||
            participantDigits === myPhone ||
            participantDigits.endsWith('3234166354') ||
            fromJid.includes('3234166354') ||
            fromJid === 'me';

          console.log(`[Baileys Event] tipo: ${m.type}, fromMe: ${msg.key.fromMe}, isSelf: ${isSelfChat}, fromJid: ${fromJid}, texto: "${incomingText.slice(0, 40)}"`);

          // Si el mensaje tiene fromMe (enviado desde la misma cuenta de WhatsApp conectada):
          if (msg.key.fromMe) {
            // Si NO es el chat consigo mismo ("Yo / Tú"), ignorar (son mensajes que Edier envía a otros contactos)
            if (!isSelfChat) continue;

            // En el chat consigo mismo, verificar si fue emitido por el bot software
            if (isBotGeneratedMessage(msg, incomingText)) {
              console.log(`[Baileys Skip] Ignorando mensaje generado por el propio bot en "Yo (Tú)"`);
              continue; // Ignorar el eco de las notificaciones o respuestas generadas por el bot
            }
            // Si no fue generado por el bot: ¡Es un mensaje que Edier escribió manualmente desde su celular en "Yo (Tú)"!
            console.log(`[Baileys Match] 🌟 Mensaje detectado de Edier en su chat "Yo (Tú)": "${incomingText}"`);
          }

          // Procesar en serie por chat para respetar el orden y mantener la memoria coherente
          const previous = chatQueues.get(fromJid) || Promise.resolve();
          const next = previous
            .catch(() => {})
            .then(() => handleIncomingMessage(sock, fromJid, incomingText, msg.pushName || null, state))
            .catch((err) => console.error('Error procesando mensaje en Baileys:', err));
          chatQueues.set(fromJid, next);
          next.finally(() => {
            if (chatQueues.get(fromJid) === next) chatQueues.delete(fromJid);
          });
        }
      });

      return state;
    } catch (err: any) {
      console.error('[Baileys] Error al iniciar:', err);
      state.status = 'ERROR';
      state.errorLog = err.message || 'Error al iniciar Baileys';
      return state;
    }
  };

  global.__edmysoft_baileys_starting = run();
  try {
    return await global.__edmysoft_baileys_starting;
  } finally {
    global.__edmysoft_baileys_starting = null;
  }
}

/**
 * Desconecta la sesión activa de WhatsApp Baileys y limpia las credenciales
 */
export async function disconnectBaileysSocket(): Promise<BaileysState> {
  const state = global.__edmysoft_baileys_state!;
  const sock = global.__edmysoft_baileys_instance;
  // Invalidar eventos del socket actual ANTES del logout (si no, el cierre 401 dispararía un QR nuevo)
  global.__edmysoft_baileys_gen = (global.__edmysoft_baileys_gen ?? 0) + 1;
  global.__edmysoft_baileys_retries = 0;
  try {
    if (sock) {
      await sock.logout().catch(() => {});
    }
    endCurrentSocket();
    wipeBaileysAuth();

    state.status = 'DISCONNECTED';
    state.phoneNumber = null;
    state.accountName = null;
    state.qrCode = null;
    state.errorLog = null;

    await syncConnectionRow({ status: 'DISCONNECTED', phoneNumber: null, accountName: null, qrCode: null });
    return state;
  } catch (err: any) {
    state.status = 'ERROR';
    state.errorLog = err.message;
    return state;
  }
}

/**
 * Envía un mensaje directo a través de la conexión activa de WhatsApp
 */
export async function sendWhatsAppMessageDirect(toPhone: string, message: string): Promise<boolean> {
  const sock = global.__edmysoft_baileys_instance;
  if (!sock || global.__edmysoft_baileys_state?.status !== 'CONNECTED') {
    throw new Error('No hay una cuenta de WhatsApp conectada actualmente');
  }

  const jid = toPhone.includes('@') ? toPhone : `${toPhone.replace(/\D/g, '')}@s.whatsapp.net`;
  await sendBotMessage(sock, jid, { text: message });
  return true;
}
