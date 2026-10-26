import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdminRequest } from '@/lib/session';

const isAdmin = isAdminRequest;

// GET /api/catalog/modules
export async function GET() {
  try {
    const modules = await prisma.serviceModule.findMany({
      orderBy: { createdAt: 'asc' },
      include: { service: true },
    });

    return NextResponse.json({ success: true, modules });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error al consultar módulos: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/catalog/modules — Crear nuevo módulo
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, code, description, setupPrice, recurringPrice, billingPeriod, defaultRule, isTechnicalReady, serviceId } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: 'Nombre y código técnico son requeridos' }, { status: 400 });
    }

    const cleanCode = String(code).trim().toUpperCase();

    // Validar duplicado de código
    const existing = await prisma.serviceModule.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return NextResponse.json({ success: false, error: `Ya existe un módulo con el código ${cleanCode}` }, { status: 409 });
    }

    const newModule = await prisma.serviceModule.create({
      data: {
        name: String(name).trim(),
        code: cleanCode,
        description: description ? String(description).trim() : '',
        setupPrice: Number(setupPrice) || 0,
        recurringPrice: Number(recurringPrice) || 0,
        billingPeriod: billingPeriod || 'MONTHLY',
        defaultRule: defaultRule || 'OPTIONAL',
        isTechnicalReady: Boolean(isTechnicalReady),
        serviceId: serviceId || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, module: newModule });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error al crear módulo: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT /api/catalog/modules — Actualizar módulo existente
export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, code, description, setupPrice, recurringPrice, billingPeriod, defaultRule, isTechnicalReady, serviceId, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID es requerido' }, { status: 400 });
    }

    const updated = await prisma.serviceModule.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        code: code !== undefined ? String(code).trim().toUpperCase() : undefined,
        description: description !== undefined ? String(description).trim() : undefined,
        setupPrice: setupPrice !== undefined ? Number(setupPrice) : undefined,
        recurringPrice: recurringPrice !== undefined ? Number(recurringPrice) : undefined,
        billingPeriod: billingPeriod !== undefined ? String(billingPeriod) : undefined,
        defaultRule: defaultRule !== undefined ? String(defaultRule) : undefined,
        isTechnicalReady: isTechnicalReady !== undefined ? Boolean(isTechnicalReady) : undefined,
        serviceId: serviceId !== undefined ? serviceId : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return NextResponse.json({ success: true, module: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error al actualizar módulo: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/catalog/modules
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID es requerido' }, { status: 400 });
    }

    await prisma.serviceModule.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Módulo eliminado correctamente' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error al eliminar módulo: ' + error.message },
      { status: 500 }
    );
  }
}
