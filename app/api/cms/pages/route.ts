import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const pages = await prisma.pageContent.findMany({
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
        revisions: {
          orderBy: { version: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json({ success: true, pages });
  } catch (error) {
    console.error('Error listando páginas del CMS:', error);
    return NextResponse.json({ success: false, error: 'Error al consultar CMS' }, { status: 500 });
  }
}
