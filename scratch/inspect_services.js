const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const srvs = await prisma.service.findMany({ include: { plans: true } });
  for (const s of srvs) {
    console.log(`\nServicio: [${s.slug}] ${s.name} (${s.category})`);
    console.log(`Short: ${s.shortDesc}`);
    console.log(`Planes (${s.plans.length}):`);
    for (const p of s.plans) {
      console.log(`  - ${p.name}: Setup COP ${p.setupPrice} | Mensual COP ${p.recurringPrice}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
