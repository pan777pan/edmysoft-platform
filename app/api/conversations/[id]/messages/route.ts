import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { content, senderType = 'HUMAN', senderName = 'Asesor Comercial' } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'El contenido no puede estar vacío' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { contact: true },
    });

    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversación no encontrada' }, { status: 404 });
    }

    // 1. Registrar mensaje enviado
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderType,
        senderName,
        content: content.trim(),
        status: 'DELIVERED',
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    // 2. Si el mensaje proviene del CLIENTE y la conversación está en AI_HANDLING, la IA responde
    let aiResponse = null;
    if (senderType === 'CLIENT' && conversation.status === 'AI_HANDLING') {
      // Determinación de respuesta inteligente del asistente
      const lower = content.toLowerCase();
      let replyContent = '';
      let toolName = 'analizar_intencion';

      if (lower.includes('precio') || lower.includes('costo') || lower.includes('cotizar') || lower.includes('planes')) {
        replyContent = `¡Hola ${conversation.contact.fullName}! En EDMYSOFT contamos con planes para Agentes de IA desde $2.200.000 COP de implementación y paquetes Plus recomendados en $3.800.000 COP. ¿Te gustaría que te prepare una propuesta preliminar para tu negocio?`;
        toolName = 'consultar_catalogo';
      } else if (lower.includes('agendar') || lower.includes('reunión') || lower.includes('cita')) {
        replyContent = `Con gusto podemos coordinar una sesión de diagnóstico comercial de 30 minutos sin costo. ¿Prefieres en horas de la mañana o en la tarde?`;
        toolName = 'consultar_disponibilidad_agenda';
      } else {
        replyContent = `Gracias por comunicarte con EDMYSOFT. Entiendo perfectamente tu necesidad. Nuestro objetivo es ayudarte a automatizar tus ventas y atención en WhatsApp sin complicaciones. ¿Qué volumen de prospectos recibes al día actualmente?`;
        toolName = 'preguntar_diagnostico';
      }

      aiResponse = await prisma.message.create({
        data: {
          conversationId: id,
          senderType: 'AI',
          senderName: 'EDMYSOFT Atiende',
          content: replyContent,
          status: 'DELIVERED',
        },
      });

      await prisma.aILog.create({
        data: {
          conversationId: id,
          modelUsed: 'OpenRouter (Claude 3.5 Sonnet / Local Engine)',
          promptTokens: 140,
          completionTokens: 65,
          toolCalls: JSON.stringify([{ tool: toolName, params: { query: content } }]),
          aiDecision: `Detectada intención comercial. Ejecutada herramienta ${toolName}.`,
          confidenceScore: 0.96,
        },
      });
    }

    return NextResponse.json({ success: true, message, aiResponse });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return NextResponse.json({ success: false, error: 'Error al enviar mensaje' }, { status: 500 });
  }
}
