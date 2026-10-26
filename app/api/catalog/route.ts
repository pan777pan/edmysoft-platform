import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { order: 'asc' },
      include: {
        plans: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        modules: {
          where: { isActive: true },
        },
      },
    });

    const parsedServices = services.map((s) => ({
      ...s,
      features: typeof s.features === 'string' ? JSON.parse(s.features) : s.features,
      problemsSolved: s.problemsSolved ? (typeof s.problemsSolved === 'string' ? JSON.parse(s.problemsSolved) : s.problemsSolved) : [],
      useCases: s.useCases ? (typeof s.useCases === 'string' ? JSON.parse(s.useCases) : s.useCases) : [],
      plans: s.plans.map((p) => ({
        ...p,
        featuresIncluded: typeof p.featuresIncluded === 'string' ? JSON.parse(p.featuresIncluded) : p.featuresIncluded,
        usageLimits: p.usageLimits ? (typeof p.usageLimits === 'string' ? JSON.parse(p.usageLimits) : p.usageLimits) : null,
      })),
    }));

    return NextResponse.json({ success: true, services: parsedServices });
  } catch (error) {
    console.error('Error al obtener catálogo:', error);
    return NextResponse.json({ success: false, error: 'Error al consultar catálogo' }, { status: 500 });
  }
}
