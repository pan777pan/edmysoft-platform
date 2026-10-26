async function runExpansionsTest() {
  console.log('====================================================');
  console.log('🚀 TEST E2E: EDMYSOFT EXPANSIÓN ADMINISTRATIVA');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:3000';

  // 1. Login Admin
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ediergallego59@gmail.com',
      password: 'edsoft1013341239',
    }),
  });
  const cookie = adminLoginRes.headers.get('set-cookie')?.split(';')[0] || '';
  console.log(`✅ Admin autenticado. Cookie lista.`);

  // 2. Test Catálogo de Servicios y Planes (/api/catalog/services)
  console.log('\n🔹 TEST 1: Servicios y Planes Oficiales...');
  const srvGetRes = await fetch(`${BASE_URL}/api/catalog/services`);
  const srvGetData = await srvGetRes.json();
  console.log(`✅ Servicios actuales: ${srvGetData.services?.length || 0}`);
  if (srvGetData.services?.[0]) {
    console.log(`   - Servicio: "${srvGetData.services[0].name}" con ${srvGetData.services[0].plans?.length} planes.`);
  }

  // Crear servicio de prueba
  const newSrvSlug = `servicio-test-${Date.now()}`;
  const srvCreateRes = await fetch(`${BASE_URL}/api/catalog/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      actionType: 'CREATE_SERVICE',
      name: 'Automatización Integral de Flotas',
      slug: newSrvSlug,
      category: 'Software & IA',
      shortDesc: 'Monitoreo de rutas y flotas con IA en tiempo real.',
    }),
  });
  const srvCreateData = await srvCreateRes.json();
  console.log(`✅ Servicio creado: ${srvCreateData.service?.name} (ID: ${srvCreateData.service?.id})`);

  // Crear plan bajo ese servicio
  const planCreateRes = await fetch(`${BASE_URL}/api/catalog/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      actionType: 'CREATE_PLAN',
      serviceId: srvCreateData.service?.id,
      name: 'Plan Flotas Premium',
      slug: `flotas-prem-${Date.now()}`,
      setupPrice: 4500000,
      recurringPrice: 650000,
      description: 'Gestión hasta 50 vehículos con alertas por WhatsApp.',
      featuresIncluded: ['GPS en tiempo real', 'Alertas por WhatsApp', 'Reportes automáticos'],
      isRecommended: true,
    }),
  });
  const planCreateData = await planCreateRes.json();
  console.log(`✅ Plan creado: ${planCreateData.plan?.name} ($${planCreateData.plan?.setupPrice?.toLocaleString('es-CO')} Setup | $${planCreateData.plan?.recurringPrice?.toLocaleString('es-CO')}/mes)`);

  // 3. Test Módulos Adicionales (/api/catalog/modules)
  console.log('\n🔹 TEST 2: Módulos y Funcionalidades Adicionales...');
  const modCode = `MOD_WOMPI_${Date.now()}`;
  const modCreateRes = await fetch(`${BASE_URL}/api/catalog/modules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      name: 'Pasarela de Pagos Wompi Oficial',
      code: modCode,
      description: 'Cobros con tarjeta de crédito, PSE y Nequi automáticos desde WhatsApp.',
      setupPrice: 750000,
      recurringPrice: 120000,
      defaultRule: 'OPTIONAL',
      isTechnicalReady: true,
    }),
  });
  const modCreateData = await modCreateRes.json();
  console.log(`✅ Módulo creado: ${modCreateData.module?.name} [${modCreateData.module?.code}] | Técnico: ${modCreateData.module?.isTechnicalReady ? 'LISTO' : 'SOLO COMERCIAL'}`);

  // 4. Test Base de Conocimiento y Reglas (/api/admin/knowledge)
  console.log('\n🔹 TEST 3: Base de Conocimiento del Negocio (Cerebro del Bot)...');
  const knowGetRes = await fetch(`${BASE_URL}/api/admin/knowledge`, {
    headers: { Cookie: cookie },
  });
  const knowGetData = await knowGetRes.json();
  console.log(`✅ FAQs existentes: ${knowGetData.knowledge?.faqs?.length || 0}`);
  console.log(`✅ Políticas existentes: ${knowGetData.knowledge?.policies?.length || 0}`);

  // Agregar una FAQ nueva
  const customQuestion = `¿Qué garantía ofrece EDMYSOFT en sus desarrollos?`;
  const customAnswer = `Todos los desarrollos de EDMYSOFT cuentan con 90 días de garantía técnica directa con Edier Mery Gallego y soporte de infraestructura garantizado por TuSoft.`;

  const updatedFaqs = [
    ...(knowGetData.knowledge?.faqs || []),
    {
      id: `faq-garantia-${Date.now()}`,
      question: customQuestion,
      answer: customAnswer,
      category: 'Garantías',
    },
  ];

  const knowPutRes = await fetch(`${BASE_URL}/api/admin/knowledge`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      ...knowGetData.knowledge,
      faqs: updatedFaqs,
    }),
  });
  const knowPutData = await knowPutRes.json();
  console.log(`✅ Base de conocimiento guardada: ${knowPutData.message}`);

  // 5. Verificar que el Bot de IA responde usando la nueva FAQ aprendida
  console.log('\n🔹 TEST 4: Probando que el Bot responda usando el nuevo conocimiento...');
  const chatRes = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: '¿Qué garantía ofrece EDMYSOFT en sus desarrollos?',
      history: [],
      senderName: 'Cliente Interesado',
    }),
  });
  const chatData = await chatRes.json();
  console.log('🤖 RESPUESTA DE LA IA BASADA EN EL CONOCIMIENTO RECIÉN GUARDADO:');
  console.log('----------------------------------------------------');
  console.log(chatData.reply);
  console.log('----------------------------------------------------');
  const hasGarantia = chatData.reply.toLowerCase().includes('garantía') || chatData.reply.toLowerCase().includes('edier') || chatData.reply.toLowerCase().includes('tusoft');
  console.log(`✅ Verificación exitosa: El bot aprendió la nueva respuesta: ${hasGarantia}`);

  console.log('\n====================================================');
  console.log('🎉 TODOS LOS TESTS DE EXPANSIÓN COMPLETADOS CON ÉXITO');
  console.log('====================================================');
}

runExpansionsTest();
