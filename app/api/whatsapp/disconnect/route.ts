import { NextResponse } from 'next/server';
import { disconnectWhatsAppSession } from '@/lib/whatsapp-engine';

export async function POST() {
  try {
    const disconnected = await disconnectWhatsAppSession();
    return NextResponse.json({ success: true, connection: disconnected });
  } catch (error) {
    console.error('Error desconectando WhatsApp:', error);
    return NextResponse.json({ success: false, error: 'Error al desconectar' }, { status: 500 });
  }
}
