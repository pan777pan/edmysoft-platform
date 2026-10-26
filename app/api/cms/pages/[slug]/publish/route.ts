import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const { publishedBy = 'Edier Mery Gallego' } = body;

    const page = await prisma.pageContent.findUnique({
      where: { slug },
      include: { sections: true, revisions: { orderBy: { version: 'desc' }, take: 1 } },
    });

    if (!page) {
      return NextResponse.json({ success: false, error: 'Página no encontrada' }, { status: 404 });
    }

    const nextVersion = (page.revisions[0]?.version || 0) + 1;

    // Crear revisión histórica inmutable
    const revision = await prisma.contentRevision.create({
      data: {
        pageId: page.id,
        version: nextVersion,
        snapshot: JSON.stringify({
          pageTitle: page.title,
          seoTitle: page.seoTitle,
          seoDesc: page.seoDesc,
          sections: page.sections,
          publishedAt: new Date().toISOString(),
        }),
        publishedBy,
      },
    });

    // Publicar página
    const updated = await prisma.pageContent.update({
      where: { slug },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'CMS_PAGE_PUBLISHED',
        entityType: 'PAGE_CONTENT',
        entityId: page.id,
        details: JSON.stringify({ slug, version: nextVersion, publishedBy }),
      },
    });

    return NextResponse.json({ success: true, page: updated, version: nextVersion });
  } catch (error) {
    console.error('Error publicando cambios en CMS:', error);
    return NextResponse.json({ success: false, error: 'Error al publicar' }, { status: 500 });
  }
}
