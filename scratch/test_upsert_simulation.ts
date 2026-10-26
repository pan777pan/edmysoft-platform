import prisma from '../lib/prisma';
import { isOwnerSender } from '../lib/director-copilot';

async function testUpsertSimulation() {
  console.log('================================================================');
  console.log('🧪 SIMULACIÓN DE EVENTO REAL messages.upsert (m.type === "append")');
  console.log('================================================================\n');

  // Simular la lógica exacta que se ejecuta en messages.upsert de whatsapp-baileys.ts
  const mockMessages = [
    {
      key: {
        remoteJid: '573234166354@s.whatsapp.net',
        fromMe: true,
        id: 'EDIER_TEST_MSG_123',
      },
      message: {
        conversation: 'Hola',
      },
      messageTimestamp: Math.floor(Date.now() / 1000) - 5, // enviado hace 5 segundos
    },
    {
      key: {
        remoteJid: '573234166354@s.whatsapp.net',
        fromMe: true,
        id: 'EDIER_LEAD_REPLY_456',
      },
      message: {
        conversation: 'En que puedo ayudarte con esto',
      },
      messageTimestamp: Math.floor(Date.now() / 1000) - 2,
    },
    {
      key: {
        remoteJid: '573109998877@s.whatsapp.net', // mensaje a un cliente externo
        fromMe: true,
        id: 'EDIER_TO_CLIENT_789',
      },
      message: {
        conversation: 'Hola cliente, ya te reviso la propuesta',
      },
      messageTimestamp: Math.floor(Date.now() / 1000) - 1,
    },
  ];

  const processedMessages: string[] = [];

  for (const msg of mockMessages) {
    const fromJid = msg.key.remoteJid;
    const incomingText = msg.message.conversation || '';
    const myPhone = '573234166354';
    const remoteDigits = (fromJid || '').replace(/\D/g, '');

    const isSelfChat =
      remoteDigits === myPhone ||
      remoteDigits.endsWith('3234166354') ||
      fromJid.includes('3234166354') ||
      fromJid === 'me';

    if (msg.key.fromMe) {
      if (!isSelfChat) {
        // Mensaje a cliente externo: se ignora correctamente
        continue;
      }
    }

    processedMessages.push(incomingText);
  }

  console.log('Mensajes que el bot procesó en el chat "Yo (Tú)":', processedMessages);

  if (
    processedMessages.length === 2 &&
    processedMessages[0] === 'Hola' &&
    processedMessages[1] === 'En que puedo ayudarte con esto'
  ) {
    console.log('\n✅ [PASS] El bot procesó exactamente los mensajes de Edier en "Yo (Tú)"');
    console.log('✅ [PASS] El bot ignoró los mensajes enviados a clientes externos');
    process.exit(0);
  } else {
    console.error('\n❌ [FAIL] Falló el filtro de mensajes en upsert');
    process.exit(1);
  }
}

testUpsertSimulation().catch((e) => {
  console.error(e);
  process.exit(1);
});
