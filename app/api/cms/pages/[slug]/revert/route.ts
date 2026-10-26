import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { revisionId } = await req.json();

    const revision = await prisma.contentRevision.findUnique({
      where: { id: revisionId },
    });

    if (!revision) {
      return NextResponse.json({ success: false, error: 'Revisión no encontrada' }, { status: 404 });
    }

    const snapshot = JSON.parse(revision.snapshot);

    // Restaurar metadatos de la página
    await prisma.pageContent.update({
      where: { slug },
      data: {
        title: snapshot.pageTitle,
        seoTitle: snapshot.seoTitle,
        seoDesc: snapshot.seoDesc,
        status: 'PUBLISHED',
      },
    });

    // Restaurar secciones del snapshot
    if (Array.isArray(snapshot.sections)) {
      for (const sec of snapshot.sections) {
        await prisma.pageSection.upsert({
          where: { id: sec.id },
          create: {
            pageId: revision.pageId,
            sectionKey: sec.sectionKey,
            title: sec.title,
            subtitle: sec.subtitle,
            content: sec.content,
            order: sec.order,
            isVisible: sec.isVisible,
          },
          update: {
            title: sec.title,
            subtitle: sec.subtitle,
            content: sec.content,
            order: sec.order,
            isVisible: sec.isVisible,
          },
        });
      }
    }

    await prisma.activityLog.create({
      data: {
        action: 'CMS_PAGE_REVERTED',
        entityType: 'PAGE_CONTENT',
        entityId: revision.pageId,
        details: JSON.stringify({ slug, versionRestored: revision.version }),
      },
    });

    return NextResponse.json({ success: true, message: `Página revertida exitosamente a la versión ${revision.version}` });
  } catch (error) {
    console.error('Error revirtiendo versión del CMS:', error);
    return NextResponse.json({ success: false, error: 'Error al revertir versión' }, { status: 500 });
  }
}
