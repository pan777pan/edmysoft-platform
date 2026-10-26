import { NextRequest, NextResponse } from 'next/server';
import { loadWhatsAppDemoConfig, handleDemoConversation } from '@/lib/whatsapp-demo';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { message, history = [], previewConfig = null } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Mensaje requerido' }, { status: 400 });
    }

    const cfg = previewConfig || loadWhatsAppDemoConfig();
    const result = handleDemoConversation(message, history, cfg, 'Cliente');

    return NextResponse.json({
      success: true,
      reply: result.reply,
      intent: result.intent,
      modelUsed: result.modelUsed,
      businessName: cfg.clientBusinessName,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
