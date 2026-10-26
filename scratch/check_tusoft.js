const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
  console.log('Available models:', models.join(', '));
  
  const svcs = await prisma.service.findMany({
    where: {
      OR: [
        { shortDesc: { contains: 'TuSoft' } },
        { longDesc: { contains: 'TuSoft' } },
        { features: { contains: 'TuSoft' } }
      ]
    }
  });

  const mods = await prisma.serviceModule.findMany({
    where: {
      description: { contains: 'TuSoft' }
    }
  });

  const settings = await prisma.systemSetting.findMany({
    where: {
      value: { contains: 'TuSoft' }
    }
  });

  console.log(`TuSoft found in Service: ${svcs.length}, ServiceModule: ${mods.length}, SystemSetting: ${settings.length}`);
  await prisma.$disconnect();
}

main().catch(console.error);
