import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateQuote } from '@/lib/pricing-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    const quotes = await prisma.quote.findMany({
      where: email ? { contact: { email } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: true,
        opportunity: true,
        items: true,
        recurringCosts: true,
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, quotes });
  } catch (error) {
    console.error('Error listando cotizaciones:', error);
    return NextResponse.json({ success: false, error: 'Error al consultar cotizaciones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contactId, opportunityId, calculationInput, notes, commercialTerms, validDays = 30 } = body;

    if (!contactId || !opportunityId) {
      return NextResponse.json({ success: false, error: 'Faltan contactId u opportunityId' }, { status: 400 });
    }

    // Calcular con el motor financiero determinista
    const calc = await calculateQuote(calculationInput);

    // Generar código consecutivo de cotización
    const count = await prisma.quote.count();
    const quoteNumber = `COT-2026-${String(count + 1).padStart(4, '0')}`;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    // Determinar si requiere aprobación
    const requiresApproval = calc.requiresApproval;
    const approvalReason = calc.approvalReasons.join(' | ');

    // Crear la cotización congelando el snapshot inmutable
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        opportunityId,
        contactId,
        type: calculationInput.planId ? 'STANDARD_PACKAGE' : 'CUSTOM_PROPOSAL',
        status: requiresApproval ? 'PENDING_APPROVAL' : 'DRAFT',
        version: 1,
        setupSubtotal: calc.setupSubtotal,
        setupDiscount: calc.setupDiscount,
        setupTotal: calc.setupTotal,
        recurringTotal: calc.recurringTotal,
        clientDirectTotal: calc.clientDirectTotal,
        depositRequired: calc.depositRequired,
        depositPaid: 0,
        balanceDue: calc.setupTotal,
        currency: 'COP',
        validUntil,
        notes,
        commercialTerms,
        requiresApproval,
        approvalReason: requiresApproval ? approvalReason : null,
        snapshotData: JSON.stringify({
          calcResult: calc,
          input: calculationInput,
          generatedAt: new Date().toISOString(),
        }),
        items: {
          create: calc.items.map((item) => ({
            conceptName: item.conceptName,
            description: item.description,
            setupPrice: item.setupPrice,
            recurringPrice: item.recurringPrice,
            quantity: item.quantity,
            isIncludedInPlan: item.isIncludedInPlan,
          })),
        },
        recurringCosts: {
          create: calc.recurringCosts.map((rc) => ({
            providerName: rc.provider,
            conceptName: rc.concept,
            mode: rc.mode,
            internalCost: rc.internalCost,
            clientPrice: rc.clientPrice,
            estimatedVolume: rc.estimatedVolume,
            notes: rc.notes,
          })),
        },
      },
      include: {
        items: true,
        recurringCosts: true,
      },
    });

    // Registrar en auditoría
    await prisma.activityLog.create({
      data: {
        action: 'QUOTE_CREATED',
        entityType: 'QUOTE',
        entityId: quote.id,
        details: JSON.stringify({ quoteNumber, setupTotal: calc.setupTotal, requiresApproval }),
      },
    });

    return NextResponse.json({ success: true, quote });
  } catch (error) {
    console.error('Error al emitir cotización:', error);
    return NextResponse.json({ success: false, error: 'Error al crear cotización' }, { status: 500 });
  }
}
