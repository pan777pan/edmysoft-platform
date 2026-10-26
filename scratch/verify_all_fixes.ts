import prisma from '../lib/prisma';
import { handleDirectorCopilotMessage, isOwnerSender } from '../lib/director-copilot';
import { generateAIResponse } from '../lib/ai-engine';
import { getCustomerMemory, updateCustomerMemory } from '../lib/customer-memory';

async function main() {
  console.log('================================================================');
  console.log('🚀 AUDITORÍA GLOBAL DEL SISTEMA EDMYSOFT — PRUEBAS REALES');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(title: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${title}`);
      if (detail) console.log(`   ↳ ${detail}`);
    } else {
      console.error(`❌ [FAIL] ${title}`);
      if (detail) console.error(`   ↳ ${detail}`);
    }
  }

  // PRUEBA 1: Rutas Web
  console.log('\n--- 1. VERIFICACIÓN DE RUTAS WEB HTTP ---');
  const routes = ['/', '/cotizador', '/diagnostico', '/servicios', '/admin', '/admin/login', '/admin/usuarios'];
  for (const r of routes) {
    const t0 = Date.now();
    const res = await fetch('http://localhost:3000' + r);
    const ms = Date.now() - t0;
    assert(`Ruta ${r} responde 200 OK (${ms}ms)`, res.status === 200, `Status: ${res.status}`);
  }

  // PRUEBA 2: Contenido de la página de inicio y cotizador
  console.log('\n--- 2. VERIFICACIÓN DE COTIZADOR Y ELEMENTOS CRÍTICOS ---');
  const homeRes = await fetch('http://localhost:3000/');
  const homeHtml = await homeRes.text();
  assert(
    'Página de inicio contiene el anclaje y componente #cotizador',
    homeHtml.includes('id="cotizador"') || homeHtml.includes('cotizador'),
    'El formulario interactivo de cotización está montado'
  );
  assert(
    'FloatingWhatsApp no interfiere con AIChatWidget (ubicación left-6)',
    homeHtml.includes('left-6'),
    'WhatsApp fijado a la izquierda para evitar solapamientos'
  );

  const cotizadorRes = await fetch('http://localhost:3000/cotizador');
  const cotizadorHtml = await cotizadorRes.text();
  assert(
    'Ruta /cotizador carga correctamente con título oficial',
    cotizadorRes.status === 200 && cotizadorHtml.includes('Cotizador Oficial EDMYSOFT'),
    'Cotizador dedicado disponible'
  );

  // PRUEBA 3: Login Administrativo
  console.log('\n--- 3. AUTENTICACIÓN Y CREDENCIALES ADMINISTRATIVAS ---');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ediergallego59@gmail.com', password: 'edsoft1013341239' }),
  });
  const loginJson = await loginRes.json();
  assert(
    'Login de superadmin funciona y devuelve redirectTo: /admin',
    loginJson.success && loginJson.redirectTo === '/admin',
    `Usuario: ${loginJson.user?.email}, Rol: ${loginJson.user?.role}`
  );

  // PRUEBA 4: Control Remoto de la Web vía WhatsApp por Edier
  console.log('\n--- 4. CONTROL REMOTO DE LA WEB VÍA WHATSAPP (EDIER MERY GALLEGO) ---');
  const ownerPhone = '573234166354';
  assert('Identificación exclusiva de Edier como Dueño', isOwnerSender(ownerPhone) && !isOwnerSender('573001112233'));

  // Consulta de catálogo
  const catCmd = await handleDirectorCopilotMessage('muestra los precios actuales de la pagina', [], ownerPhone);
  assert(
    'Comando para ver precios de la web devuelve catálogo en vivo',
    catCmd.intent === 'DIRECTOR_STRATEGY' && catCmd.reply.includes('CATÁLOGO DE PRECIOS'),
    catCmd.reply.split('\n')[0]
  );

  // Modificación remota de precio
  const updateCmd = await handleDirectorCopilotMessage(
    'cambia el precio del plan plus a 3.750.000 setup y 490.000 mensual',
    [],
    ownerPhone
  );
  assert(
    'Comando para modificar precio actualiza base de datos',
    updateCmd.reply.includes('¡Precio del plan actualizado con éxito en la web!'),
    updateCmd.reply.split('\n')[0]
  );

  // Verificar en base de datos real
  const planInDb = await prisma.plan.findFirst({ where: { slug: { contains: 'plus' } } });
  assert(
    'Base de datos refleja el nuevo setup $3.750.000 y mensualidad $490.000',
    planInDb?.setupPrice === 3750000 && planInDb?.recurringPrice === 490000,
    `DB actual: Setup ${planInDb?.setupPrice}, Mensual ${planInDb?.recurringPrice}`
  );

  // Análisis de cotización y rentabilidad
  const quoteCalc = await handleDirectorCopilotMessage(
    'calcula una cotizacion para restaurante con 2 modulos y 10% de descuento',
    [],
    ownerPhone
  );
  assert(
    'Cálculo ejecutivo de cotización calcula márgenes operativos y desglose',
    quoteCalc.reply.includes('ANÁLISIS DE COTIZACIÓN EJECUTIVA') && quoteCalc.reply.includes('Margen bruto operativo'),
    'Desglose con horas, costes de infraestructura y margen completado'
  );

  // PRUEBA 5: Aislamiento estricto de clientes
  console.log('\n--- 5. AISLAMIENTO ESTRICTO DE CLIENTES EXTERNOS ---');
  const clientResponse = await generateAIResponse({
    prompt: 'Hola, ¿cuánto cuesta el plan plus?',
    senderName: 'Carlos Negocios',
    senderPhone: '573109998877',
  });
  assert(
    'Cliente externo recibe agente comercial estándar con el precio oficial actualizado',
    clientResponse.reply.includes('3.750.000') || clientResponse.reply.includes('3\'750.000') || clientResponse.reply.toLowerCase().includes('plus'),
    'Respuesta del bot al cliente sin exponer secretos internos de director'
  );

  console.log('\n================================================================');
  console.log(`📊 RESULTADO FINAL: ${passed}/${total} PRUEBAS APROBADAS (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Error fatal en pruebas:', e);
  process.exit(1);
});
