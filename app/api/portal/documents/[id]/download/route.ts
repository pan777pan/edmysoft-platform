import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// POST /api/portal/documents/[id]/download
// Body: { email: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: '401 Unauthorized: Correo de autenticación requerido para generar firma de descarga' },
        { status: 401 }
      );
    }

    const document = await prisma.privateDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: '404 Not Found: Documento confidencial no encontrado' },
        { status: 404 }
      );
    }

    const isAdmin = email === 'ediergallego59@gmail.com';
    if (document.ownerEmail !== email && !isAdmin) {
      return NextResponse.json(
        {
          error: `403 Forbidden: No tienes privilegios para descargar el documento confidencial ${id} perteneciente a otro cliente`,
        },
        { status: 403 }
      );
    }

    // Generar token firmado temporal (300 segundos = 5 minutos)
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 300 * 1000);

    await prisma.privateDocument.update({
      where: { id },
      data: {
        signedToken: token,
        tokenExpiresAt: expiresAt,
      },
    });

    // Registrar en actividad
    await prisma.activityLog.create({
      data: {
        action: 'DOCUMENT_DOWNLOAD_TOKEN_ISSUED',
        entityType: 'PrivateDocument',
        entityId: id,
        details: JSON.stringify({
          actorEmail: email,
          title: document.title,
          expiresInSeconds: 300,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/portal/documents/${id}/download?token=${token}`,
      title: document.title,
      classification: document.classification,
      sizeKb: document.sizeKb,
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al procesar descarga segura', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/portal/documents/[id]/download?token=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: '401 Unauthorized: Token de firma digital requerido' },
        { status: 401 }
      );
    }

    const doc = await prisma.privateDocument.findUnique({ where: { id } });
    if (!doc || doc.signedToken !== token || !doc.tokenExpiresAt || doc.tokenExpiresAt < new Date()) {
      return NextResponse.json(
        { error: '403 Forbidden: Token de descarga expirado o no coincide con la firma criptográfica' },
        { status: 403 }
      );
    }

    // Retorna archivo simulado estructurado con headers de seguridad
    const dummyContent = Buffer.from(
      `%PDF-1.4\n% EDMYSOFT Technologies\n% Documento: ${doc.title}\n% Clasificacion: ${doc.classification}\n% Propietario: ${doc.ownerEmail}\n%%EOF`
    );

    return new NextResponse(dummyContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${doc.id}_${encodeURIComponent(doc.title)}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al despachar archivo', details: error.message },
      { status: 500 }
    );
  }
}
