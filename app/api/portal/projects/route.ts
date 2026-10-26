import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/portal/projects?email=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: '401 Unauthorized: Parámetro de autenticación o correo requerido' },
        { status: 401 }
      );
    }

    const projects = await prisma.clientProject.findMany({
      where: {
        ownerEmail: email,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        documents: true,
      },
    });

    return NextResponse.json({
      success: true,
      projects,
      count: projects.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al consultar proyectos autorizados', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/portal/projects (Admin create / update)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, ownerEmail, clientName, progress, stage, eta, leadEngineer } = body;

    if (!name || !ownerEmail) {
      return NextResponse.json(
        { error: '400 Bad Request: Nombre y email de propietario requeridos' },
        { status: 400 }
      );
    }

    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return NextResponse.json(
        { error: '400 Bad Request: El avance debe ser un porcentaje entre 0 y 100' },
        { status: 400 }
      );
    }

    const project = await prisma.clientProject.create({
      data: {
        id: id || `PRJ-${Math.floor(100 + Math.random() * 900)}`,
        name,
        ownerEmail: ownerEmail.toLowerCase(),
        clientName: clientName || ownerEmail,
        progress: progress || 15,
        stage: stage || 'Análisis',
        eta: eta || '2026-12-31',
        leadEngineer: leadEngineer || 'Edier Mery Gallego (Director Técnico EDMYSOFT)',
      },
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al crear proyecto', details: error.message },
      { status: 500 }
    );
  }
}
