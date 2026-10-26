import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const page = await prisma.pageContent.findUnique({
      where: { slug },
      include: {
        sections: { orderBy: { order: 'asc' } },
        revisions: { orderBy: { version: 'desc' }, take: 10 },
      },
    });

    if (!page) {
      return NextResponse.json({ success: false, error: 'Página no encontrada' }, { status: 404 });
    }

    const parsedSections = page.sections.map((s) => ({
      ...s,
      content: typeof s.content === 'string' ? JSON.parse(s.content) : s.content,
    }));

    return NextResponse.json({ success: true, page: { ...page, sections: parsedSections } });
  } catch (error) {
    console.error('Error obteniendo página del CMS:', error);
    return NextResponse.json({ success: false, error: 'Error al consultar página' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { title, seoTitle, seoDesc, sections } = body;

    const page = await prisma.pageContent.findUnique({ where: { slug } });
    if (!page) {
      return NextResponse.json({ success: false, error: 'Página no encontrada' }, { status: 404 });
    }

    // Actualizar datos de página
    await prisma.pageContent.update({
      where: { slug },
      data: {
        title,
        seoTitle,
        seoDesc,
        status: 'DRAFT', // Cambios pendientes de publicar
      },
    });

    // Actualizar secciones
    if (Array.isArray(sections)) {
      for (const sec of sections) {
        if (sec.id) {
          await prisma.pageSection.update({
            where: { id: sec.id },
            data: {
              title: sec.title,
              subtitle: sec.subtitle,
              content: typeof sec.content === 'string' ? sec.content : JSON.stringify(sec.content),
              order: sec.order || 0,
              isVisible: sec.isVisible !== undefined ? sec.isVisible : true,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Borrador guardado exitosamente' });
  } catch (error) {
    console.error('Error guardando borrador del CMS:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar borrador' }, { status: 500 });
  }
}
