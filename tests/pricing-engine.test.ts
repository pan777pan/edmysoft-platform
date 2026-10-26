import { calculateQuote } from '../lib/pricing-engine';
import prisma from '../lib/prisma';

async function runTests() {
  console.log('=== INICIANDO PRUEBAS DE ACEPTACIÓN DEL MOTOR COMERCIAL ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // PRUEBA 1: Caso Económico Real (Fase 8)
    // ----------------------------------------------------
    console.log('--- Prueba 1: Validación del Caso Económico Real de Chatbot Multicanal ---');
    const realQuoteResult = await calculateQuote({
      customItems: [
        {
          conceptName: 'Desarrollo Original Chatbot Multicanal',
          setupPrice: 3760500,
        },
        {
          conceptName: 'Bot de Apoyo Adicional',
          setupPrice: 1650000,
        },
      ],
      depositPercentOrFixed: {
        type: 'FIXED',
        value: 1504200, // Anticipo recibido
      },
      recurringCosts: [
        {
          provider: 'Meta Cloud API',
          concept: 'Consumo WhatsApp',
          mode: 'CLIENT_DIRECT',
          internalCost: 0,
          clientPrice: 150000,
        },
        {
          provider: 'OpenRouter',
          concept: 'Tokens Claude',
          mode: 'CLIENT_DIRECT',
          internalCost: 0,
          clientPrice: 80000,
        },
        {
          provider: 'Hetzner VPS',
          concept: 'Hosting Servidor',
          mode: 'CLIENT_DIRECT',
          internalCost: 0,
          clientPrice: 90000,
        },
      ],
    });

    assert(realQuoteResult.setupTotal === 5410500, 'Total de implementación suma exactamente $5.410.500 COP');
    assert(realQuoteResult.depositRequired === 1504200, 'Anticipo calculado es exactamente $1.504.200 COP');
    assert(realQuoteResult.balanceDue === 3906300, 'Saldo pendiente es exactamente $3.906.300 COP (5.410.500 - 1.504.200)');
    assert(realQuoteResult.recurringTotal === 0, 'Costes recurrentes facturados por EDMYSOFT son $0 (los 3 son pagados a terceros)');
    assert(realQuoteResult.clientDirectTotal === 320000, 'Costes de terceros informados al cliente suman $320.000 COP sin sumarse a EDMYSOFT');

    // ----------------------------------------------------
    // PRUEBA 2: Deduplicación de Inclusiones en Planes
    // ----------------------------------------------------
    console.log('\n--- Prueba 2: Deduplicación de módulos ya incluidos en el Plan ---');
    const enterprisePlan = await prisma.plan.findFirst({
      where: { slug: 'enterprise' },
    });
    const pdfModule = await prisma.serviceModule.findFirst({
      where: { code: 'MOD_COTIZADOR_PDF' },
    });

    if (enterprisePlan && pdfModule) {
      const planQuote = await calculateQuote({
        planId: enterprisePlan.id,
        selectedModuleIds: [pdfModule.id],
      });

      const pdfItem = planQuote.items.find((i) => i.conceptName === pdfModule.name);
      assert(pdfItem !== undefined && pdfItem.isIncludedInPlan === true, 'El módulo de PDF se detecta como INCLUIDO en el plan Enterprise');
      assert(pdfItem?.setupPrice === 0, 'El precio de setup del módulo incluido se cobra en $0 COP (no hay doble cargo)');
      assert(planQuote.setupSubtotal === enterprisePlan.setupPrice, 'El subtotal corresponde únicamente al setup del plan');
    } else {
      console.error('No se encontró el plan Enterprise o el módulo de PDF para la prueba 2.');
      failed++;
    }

    // ----------------------------------------------------
    // PRUEBA 3: Costes Recurrentes en Modo 1 (INCLUDED) y Modo 2 (BILLED_SEPARATELY)
    // ----------------------------------------------------
    console.log('\n--- Prueba 3: Comportamiento de Modos 1 y 2 de Costes Recurrentes ---');
    const recurringTest = await calculateQuote({
      customItems: [{ conceptName: 'Mantenimiento Preventivo', setupPrice: 1000000 }],
      recurringCosts: [
        {
          provider: 'EDMYSOFT Soporte',
          concept: 'Monitoreo 24/7',
          mode: 'INCLUDED',
          internalCost: 50000,
          clientPrice: 120000,
        },
        {
          provider: 'EDMYSOFT Cloud',
          concept: 'Licencia Premium',
          mode: 'BILLED_SEPARATELY',
          internalCost: 80000,
          clientPrice: 200000,
        },
      ],
    });

    assert(recurringTest.recurringTotal === 200000, 'Solo la partida BILLED_SEPARATELY ($200.000) se suma al cobro recurrente');
    const includedCost = recurringTest.recurringCosts.find((c) => c.mode === 'INCLUDED');
    assert(includedCost?.clientPrice === 0, 'La partida INCLUDED se presenta con precio al cliente de $0');

    // ----------------------------------------------------
    // PRUEBA 4: Inmutabilidad de Cotizaciones Históricas
    // ----------------------------------------------------
    console.log('\n--- Prueba 4: Verificación de Inmutabilidad de Cotización Histórica ---');
    const existingQuote = await prisma.quote.findUnique({
      where: { quoteNumber: 'COT-2026-0001' },
    });
    assert(existingQuote !== null, 'Existe la cotización histórica COT-2026-0001 en base de datos');
    assert(existingQuote?.setupTotal === 5410500, 'El valor congelado es $5.410.500 COP');
    assert(existingQuote?.depositPaid === 1504200, 'El anticipo registrado es $1.504.200 COP');
    assert(existingQuote?.balanceDue === 3906300, 'El saldo registrado es $3.906.300 COP');

    console.log(`\n========================================`);
    console.log(`RESULTADO DE PRUEBAS: ${passed} PASADAS / ${failed} FALLADAS`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error('Error durante la ejecución de pruebas:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
