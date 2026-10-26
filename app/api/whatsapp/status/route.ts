import { NextResponse } from 'next/server';
import { getWhatsAppConnectionStatus } from '@/lib/whatsapp-engine';

export async function GET() {
  try {
    const status = await getWhatsAppConnectionStatus();
    return NextResponse.json({ success: true, connection: status });
  } catch (error) {
    console.error('Error consultando estado de WhatsApp:', error);
    return NextResponse.json({ success: false, error: 'Error al consultar estado' }, { status: 500 });
  }
}
