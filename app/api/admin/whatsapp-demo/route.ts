import { NextRequest, NextResponse } from 'next/server';
import { loadWhatsAppDemoConfig, saveWhatsAppDemoConfig, isWhatsAppDemoActive } from '@/lib/whatsapp-demo';
import { isAdminRequest } from '@/lib/session';

const isAdmin = isAdminRequest;

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const config = loadWhatsAppDemoConfig();
  const isActive = isWhatsAppDemoActive();

  return NextResponse.json({
    success: true,
    config,
    isActive,
    isCurrentlyActive: isActive,
  });
}

export async function PUT(req: NextRequest) {
  return handleSave(req);
}

export async function POST(req: NextRequest) {
  return handleSave(req);
}

async function handleSave(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const updated = saveWhatsAppDemoConfig(body);
  const isActive = isWhatsAppDemoActive();

  return NextResponse.json({
    success: true,
    message: updated.active
      ? `Modo Demo activado para "${updated.clientBusinessName}". WhatsApp responderá como esa empresa.`
      : 'Modo Demo configurado con éxito.',
    config: updated,
    isActive,
    isCurrentlyActive: isActive,
  });
}
