const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const contacts = await prisma.contact.findMany({
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }
    }
  });

  for (const c of contacts) {
    console.log(`=== CONTACT: ${c.fullName} (${c.phone}) ===`);
    for (const conv of c.conversations) {
      console.log(`  Conversation ${conv.id} (status: ${conv.status}):`);
      for (const m of conv.messages) {
        console.log(`    [${m.senderType}] ${m.senderName}: ${m.content.replace(/\n/g, ' ')}`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
