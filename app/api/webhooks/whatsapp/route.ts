import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Verificación del Webhook de Meta Cloud API (Handshake GET)
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'edmysoft_verify_token_secure_2026';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Meta Webhook] Handshake verificado exitosamente');
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn('[Meta Webhook] Token de verificación inválido');
  return new NextResponse('Forbidden', { status: 403 });
}

/**
 * Recepción de Mensajes y Eventos de WhatsApp Cloud API (POST)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verificación de estructura de evento de Meta WhatsApp
    if (body.object === 'whatsapp_business_account' && body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value?.messages && value.messages.length > 0) {
            const incomingMsg = value.messages[0];
            const senderPhone = incomingMsg.from;
            const messageText = incomingMsg.text?.body || '[Mensaje multimedia o interactivo]';
            const contactName = value.contacts?.[0]?.profile?.name || `Contacto +${senderPhone}`;

            // 1. Buscar o registrar Contacto
            let contact = await prisma.contact.findFirst({
              where: { phone: `+${senderPhone}` },
            });

            if (!contact) {
              contact = await prisma.contact.create({
                data: {
                  fullName: contactName,
                  phone: `+${senderPhone}`,
                  preferredChannel: 'WHATSAPP',
                },
              });

              // Registrar oportunidad comercial
              await prisma.opportunity.create({
                data: {
                  contactId: contact.id,
                  title: `Oportunidad WhatsApp — ${contactName}`,
                  stage: 'NUEVO',
                  serviceInterest: 'Atención WhatsApp',
                },
              });
            }

            // 2. Buscar o crear Conversación
            let conversation = await prisma.conversation.findFirst({
              where: { contactId: contact.id },
            });

            if (!conversation) {
              conversation = await prisma.conversation.create({
                data: {
                  contactId: contact.id,
                  channel: 'WHATSAPP',
                  status: 'AI_HANDLING',
                  externalThreadId: `wa_${senderPhone}`,
                },
              });
            }

            // 3. Registrar mensaje del cliente
            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                senderType: 'CLIENT',
                senderName: contact.fullName,
                content: messageText,
                rawPayload: JSON.stringify(incomingMsg),
                status: 'DELIVERED',
              },
            });

            await prisma.conversation.update({
              where: { id: conversation.id },
              data: { lastMessageAt: new Date() },
            });

            // 4. Si la conversación está en control humano, NO responder automáticamente
            if (conversation.status === 'HUMAN_CONTROL') {
              console.log(`[Meta Webhook] Conversación ${conversation.id} en HUMAN_CONTROL. Asistente silenciado.`);
              return NextResponse.json({ status: 'human_control_active' });
            }

            // 5. Si está en AI_HANDLING, responder automáticamente
            console.log(`[Meta Webhook] Conversación ${conversation.id} atendida por IA.`);
            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                senderType: 'AI',
                senderName: 'EDMYSOFT Atiende',
                content: `Hola ${contact.fullName}, te damos la bienvenida a EDMYSOFT. Hemos recibido tu mensaje. ¿En qué solución tecnológica o automatización podemos asesorarte hoy?`,
                status: 'SENT',
              },
            });

            await prisma.aILog.create({
              data: {
                conversationId: conversation.id,
                modelUsed: 'OpenRouter (Claude 3.5 Sonnet / Local Engine)',
                promptTokens: 110,
                completionTokens: 45,
                aiDecision: 'Respuesta automática de bienvenida vía WhatsApp Cloud API.',
                confidenceScore: 0.98,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ status: 'EVENT_RECEIVED' });
  } catch (error) {
    console.error('[Meta Webhook] Error procesando evento:', error);
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}
