import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      phone,
      email,
      companyName,
      serviceInterest,
      identifiedNeed,
      monthlyLeadsVolume,
      targetBudget,
      preferredChannel = 'WHATSAPP',
    } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ success: false, error: 'Nombre y teléfono son obligatorios' }, { status: 400 });
    }

    // 1. Crear o actualizar contacto
    let contact = await prisma.contact.findFirst({
      where: {
        OR: [{ phone: phone.trim() }, { email: email?.trim() || undefined }],
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email?.trim() || null,
          companyName: companyName?.trim() || null,
          preferredChannel,
        },
      });
    }

    // 2. Crear oportunidad en el CRM
    const stage = monthlyLeadsVolume || targetBudget ? 'CALIFICADO' : 'NUEVO';
    const opportunity = await prisma.opportunity.create({
      data: {
        contactId: contact.id,
        title: `Interés en ${serviceInterest || 'Automatización Comercial'} — ${fullName}`,
        stage,
        serviceInterest,
        identifiedNeed: identifiedNeed || `Volumen estimado: ${monthlyLeadsVolume || 'No especificado'}`,
        targetBudget: targetBudget ? parseFloat(targetBudget) : null,
      },
    });

    // 3. Crear historial de etapa
    await prisma.stageHistory.create({
      data: {
        opportunityId: opportunity.id,
        fromStage: null,
        toStage: stage,
        notes: 'Registro inicial desde formulario / diagnóstico web.',
      },
    });

    // 4. Crear tarea automática de seguimiento para el comercial
    const dueAt = new Date();
    dueAt.setHours(dueAt.getHours() + 2); // Contactar en menos de 2 horas

    await prisma.taskReminder.create({
      data: {
        opportunityId: opportunity.id,
        title: `Contactar por WhatsApp a ${fullName} (${companyName || 'Empresa'})`,
        dueAt,
      },
    });

    // 5. Iniciar conversación en la bandeja omnicanal
    let conversation = await prisma.conversation.findFirst({
      where: { contactId: contact.id },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          channel: preferredChannel,
          status: 'AI_HANDLING',
          externalThreadId: `web_lead_${contact.id}`,
        },
      });

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'CLIENT',
          senderName: fullName,
          content: `Solicitud de diagnóstico comercial. Interés: ${serviceInterest || 'Soluciones EDMYSOFT'}. Necesidad: ${identifiedNeed || 'Optimizar ventas'}`,
        },
      });

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'AI',
          senderName: 'EDMYSOFT Atiende',
          content: `¡Hola ${fullName}! Hemos recibido tu diagnóstico en EDMYSOFT. Uno de nuestros asesores o nuestro asistente especializado en WhatsApp se pondrá en contacto al número ${phone} para presentarte la propuesta más conveniente.`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      contactId: contact.id,
      opportunityId: opportunity.id,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error('Error procesando lead comercial:', error);
    return NextResponse.json({ success: false, error: 'Error al registrar oportunidad' }, { status: 500 });
  }
}
