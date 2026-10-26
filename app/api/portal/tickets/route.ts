import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/portal/tickets?email=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: '401 Unauthorized: Sesión requerida' },
        { status: 401 }
      );
    }

    const isAdmin = email === 'ediergallego59@gmail.com';
    const tickets = await prisma.supportTicket.findMany({
      where: isAdmin ? {} : { ownerEmail: email },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al consultar tickets', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/portal/tickets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerEmail, clientName, subject, message } = body;

    const email = ownerEmail?.trim().toLowerCase();
    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: '400 Bad Request: Campos requeridos incompletos' },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
        ownerEmail: email,
        clientName: clientName || email,
        subject: subject.trim(),
        message: message.trim(),
        status: 'En Revisión',
      },
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al crear ticket', details: error.message },
      { status: 500 }
    );
  }
}
