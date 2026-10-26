import { NextRequest, NextResponse } from 'next/server';
import { generateWhatsAppQR } from '@/lib/whatsapp-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { provider = 'QR_DEVICE' } = body;
    const qrData = await generateWhatsAppQR(provider);
    return NextResponse.json(qrData);
  } catch (error) {
    console.error('Error generando QR de WhatsApp:', error);
    return NextResponse.json({ success: false, error: 'Error al generar código QR' }, { status: 500 });
  }
}
