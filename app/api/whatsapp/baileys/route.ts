import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getBaileysState,
  startBaileysSocket,
  disconnectBaileysSocket,
  setBaileysSettings,
  sendWhatsAppMessageDirect,
} from '@/lib/whatsapp-baileys';

const WORKER_URL = process.env.WORKER_URL ? process.env.WORKER_URL.replace(/\/$/, '') : null;

// GET /api/whatsapp/baileys (Obtiene estado y QR en tiempo real)
export async function GET() {
  try {
    // 1. Si hay un WORKER_URL configurado en la nube, consultar directamente al worker
    if (WORKER_URL) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${WORKER_URL}/api/status`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeout);
        if (res.ok) {
          const workerData = await res.json();
          return NextResponse.json(workerData);
        }
      } catch (err: any) {
        console.warn('[Vercel API] Worker en la nube no respondió a tiempo, leyendo Supabase:', err.message);
      }
    }

    // 2. Leer estado sincronizado en Supabase (compartido entre Vercel y el Worker)
    const dbRow = await prisma.whatsAppConnection.findFirst();
    if (dbRow) {
      const isConnecting = dbRow.status === 'CONNECTING_QR';
      const isExpired = dbRow.qrExpiresAt ? new Date(dbRow.qrExpiresAt).getTime() < Date.now() : false;

      const stateFromDb = {
        status: isConnecting && isExpired ? 'DISCONNECTED' : dbRow.status,
        qrCode: isExpired ? null : dbRow.qrCode,
        phoneNumber: dbRow.phoneNumber,
        accountName: dbRow.accountName,
        lastConnectedAt: dbRow.lastConnectedAt,
        errorLog: null,
        autoReplyAI: true,
        autoCalendar: true,
      };

      // Si la base de datos tiene estado o no estamos en local con socket activo
      const localState = getBaileysState();
      if (localState.status === 'DISCONNECTED' && dbRow.status !== 'DISCONNECTED') {
        return NextResponse.json({ success: true, ...stateFromDb, data: stateFromDb });
      }
    }

    // 3. Fallback al estado local en memoria
    const state = getBaileysState();
    return NextResponse.json({ success: true, ...state, data: state });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error al obtener estado de WhatsApp', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/baileys (Inicia socket, desconecta, actualiza ajustes o envía test)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, to, message, autoReplyAI, autoCalendar } = body;

    // 1. Si hay un WORKER_URL configurado en la nube, delegar la acción al Worker 24/7
    if (WORKER_URL) {
      try {
        const res = await fetch(`${WORKER_URL}/api/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          cache: 'no-store',
        });
        const workerResponse = await res.json();
        return NextResponse.json(workerResponse, { status: res.status });
      } catch (err: any) {
        console.error('[Vercel API] Error enviando acción al Worker:', err.message);
      }
    }

    // 2. Ejecución local directa
    if (action === 'start') {
      const state = await startBaileysSocket({ force: true, note: 'Iniciado desde panel web' });
      return NextResponse.json({ success: true, ...state, data: state });
    }

    if (action === 'disconnect') {
      const state = await disconnectBaileysSocket();
      return NextResponse.json({ success: true, ...state, data: state });
    }

    if (action === 'settings') {
      const state = setBaileysSettings({ autoReplyAI, autoCalendar });
      return NextResponse.json({ success: true, ...state, data: state });
    }

    if (action === 'send_test') {
      if (!to || !message) {
        return NextResponse.json(
          { success: false, error: 'Número de destino y mensaje requeridos' },
          { status: 400 }
        );
      }
      await sendWhatsAppMessageDirect(to, message);
      return NextResponse.json({ success: true, message: 'Mensaje de prueba enviado con éxito' });
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida (start, disconnect, settings, send_test)' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error en el servidor de WhatsApp Baileys' },
      { status: 500 }
    );
  }
}
