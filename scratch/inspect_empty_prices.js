const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== INSPECCIÓN DE PRECIOS Y CASILLAS VACÍAS ===');

  const modules = await prisma.serviceModule.findMany();
  console.log('\n--- Módulos Adicionales ---');
  for (const m of modules) {
    console.log(`[${m.code}] ${m.name} | Setup: COP ${m.setupPrice} | Mensual: COP ${m.recurringPrice} | Ready: ${m.isTechnicalReady}`);
  }

  const plans = await prisma.plan.findMany({ include: { service: true } });
  console.log('\n--- Planes y Servicios ---');
  for (const p of plans) {
    console.log(`[${p.service.name} - ${p.name}] Setup: COP ${p.setupPrice} | Recurrente: COP ${p.recurringPrice}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
