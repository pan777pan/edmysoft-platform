import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/portal/projects/[id]?email=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: '401 Unauthorized: Autenticación requerida para acceder al proyecto' },
        { status: 401 }
      );
    }

    const project = await prisma.clientProject.findUnique({
      where: { id },
      include: { documents: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: '404 Not Found: Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Aislamiento RLS / BOLA / IDOR: Solo el propietario o el administrador pueden verlo
    const isAdmin = email === 'ediergallego59@gmail.com';
    if (project.ownerEmail !== email && !isAdmin) {
      return NextResponse.json(
        { error: '403 Forbidden: No tienes autorización para consultar este proyecto confidencial' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al consultar proyecto', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/portal/projects/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { email, progress, stage, eta } = body;

    const userEmail = email?.trim().toLowerCase();
    if (!userEmail) {
      return NextResponse.json(
        { error: '401 Unauthorized: Sesión requerida' },
        { status: 401 }
      );
    }

    const project = await prisma.clientProject.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json(
        { error: '404 Not Found: Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const isAdmin = userEmail === 'ediergallego59@gmail.com';
    if (!isAdmin) {
      return NextResponse.json(
        { error: '403 Forbidden: Solo el administrador del proyecto puede modificar etapas o avances' },
        { status: 403 }
      );
    }

    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return NextResponse.json(
        { error: '400 Bad Request: El avance debe ser un porcentaje válido entre 0 y 100' },
        { status: 400 }
      );
    }

    const updated = await prisma.clientProject.update({
      where: { id },
      data: {
        ...(progress !== undefined ? { progress: Number(progress) } : {}),
        ...(stage ? { stage } : {}),
        ...(eta ? { eta } : {}),
      },
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al actualizar proyecto', details: error.message },
      { status: 500 }
    );
  }
}
