import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/portal/documents?email=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: '401 Unauthorized: Sesión requerida para consultar la bóveda documental' },
        { status: 401 }
      );
    }

    const isAdmin = email === 'ediergallego59@gmail.com';
    const documents = await prisma.privateDocument.findMany({
      where: isAdmin ? {} : { ownerEmail: email },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      documents,
      count: documents.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al consultar documentos', details: error.message },
      { status: 500 }
    );
  }
}
