import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { isAdminRequest, getSessionUser } from '@/lib/session';

export const PERMISSIONS_LIST = [
  { id: 'crm_leads', label: 'CRM & Prospectos', desc: 'Gestionar contactos, oportunidades y embudo de ventas' },
  { id: 'whatsapp_chat', label: 'WhatsApp & Chat en Vivo', desc: 'Acceder a conversaciones, enviar mensajes y control humano' },
  { id: 'catalog_pricing', label: 'Catálogo & Precios', desc: 'Modificar servicios, módulos, planes y tarifas oficiales' },
  { id: 'ai_knowledge', label: 'Entrenamiento de IA', desc: 'Administrar Base de Conocimiento, FAQs y directrices' },
  { id: 'financial_reports', label: 'Métricas & Reportes', desc: 'Supervisar transacciones, cotizaciones y reportes diarios' },
  { id: 'user_management', label: 'Gestión de Equipo', desc: 'Crear, editar y gestionar trabajadores y permisos' },
];

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        phone: true,
        jobTitle: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const formattedUsers = users.map(u => ({
      ...u,
      parsedPermissions: u.permissions ? JSON.parse(u.permissions) : [],
    }));

    return NextResponse.json({ success: true, users: formattedUsers, availablePermissions: PERMISSIONS_LIST });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const session = getSessionUser(req);

  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, password, role = 'TRABAJADOR_VENTAS', permissions = [], phone, jobTitle } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Nombre, correo electrónico y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un usuario registrado con este correo' },
        { status: 409 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: cleanEmail,
        passwordHash,
        role: String(role).toUpperCase(),
        permissions: JSON.stringify(permissions),
        phone: phone ? String(phone).trim() : null,
        jobTitle: jobTitle ? String(jobTitle).trim() : 'Colaborador',
        isActive: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: newUser.id,
        details: JSON.stringify({
          createdUser: newUser.email,
          role: newUser.role,
          createdBy: session?.email || 'ADMIN',
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Trabajador "${newUser.name}" creado con éxito con rol ${newUser.role}`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        permissions,
        jobTitle: newUser.jobTitle,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id, name, role, permissions, phone, jobTitle, isActive, password } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de usuario requerido' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Proteger al SUPERADMIN principal (Edier Mery Gallego)
    if (existing.email === 'ediergallego59@gmail.com') {
      if (isActive === false) {
        return NextResponse.json(
          { success: false, error: 'No es posible desactivar la cuenta principal del Director Técnico' },
          { status: 403 }
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = String(name).trim();
    if (role) updateData.role = String(role).toUpperCase();
    if (permissions !== undefined) updateData.permissions = JSON.stringify(permissions);
    if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle ? String(jobTitle).trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (password && String(password).trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(String(password).trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Usuario ${updated.name} actualizado con éxito`,
      user: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de usuario requerido' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (existing.email === 'ediergallego59@gmail.com') {
      return NextResponse.json(
        { success: false, error: 'No es posible eliminar al Director Técnico y Fundador de EDMYSOFT' },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: `Usuario ${existing.name} eliminado del equipo` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
