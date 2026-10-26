import { NextRequest, NextResponse } from 'next/server';
import { calculateQuote } from '@/lib/pricing-engine';
import { QuoteCalculationInput } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body: QuoteCalculationInput = await req.json();
    const result = await calculateQuote(body);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error calculando cotización:', error);
    return NextResponse.json({ success: false, error: 'Error en el cálculo' }, { status: 500 });
  }
}
