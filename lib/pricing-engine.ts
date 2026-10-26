import { QuoteCalculationInput, QuoteCalculationResult, RecurringCostItem } from './types';
import prisma from './prisma';

/**
 * Motor Financiero Determinista de EDMYSOFT.
 * Garantiza precisión monetaria, elimina dobles cobros y aplica las reglas de aprobación.
 */
export async function calculateQuote(input: QuoteCalculationInput): Promise<QuoteCalculationResult> {
  const items: QuoteCalculationResult['items'] = [];
  const approvalReasons: string[] = [];
  let setupSubtotal = 0;
  let recurringTotal = 0;
  let clientDirectTotal = 0;
  let internalEstimatedCost = 0;

  // 1. Si incluye un Plan del catálogo
  if (input.planId) {
    const plan = await prisma.plan.findUnique({
      where: { id: input.planId },
      include: {
        service: true,
        moduleOverrides: {
          include: { module: true },
        },
      },
    });

    if (plan) {
      items.push({
        conceptName: `${plan.service.name} — Plan ${plan.name}`,
        description: plan.description || undefined,
        setupPrice: plan.setupPrice,
        recurringPrice: plan.recurringPrice,
        isIncludedInPlan: false,
        quantity: 1,
      });

      setupSubtotal += plan.setupPrice;
      recurringTotal += plan.recurringPrice;

      // Evaluar módulos seleccionados contra las reglas del plan
      if (input.selectedModuleIds && input.selectedModuleIds.length > 0) {
        const modules = await prisma.serviceModule.findMany({
          where: { id: { in: input.selectedModuleIds } },
        });

        for (const mod of modules) {
          const override = plan.moduleOverrides.find((o) => o.moduleId === mod.id);
          const rule = override ? override.rule : mod.defaultRule;

          if (rule === 'INCOMPATIBLE') {
            approvalReasons.push(`El módulo "${mod.name}" está marcado como incompatible con el plan "${plan.name}".`);
          }

          const isIncluded = rule === 'INCLUDED';
          const setup = isIncluded ? 0 : (override?.customSetupPrice ?? mod.setupPrice);
          const recurring = isIncluded ? 0 : (override?.customRecPrice ?? mod.recurringPrice);

          items.push({
            conceptName: mod.name,
            description: mod.description,
            setupPrice: setup,
            recurringPrice: recurring,
            isIncludedInPlan: isIncluded,
            quantity: 1,
          });

          setupSubtotal += setup;
          recurringTotal += recurring;
        }
      }
    }
  }

  // 2. Partidas personalizadas (Camino B o adicionales)
  if (input.customItems && input.customItems.length > 0) {
    for (const custom of input.customItems) {
      items.push({
        conceptName: custom.conceptName,
        description: custom.description,
        setupPrice: custom.setupPrice,
        recurringPrice: custom.recurringPrice || 0,
        isIncludedInPlan: false,
        quantity: 1,
      });

      setupSubtotal += custom.setupPrice;
      recurringTotal += custom.recurringPrice || 0;
    }
    approvalReasons.push('La propuesta contiene partidas personalizadas que requieren validación técnica.');
  }

  // 3. Descuentos y Total de Implementación
  const setupDiscount = Math.max(0, input.discountAmount || 0);
  if (setupDiscount > 0) {
    const discountPercent = setupSubtotal > 0 ? (setupDiscount / setupSubtotal) * 100 : 100;
    if (discountPercent > 10) {
      approvalReasons.push(`Descuento de $${setupDiscount.toLocaleString('es-CO')} (${discountPercent.toFixed(1)}%) supera el umbral autónomo permitido del 10%.`);
    }
  }
  const setupTotal = Math.max(0, setupSubtotal - setupDiscount);

  // 4. Costes Recurrentes (Clasificación estricta de 3 Modos)
  const processedRecurringCosts: RecurringCostItem[] = [];
  if (input.recurringCosts && input.recurringCosts.length > 0) {
    for (const cost of input.recurringCosts) {
      internalEstimatedCost += cost.internalCost || 0;

      if (cost.mode === 'INCLUDED') {
        processedRecurringCosts.push({
          ...cost,
          clientPrice: 0, // No se le suma cobro extra al cliente
        });
      } else if (cost.mode === 'BILLED_SEPARATELY') {
        recurringTotal += cost.clientPrice;
        processedRecurringCosts.push(cost);
      } else if (cost.mode === 'CLIENT_DIRECT') {
        clientDirectTotal += cost.clientPrice;
        processedRecurringCosts.push(cost);
      }
    }
  }

  // 5. Cálculo de Anticipo
  let depositRequired = 0;
  if (input.depositPercentOrFixed) {
    if (input.depositPercentOrFixed.type === 'PERCENT') {
      depositRequired = Math.round((setupTotal * input.depositPercentOrFixed.value) / 100);
    } else {
      depositRequired = Math.min(setupTotal, input.depositPercentOrFixed.value);
    }
  } else {
    // Anticipo predeterminado del 50%
    depositRequired = Math.round(setupTotal * 0.5);
  }

  const balanceDue = Math.max(0, setupTotal - depositRequired);

  return {
    setupSubtotal,
    setupDiscount,
    setupTotal,
    recurringTotal,
    clientDirectTotal,
    internalEstimatedCost,
    depositRequired,
    balanceDue,
    items,
    recurringCosts: processedRecurringCosts,
    requiresApproval: approvalReasons.length > 0,
    approvalReasons,
  };
}
