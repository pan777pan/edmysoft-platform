import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai-engine';
import { getSessionUser } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      message,
      history = [],
      senderName = 'Visitante Web',
      conversationId,
      clientSessionId,
      email,
      phone,
    } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Comprobar si hay usuario autenticado en la sesión oficial
    const loggedUser = getSessionUser(req);
    const resolvedEmail = loggedUser?.email || email || null;
    const resolvedName = loggedUser?.name || senderName;
    const resolvedPhone = phone || null;

    // Identificador unificado para memoria cruzada del cliente
    const clientIdentifier =
      resolvedPhone ||
      resolvedEmail ||
      clientSessionId ||
      conversationId ||
      'web_visitor';

    // Memoria de la sesión web: el cliente envía el historial; se sanea y se limita
    const safeHistory = Array.isArray(history)
      ? history
          .filter((h: any) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
          .slice(-20)
      : [];

    const aiResult = await generateAIResponse(message, safeHistory, {
      channel: 'WEB',
      contactName: resolvedName,
      contactPhone: resolvedPhone,
      contactEmail: resolvedEmail,
      conversationId: conversationId || `WEB-${clientIdentifier.slice(-12)}`,
      clientIdentifier,
    });

    // Registrar o actualizar contacto y conversación WEB para métricas y trazabilidad en tiempo real
    try {
      const webPhone = resolvedPhone || `web_${clientIdentifier.replace(/\D/g, '').slice(-10) || 'visit'}`;
      let webContact = await prisma.contact.findFirst({
        where: {
          OR: [
            resolvedEmail ? { email: resolvedEmail } : undefined,
            resolvedPhone ? { phone: resolvedPhone } : undefined,
            { phone: webPhone },
          ].filter(Boolean) as any,
        },
      });

      if (!webContact) {
        webContact = await prisma.contact.create({
          data: {
            fullName: resolvedName || 'Visitante Web',
            phone: webPhone,
            email: resolvedEmail,
            preferredChannel: 'WEB',
          },
        });
      }

      let webConv = await prisma.conversation.findFirst({
        where: { contactId: webContact.id, channel: 'WEB' },
      });

      if (!webConv) {
        webConv = await prisma.conversation.create({
          data: {
            contactId: webContact.id,
            channel: 'WEB',
            status: 'AI_HANDLING',
          },
        });
      }

      await prisma.message.create({
        data: {
          conversationId: webConv.id,
          senderType: 'CLIENT',
          senderName: resolvedName || 'Visitante Web',
          content: message,
        },
      });

      await prisma.message.create({
        data: {
          conversationId: webConv.id,
          senderType: 'AI',
          senderName: 'Asistente EDMYSOFT (Web)',
          content: aiResult.reply,
        },
      });

      await prisma.conversation.update({
        where: { id: webConv.id },
        data: { lastMessageAt: new Date() },
      });
    } catch (crmErr) {
      console.warn('No se pudo sincronizar conversación web en CRM:', crmErr);
    }

    // El agendamiento ya lo registra la herramienta agendar_reunion; aquí solo se loguean cotizaciones consultadas
    if (aiResult.detectedIntent === 'QUOTE') {
      try {
        await prisma.activityLog.create({
          data: {
            action: 'AI_QUOTE_INTERACTION',
            entityType: 'AIChatSession',
            entityId: `CHAT-${Date.now()}`,
            details: JSON.stringify({
              senderName,
              userMessage: message,
              intent: aiResult.detectedIntent,
              quoteData: aiResult.quoteData || null,
            }),
          },
        });
      } catch (logErr) {
        console.warn('No se pudo registrar log de IA:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      reply: aiResult.reply,
      detectedIntent: aiResult.detectedIntent,
      quoteData: aiResult.quoteData,
      meetingData: aiResult.meetingData,
      toolsUsed: aiResult.toolsUsed,
      suggestions: aiResult.suggestions || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error al procesar consulta con IA', details: error.message },
      { status: 500 }
    );
  }
}
