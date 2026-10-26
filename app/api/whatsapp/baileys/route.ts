import { NextRequest, NextResponse } from 'next/server';
import {
  getBaileysState,
  startBaileysSocket,
  disconnectBaileysSocket,
  setBaileysSettings,
  sendWhatsAppMessageDirect,
} from '@/lib/whatsapp-baileys';

// GET /api/whatsapp/baileys (Obtiene estado y QR en tiempo real)
export async function GET() {
  try {
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

    if (action === 'start') {
      const state = await startBaileysSocket();
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
