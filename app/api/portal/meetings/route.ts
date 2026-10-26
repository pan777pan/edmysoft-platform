import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/portal/meetings?email=xxx
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
    const logs = await prisma.activityLog.findMany({
      where: {
        entityType: 'MEETING',
        action: 'MEETING_SCHEDULED',
      },
      orderBy: { createdAt: 'desc' },
    });

    const meetings = logs
      .map((log) => {
        try {
          const data = JSON.parse(log.details || '{}');
          return {
            id: log.id,
            title: `REUNIÓN: ${data.topic || 'Sesión Técnica'}`,
            dueDate: data.date || log.createdAt.toISOString().slice(0, 10),
            description: `Cliente: ${data.clientName || data.email} (${data.email}) | Hora: ${data.time} | Tema: ${data.topic}`,
            email: data.email,
            status: data.status || 'Confirmada',
          };
        } catch {
          return null;
        }
      })
      .filter((m) => m !== null && (isAdmin || m.email === email));

    return NextResponse.json({ success: true, meetings });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al consultar reuniones', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/portal/meetings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientName, email, topic, date, time } = body;

    const userEmail = email?.trim().toLowerCase();
    if (!userEmail || !topic || !date || !time) {
      return NextResponse.json(
        { error: '400 Bad Request: Fecha, hora, tema y correo requeridos' },
        { status: 400 }
      );
    }

    const log = await prisma.activityLog.create({
      data: {
        action: 'MEETING_SCHEDULED',
        entityType: 'MEETING',
        entityId: `MEET-${Date.now()}`,
        details: JSON.stringify({
          clientName: clientName || userEmail,
          email: userEmail,
          topic,
          date,
          time,
          status: 'Confirmada',
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        meeting: {
          id: log.id,
          client: clientName || userEmail,
          email: userEmail,
          topic,
          date,
          time,
          status: 'Confirmada',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al agendar reunión', details: error.message },
      { status: 500 }
    );
  }
}
