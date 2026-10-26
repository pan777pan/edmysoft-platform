import { isOwnerSender, handleDirectorCopilotMessage } from '../lib/director-copilot';

async function testSelfChat() {
  console.log('================================================================');
  console.log('🧪 PRUEBA ESPECÍFICA: CHAT CONSIGO MISMO EN WHATSAPP "Yo (Tú)"');
  console.log('================================================================\n');

  const myPhone = '573234166354';
  const otherPhone = '573109988776';

  let passed = 0;
  let total = 0;

  function assert(title: string, ok: boolean, detail?: string) {
    total++;
    if (ok) {
      passed++;
      console.log(`✅ [PASS] ${title}`);
      if (detail) console.log(`   ↳ ${detail}`);
    } else {
      console.error(`❌ [FAIL] ${title}`);
      if (detail) console.error(`   ↳ ${detail}`);
    }
  }

  // 1. Identificación de remitente y chat propio
  assert('Owner phone 573234166354 reconocido como dueño', isOwnerSender(myPhone));
  assert('Other phone 573109988776 NO es reconocido como dueño', !isOwnerSender(otherPhone));

  // 2. Simulación de mensaje "Hola" escrito por Edier en su propio chat
  console.log('\n--- CASO 1: Edier escribe "Hola" en "Yo (Tú)" ---');
  const greetingRes = await handleDirectorCopilotMessage('Hola', [], myPhone);
  assert(
    'Respuesta a "Hola" saluda al Director Edier y ofrece asistencia ejecutiva',
    greetingRes.reply.includes('Edier') && greetingRes.reply.includes('EDMYSOFT'),
    greetingRes.reply.split('\n')[0]
  );

  // 3. Simulación de mensaje "En que puedo ayudarte con esto" respondiendo a un lead
  console.log('\n--- CASO 2: Edier responde a la notificación: "En que puedo ayudarte con esto" ---');
  const leadGuidanceRes = await handleDirectorCopilotMessage('En que puedo ayudarte con esto', [], myPhone);
  assert(
    'Respuesta táctica orienta a Edier sobre cómo abordar el lead y cerrar la venta',
    leadGuidanceRes.reply.includes('Estrategia Comercial para el Lead Reciente') &&
      leadGuidanceRes.reply.includes('Plan Plus'),
    leadGuidanceRes.reply.split('\n')[0]
  );

  // 4. Modificación de catálogo desde "Yo (Tú)"
  console.log('\n--- CASO 3: Edier envía comando de precios desde "Yo (Tú)" ---');
  const priceCmdRes = await handleDirectorCopilotMessage('muestra los precios actuales de la pagina', [], myPhone);
  assert(
    'Comando de catálogo devuelve las tarifas en vivo de la plataforma',
    priceCmdRes.reply.includes('CATÁLOGO DE PRECIOS EN VIVO'),
    priceCmdRes.reply.split('\n')[0]
  );

  console.log('\n================================================================');
  console.log(`📊 RESULTADO: ${passed}/${total} PRUEBAS APROBADAS (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testSelfChat().catch((e) => {
  console.error(e);
  process.exit(1);
});
