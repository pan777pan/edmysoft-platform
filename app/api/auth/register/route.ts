import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { setSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, password, phone, companyName } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Nombre completo, correo y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Comprobar si ya existe
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una cuenta oficial con este correo. Por favor inicia sesión.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: cleanEmail,
        passwordHash,
        role: 'CLIENT',
        isActive: true,
      },
    });

    // Registrar o vincular en el CRM como contacto oficial
    const cleanPhone = phone ? String(phone).trim() : null;
    let contact = await prisma.contact.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          fullName: String(name).trim(),
          email: cleanEmail,
          phone: cleanPhone,
          companyName: companyName ? String(companyName).trim() : 'Persona Natural',
          preferredChannel: 'WEB_FORM',
        },
      });
    } else {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          email: cleanEmail,
          fullName: String(name).trim(),
          companyName: companyName ? String(companyName).trim() : contact.companyName,
        },
      });
    }

    // Inicializar espacio de trabajo oficial en el Portal (Proyecto, Documento y Ticket de Bienvenida)
    const existingProject = await prisma.clientProject.findFirst({ where: { ownerEmail: cleanEmail } });
    if (!existingProject) {
      const welcomeProject = await prisma.clientProject.create({
        data: {
          name: `Implementación Tecnológica — ${companyName ? String(companyName).trim() : String(name).trim()}`,
          ownerEmail: cleanEmail,
          clientName: String(name).trim(),
          progress: 20,
          stage: 'Análisis',
          eta: '10 días hábiles',
          leadEngineer: 'Edier Mery Gallego (CEO & AI Architect)',
        },
      });

      await prisma.privateDocument.create({
        data: {
          title: 'Ficha Técnica y Guía de Servicios EDMYSOFT.pdf',
          classification: 'CONFIDENCIAL',
          sizeKb: 420,
          contentSummary: 'Documento oficial con alcances técnicos, SLAs de soporte y arquitectura del proyecto.',
          ownerEmail: cleanEmail,
          projectId: welcomeProject.id,
        },
      });

      await prisma.supportTicket.create({
        data: {
          subject: 'Bienvenida al Portal de Clientes EDMYSOFT',
          message: `Hola ${String(name).trim()}, tu cuenta oficial ha sido activada exitosamente. Desde este portal puedes supervisar avances, descargar entregables, solicitar reuniones y abrir tickets prioritarios.`,
          status: 'RESOLVED',
          ownerEmail: cleanEmail,
          clientName: String(name).trim(),
        },
      });
    }

    const sessionUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      redirectTo: '/portal',
    });

    setSessionCookie(response, sessionUser);

    return response;
  } catch (error: any) {
    console.error('Error al registrar usuario oficial:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la cuenta oficial: ' + error.message },
      { status: 500 }
    );
  }
}
