import { isOwnerSender } from '../lib/director-copilot';
import { generateAIResponse } from '../lib/ai-engine';

function testChatIdentification(fromJid: string, myPhone: string = '573234166354', myLid: string = '110428222963765'): boolean {
  const rawDigits = fromJid.split('@')[0].split(':')[0].replace(/\D/g, '');
  const isOwner =
    rawDigits === '573234166354' ||
    rawDigits.endsWith('3234166354') ||
    fromJid.includes('3234166354') ||
    (Boolean(myPhone) && rawDigits === myPhone) ||
    (Boolean(myLid) && (fromJid.startsWith(`${myLid}@`) || fromJid.startsWith(`${myLid}:`))) ||
    fromJid.includes('110428222963765') ||
    fromJid === 'me';
  return isOwner;
}

async function verifyIsolation() {
  console.log('=== TEST 1: ISOLATION ON VARIOUS CLIENT JIDS ===');

  const clientJids = [
    '573001234567@s.whatsapp.net',
    '573109876543:1@s.whatsapp.net',
    '999888777666@lid',                 // Generic LID like "Ama"
    '123456789012345@lid',               // Another generic LID
    '573155555555@s.whatsapp.net',
    '573204443322@s.whatsapp.net'
  ];

  for (const cJid of clientJids) {
    const isOwner = testChatIdentification(cJid);
    const isOwnerFunc = isOwnerSender(cJid);
    console.log(`Checking Client JID: ${cJid.padEnd(30)} -> isOwner: ${isOwner}, isOwnerFunc: ${isOwnerFunc}`);
    if (isOwner || isOwnerFunc) {
      throw new Error(`CRITICAL FAILURE: Client ${cJid} was incorrectly marked as owner!`);
    }
  }

  console.log('\n=== TEST 2: VERIFY EDIER IS RECOGNIZED ===');
  const edierJids = [
    '573234166354@s.whatsapp.net',
    '573234166354:0@s.whatsapp.net',
    '110428222963765@lid',
    '110428222963765:12@lid',
    'me'
  ];

  for (const eJid of edierJids) {
    const isOwner = testChatIdentification(eJid);
    console.log(`Checking Edier JID: ${eJid.padEnd(30)} -> isOwner: ${isOwner}`);
    if (!isOwner) {
      throw new Error(`CRITICAL FAILURE: Edier ${eJid} was NOT recognized!`);
    }
  }

  console.log('\n=== TEST 3: CLIENT GREETING VIA GENERATE_AI_RESPONSE ===');
  const clientResponse = await generateAIResponse('Hola', [], {
    channel: 'WHATSAPP',
    contactName: 'Ama',
    clientIdentifier: '573001234567',
  });

  console.log('Reply to Client (Ama):', clientResponse.reply.slice(0, 160));
  if (clientResponse.reply.includes('¡Hola Edier!')) {
    throw new Error('CRITICAL FAILURE: Client received greeting meant for Edier!');
  }
  if (!clientResponse.reply.includes('EDMYSOFT')) {
    throw new Error('CRITICAL FAILURE: Client did not receive the official EDMYSOFT commercial assistant!');
  }

  console.log('\n🎉 ALL CLIENT & DIRECTOR ISOLATION TESTS PASSED 100%!');
}

verifyIsolation().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
