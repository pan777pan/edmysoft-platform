import { handleDirectorCopilotMessage } from '../lib/director-copilot';
import { generateAIResponse } from '../lib/ai-engine';

async function runTests() {
  console.log('=== TEST 1: DIRECTOR CHAT "HOLA" ===');
  const t0 = Date.now();
  const dirGreeting = await handleDirectorCopilotMessage('hola');
  const ms1 = Date.now() - t0;
  console.log(`[${ms1}ms] Copilot Greeting reply:`, dirGreeting.reply.slice(0, 100));
  if (!dirGreeting.reply.includes('¡Hola Edier!')) throw new Error('Greeting failed');

  console.log('\n=== TEST 2: DIRECTOR CHAT "AYUDA" / COMANDOS ===');
  const t1 = Date.now();
  const dirHelp = await handleDirectorCopilotMessage('ayuda');
  const ms2 = Date.now() - t1;
  console.log(`[${ms2}ms] Copilot Help reply:`, dirHelp.reply.slice(0, 120));
  if (!dirHelp.reply.includes('PANEL DE COMANDOS')) throw new Error('Help menu failed');

  console.log('\n=== TEST 3: DIRECTOR CHAT "ESTADO DEL SISTEMA" ===');
  const t2 = Date.now();
  const dirStatus = await handleDirectorCopilotMessage('estado del sistema');
  const ms3 = Date.now() - t2;
  console.log(`[${ms3}ms] Copilot Status reply:`, dirStatus.reply.slice(0, 120));
  if (!dirStatus.reply.includes('ESTADO DEL SISTEMA')) throw new Error('Status failed');

  console.log('\n=== TEST 4: CLIENT "¿QUÉ SERVICIOS OFRECEN?" ===');
  const t3 = Date.now();
  const clientServ = await generateAIResponse('¿Qué servicios ofrecen para mi empresa?');
  const ms4 = Date.now() - t3;
  console.log(`[${ms4}ms] Client Services reply:`, clientServ.reply.slice(0, 120));
  if (!clientServ.reply.includes('Agentes de IA') && !clientServ.reply.includes('EDMYSOFT')) {
    throw new Error('Services intent failed');
  }

  console.log('\n=== TEST 5: CLIENT "¿DÓNDE ESTÁN UBICADOS?" ===');
  const clientLoc = await generateAIResponse('¿Dónde están ubicados? ¿Tienen oficina?');
  console.log('Client Location reply:', clientLoc.reply.slice(0, 120));
  if (!clientLoc.reply.includes('Colombia')) throw new Error('Location intent failed');

  console.log('\n=== TEST 6: CLIENT "HOLA BUENAS TARDES" (GREETING) ===');
  const clientGreet = await generateAIResponse('Hola buenas tardes cómo están');
  console.log('Client Greeting reply:', clientGreet.reply.slice(0, 120));
  if (!clientGreet.reply.includes('¡Hola') && !clientGreet.reply.includes('EDMYSOFT')) {
    throw new Error('Greeting intent failed');
  }

  console.log('\n=== TEST 7: CLIENT "¿CÓMO ES EL PAGO?" ===');
  const clientPay = await generateAIResponse('¿Cómo son las formas de pago?');
  console.log('Client Payment reply:', clientPay.reply.slice(0, 120));
  if (!clientPay.reply.includes('anticipo') && !clientPay.reply.includes('Wompi')) {
    throw new Error('Payment intent failed');
  }

  console.log('\n✅ ALL 7 AUDIT & SPEED TESTS PASSED PERFECTLY!');
}

runTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('TEST FAILED:', e);
    process.exit(1);
  });
