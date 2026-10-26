const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDB() {
  try {
    const userCount = await prisma.user.count();
    const serviceCount = await prisma.service.count();
    const planCount = await prisma.plan.count();
    const moduleCount = await prisma.serviceModule.count();
    const convCount = await prisma.conversation.count();
    const msgCount = await prisma.message.count();
    const quoteCount = await prisma.quote.count();
    const contactCount = await prisma.contact.count();
    const oppCount = await prisma.opportunity.count();
    const activityCount = await prisma.activityLog.count();

    console.log('Database Status: CONNECTED');
    console.log(JSON.stringify({
      userCount,
      serviceCount,
      planCount,
      moduleCount,
      convCount,
      msgCount,
      quoteCount,
      contactCount,
      oppCount,
      activityCount
    }, null, 2));

    // Test a read operation
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
    console.log('Sample Users:', JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Database Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
