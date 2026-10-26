import { NextRequest, NextResponse } from 'next/server';
import { loadBusinessKnowledge, saveBusinessKnowledge } from '@/lib/knowledge-manager';
import { isAdminRequest } from '@/lib/session';

const isAdmin = isAdminRequest;

// GET /api/admin/knowledge
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const knowledge = loadBusinessKnowledge();
  return NextResponse.json({ success: true, knowledge });
}

// PUT /api/admin/knowledge
export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = saveBusinessKnowledge(body);

    return NextResponse.json({
      success: true,
      message: 'Base de conocimiento del negocio actualizada. El bot ha incorporado los nuevos datos.',
      knowledge: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error al actualizar base de conocimiento: ' + error.message },
      { status: 500 }
    );
  }
}
