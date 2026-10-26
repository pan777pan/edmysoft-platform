import prisma from '../lib/prisma';

async function check() {
  const row = await prisma.whatsAppConnection.findFirst();
  console.log('WHATSAPP ROW:', row);
}

check().then(() => process.exit(0)).catch(e => {
  console.error('ERR:', e);
  process.exit(1);
});
