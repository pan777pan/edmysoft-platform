import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdminRequest } from '@/lib/session';

const isAdmin = isAdminRequest;

// GET /api/catalog/services — Obtener todos los servicios con sus planes
export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { order: 'asc' },
      include: {
        plans: {
          orderBy: { order: 'asc' },
        },
        modules: true,
      },
    });

    return NextResponse.json({ success: true, services });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error al consultar catálogo: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/catalog/services — Crear un nuevo Servicio o un nuevo Plan
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { actionType } = body;

    if (actionType === 'CREATE_SERVICE') {
      const { name, slug, category, shortDesc } = body;
      if (!name || !slug) {
        return NextResponse.json({ success: false, error: 'Nombre y slug son requeridos' }, { status: 400 });
      }

      const count = await prisma.service.count();
      const newService = await prisma.service.create({
        data: {
          name: String(name).trim(),
          slug: String(slug).trim().toLowerCase(),
          category: category ? String(category).trim() : 'Software & IA',
          shortDesc: shortDesc ? String(shortDesc).trim() : '',
          features: JSON.stringify([]),
          order: count + 1,
          status: 'ACTIVE',
        },
      });

      return NextResponse.json({ success: true, service: newService });
    }

    if (actionType === 'CREATE_PLAN') {
      const { serviceId, name, slug, setupPrice, recurringPrice, billingPeriod, description, featuresIncluded, isRecommended } = body;
      if (!serviceId || !name || !slug) {
        return NextResponse.json({ success: false, error: 'serviceId, nombre y slug son requeridos' }, { status: 400 });
      }

      const count = await prisma.plan.count({ where: { serviceId } });
      const newPlan = await prisma.plan.create({
        data: {
          serviceId,
          name: String(name).trim(),
          slug: String(slug).trim().toLowerCase(),
          description: description ? String(description).trim() : '',
          setupPrice: Number(setupPrice) || 0,
          recurringPrice: Number(recurringPrice) || 0,
          billingPeriod: billingPeriod || 'MONTHLY',
          isRecommended: Boolean(isRecommended),
          featuresIncluded: Array.isArray(featuresIncluded) ? JSON.stringify(featuresIncluded) : JSON.stringify([]),
          order: count + 1,
          isActive: true,
        },
      });

      return NextResponse.json({ success: true, plan: newPlan });
    }

    return NextResponse.json({ success: false, error: 'Tipo de acción no reconocido' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error al crear en catálogo: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT /api/catalog/services — Actualizar un Servicio o Plan existente
export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { actionType, id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID es requerido' }, { status: 400 });
    }

    if (actionType === 'UPDATE_SERVICE') {
      const { name, slug, category, shortDesc, status } = body;
      const updated = await prisma.service.update({
        where: { id },
        data: {
          name: name !== undefined ? String(name).trim() : undefined,
          slug: slug !== undefined ? String(slug).trim().toLowerCase() : undefined,
          category: category !== undefined ? String(category).trim() : undefined,
          shortDesc: shortDesc !== undefined ? String(shortDesc).trim() : undefined,
          status: status !== undefined ? String(status) : undefined,
        },
      });
      return NextResponse.json({ success: true, service: updated });
    }

    if (actionType === 'UPDATE_PLAN') {
      const { name, slug, setupPrice, recurringPrice, billingPeriod, description, featuresIncluded, isRecommended, isActive } = body;
      const updated = await prisma.plan.update({
        where: { id },
        data: {
          name: name !== undefined ? String(name).trim() : undefined,
          slug: slug !== undefined ? String(slug).trim().toLowerCase() : undefined,
          description: description !== undefined ? String(description).trim() : undefined,
          setupPrice: setupPrice !== undefined ? Number(setupPrice) : undefined,
          recurringPrice: recurringPrice !== undefined ? Number(recurringPrice) : undefined,
          billingPeriod: billingPeriod !== undefined ? String(billingPeriod) : undefined,
          isRecommended: isRecommended !== undefined ? Boolean(isRecommended) : undefined,
          featuresIncluded: Array.isArray(featuresIncluded) ? JSON.stringify(featuresIncluded) : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        },
      });
      return NextResponse.json({ success: true, plan: updated });
    }

    return NextResponse.json({ success: false, error: 'Tipo de acción no reconocido' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error al actualizar catálogo: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/catalog/services — Eliminar un Servicio o Plan
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const actionType = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID es requerido' }, { status: 400 });
    }

    if (actionType === 'SERVICE') {
      await prisma.service.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Servicio eliminado correctamente' });
    }

    if (actionType === 'PLAN') {
      await prisma.plan.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Plan eliminado correctamente' });
    }

    return NextResponse.json({ success: false, error: 'Tipo no especificado' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error al eliminar: ' + error.message },
      { status: 500 }
    );
  }
}
