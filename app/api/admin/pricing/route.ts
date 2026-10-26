import { NextRequest, NextResponse } from 'next/server';
import { getLivePlans, updatePlan, loadNegotiationConfig, saveNegotiationConfig } from '@/lib/pricing-manager';
import { isAdminRequest } from '@/lib/session';

const isAdmin = isAdminRequest;

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const plans = await getLivePlans();
  const negotiation = loadNegotiationConfig();

  return NextResponse.json({
    success: true,
    plans,
    negotiation,
  });
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { plans, negotiation } = body;

  // Actualizar planes si se enviaron
  if (plans && typeof plans === 'object') {
    for (const [slug, data] of Object.entries(plans)) {
      const p = data as any;
      if (p && typeof p === 'object') {
        await updatePlan(slug, {
          setupPrice: typeof p.setupPrice === 'number' ? p.setupPrice : undefined,
          recurringPrice: typeof p.recurringPrice === 'number' ? p.recurringPrice : undefined,
          description: typeof p.description === 'string' ? p.description : undefined,
          isRecommended: typeof p.isRecommended === 'boolean' ? p.isRecommended : undefined,
          featuresIncluded: Array.isArray(p.featuresIncluded) ? p.featuresIncluded : undefined,
        });
      }
    }
  }

  // Actualizar reglas de regateo
  if (negotiation && typeof negotiation === 'object') {
    saveNegotiationConfig(negotiation);
  }

  const updatedPlans = await getLivePlans();
  const updatedNegotiation = loadNegotiationConfig();

  return NextResponse.json({
    success: true,
    message: 'Precios y reglas de negociación guardados con éxito',
    plans: updatedPlans,
    negotiation: updatedNegotiation,
  });
}
