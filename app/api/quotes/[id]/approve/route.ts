import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action, approvedById } = await req.json(); // action: "APPROVE" | "REJECT"

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 });
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        status: newStatus,
        requiresApproval: false,
        approvedById: action === 'APPROVE' ? approvedById : null,
        approvedAt: action === 'APPROVE' ? new Date() : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: approvedById,
        action: action === 'APPROVE' ? 'QUOTE_APPROVED' : 'QUOTE_REJECTED',
        entityType: 'QUOTE',
        entityId: id,
        details: JSON.stringify({ quoteNumber: quote.quoteNumber, newStatus }),
      },
    });

    return NextResponse.json({ success: true, quote: updated });
  } catch (error) {
    console.error('Error aprobando cotización:', error);
    return NextResponse.json({ success: false, error: 'Error al procesar aprobación' }, { status: 500 });
  }
}
