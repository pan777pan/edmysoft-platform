const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- ACTUALIZANDO SOPORTE PRIORITARIO Y SERVICIOS EN BASE DE DATOS ---');

  // 1. Plans (Planes de precios)
  const plans = await prisma.plan.findMany();
  for (const p of plans) {
    let updated = false;
    let feat = p.featuresIncluded || '';
    if (feat.includes('Soporte prioritario TuSoft')) {
      feat = feat.replace(/Soporte prioritario TuSoft/g, 'Soporte prioritario por EDMYSOFT');
      updated = true;
    }
    if (feat.includes('TuSoft')) {
      feat = feat.replace(/TuSoft/g, 'EDMYSOFT');
      updated = true;
    }
    let desc = p.description || '';
    if (desc.includes('TuSoft')) {
      desc = desc.replace(/TuSoft/g, 'EDMYSOFT');
      updated = true;
    }

    if (updated) {
      await prisma.plan.update({
        where: { id: p.id },
        data: { featuresIncluded: feat, description: desc },
      });
      console.log(`Plan actualizado: ${p.name}`);
    }
  }

  // 2. Services
  const services = await prisma.service.findMany();
  for (const s of services) {
    let updated = false;
    let feat = s.features || '';
    if (feat.includes('Soporte prioritario TuSoft')) {
      feat = feat.replace(/Soporte prioritario TuSoft/g, 'Soporte prioritario por EDMYSOFT');
      updated = true;
    }
    if (feat.includes('TuSoft')) {
      feat = feat.replace(/TuSoft/g, 'EDMYSOFT');
      updated = true;
    }
    let longDesc = s.longDesc || '';
    if (longDesc.includes('TuSoft')) {
      longDesc = longDesc.replace(/TuSoft/g, 'EDMYSOFT');
      updated = true;
    }

    if (updated) {
      await prisma.service.update({
        where: { id: s.id },
        data: { features: feat, longDesc },
      });
      console.log(`Servicio actualizado: ${s.name}`);
    }
  }

  // 3. SystemSetting
  const settings = await prisma.systemSetting.findMany();
  for (const c of settings) {
    if (c.value && c.value.includes('TuSoft')) {
      const newVal = c.value.replace(/Backed by TuSoft/g, 'Respaldado por EDMYSOFT').replace(/TuSoft/g, 'EDMYSOFT');
      await prisma.systemSetting.update({
        where: { id: c.id },
        data: { value: newVal },
      });
      console.log(`Setting actualizado: ${c.key}`);
    }
  }

  // 4. PageSection
  const sections = await prisma.pageSection.findMany();
  for (const sec of sections) {
    let updated = false;
    let content = sec.content || '';
    if (content.includes('Soporte prioritario TuSoft')) {
      content = content.replace(/Soporte prioritario TuSoft/g, 'Soporte prioritario por EDMYSOFT');
      updated = true;
    }
    if (updated) {
      await prisma.pageSection.update({
        where: { id: sec.id },
        data: { content },
      });
      console.log(`Sección actualizada: ${sec.sectionKey}`);
    }
  }

  console.log('--- Base de datos actualizada con éxito ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
