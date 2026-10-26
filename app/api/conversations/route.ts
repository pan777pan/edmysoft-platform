import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: { lastMessageAt: 'desc' },
      include: {
        contact: {
          include: {
            opportunities: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            quotes: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        aiLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error('Error listando conversaciones:', error);
    return NextResponse.json({ success: false, error: 'Error al listar conversaciones' }, { status: 500 });
  }
}
