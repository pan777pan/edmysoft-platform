import { NextRequest, NextResponse } from 'next/server';
import { confirmWhatsAppQRPairing } from '@/lib/whatsapp-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phoneNumber = '+57 323 416 6354', accountName = 'EDMYSOFT WhatsApp Business' } = body;
    const connected = await confirmWhatsAppQRPairing(phoneNumber, accountName);
    return NextResponse.json({ success: true, connection: connected });
  } catch (error) {
    console.error('Error emparejando sesión de WhatsApp:', error);
    return NextResponse.json({ success: false, error: 'Error al emparejar sesión' }, { status: 500 });
  }
}
