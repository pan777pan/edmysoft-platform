import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action, userId, userName = 'Asesor Comercial' } = await req.json(); // action: "TAKE_CONTROL" | "RETURN_TO_AI"

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversación no encontrada' }, { status: 404 });
    }

    const newStatus = action === 'TAKE_CONTROL' ? 'HUMAN_CONTROL' : 'AI_HANDLING';

    // Actualizar estado de la conversación
    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        status: newStatus,
        takenByUserId: action === 'TAKE_CONTROL' ? userId : null,
      },
    });

    // Registrar mensaje del sistema en la conversación
    const systemNotice = action === 'TAKE_CONTROL'
      ? `🔔 El asesor ${userName} ha tomado el control manual de esta conversación. Las respuestas automáticas de la IA han sido pausadas.`
      : `🤖 La conversación ha sido devuelta al asistente de IA (EDMYSOFT Atiende). Las respuestas automáticas están activadas.`;

    await prisma.message.create({
      data: {
        conversationId: id,
        senderType: 'SYSTEM',
        senderName: 'Sistema EDMYSOFT',
        content: systemNotice,
      },
    });

    // Auditoría
    await prisma.activityLog.create({
      data: {
        userId,
        action: action === 'TAKE_CONTROL' ? 'HUMAN_TAKEOVER' : 'RETURN_TO_AI',
        entityType: 'CONVERSATION',
        entityId: id,
        details: JSON.stringify({ previousStatus: conversation.status, newStatus }),
      },
    });

    return NextResponse.json({ success: true, conversation: updated });
  } catch (error) {
    console.error('Error en cambio de control humano/IA:', error);
    return NextResponse.json({ success: false, error: 'Error al cambiar control' }, { status: 500 });
  }
}
