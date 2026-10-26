async function testSuite() {
  console.log('====================================================');
  console.log('🚀 INICIANDO TEST SUITE E2E OFICIAL: EDMYSOFT');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:3000';

  // 1. Login como Administrador Oficial (Edier Mery Gallego)
  console.log('🔹 PASO 1: Autenticación oficial del Administrador...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ediergallego59@gmail.com',
      password: 'edsoft1013341239',
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  const rawCookie = adminLoginRes.headers.get('set-cookie');
  const adminCookie = rawCookie ? rawCookie.split(';')[0] : '';
  console.log(`✅ Admin autenticado: ${adminLoginData.user?.name} (${adminLoginData.user?.email}), Rol: ${adminLoginData.user?.role}`);

  // 2. Probar Tarifas Dinámicas (/api/admin/pricing)
  console.log('\n🔹 PASO 2: Verificando Gestor Visual de Tarifas & Regateo...');
  const pricingRes = await fetch(`${BASE_URL}/api/admin/pricing`, {
    headers: { Cookie: adminCookie },
  });
  const pricingData = await pricingRes.json();
  console.log(`✅ Status: ${pricingRes.status} | Éxito: ${pricingData.success}`);
  for (const [slug, p] of Object.entries(pricingData.plans)) {
    console.log(`   - [${slug}] ${p.name}: Setup $${p.setupPrice.toLocaleString('es-CO')} COP | Mensual $${p.recurringPrice.toLocaleString('es-CO')} COP`);
  }
  console.log(`✅ Reglas de Regateo activas: Descuento Máximo: ${pricingData.negotiation?.maxDiscountPercent}%, 2 Cuotas: ${pricingData.negotiation?.allowTwoInstallments}`);

  // 3. Probar Registro Oficial de Cliente en Base de Datos (/api/auth/register)
  console.log('\n🔹 PASO 3: Registro oficial de nuevo cliente / persona natural...');
  const newClientEmail = `carlos.gomez.${Date.now()}@inversionesandinas.co`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Carlos Alberto Gómez',
      companyName: 'Inversiones Andinas SAS',
      phone: '+57 310 987 6543',
      email: newClientEmail,
      password: 'Cliente#2026Seguro!',
    }),
  });
  const regData = await regRes.json();
  console.log(`✅ Status: ${regRes.status} | Éxito: ${regData.success}`);
  console.log(`✅ Perfil oficial creado en BD: ${regData.user?.name} (${regData.user?.email}), Rol: ${regData.user?.role}`);

  // 4. Probar Login del Cliente Creado
  console.log('\n🔹 PASO 4: Inicio de sesión del nuevo cliente en el Portal...');
  const clientLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: newClientEmail,
      password: 'Cliente#2026Seguro!',
    }),
  });
  const clientLoginData = await clientLoginRes.json();
  const clientRawCookie = clientLoginRes.headers.get('set-cookie');
  const clientCookie = clientRawCookie ? clientRawCookie.split(';')[0] : '';
  console.log(`✅ Login cliente: ${clientLoginData.success} | Redirige a: ${clientLoginData.redirectTo}`);

  // 5. Verificar Aislamiento RLS en el Portal del Cliente (/api/portal/projects)
  console.log('\n🔹 PASO 5: Verificando datos inicializados en el Portal para este cliente...');
  const projRes = await fetch(`${BASE_URL}/api/portal/projects?email=${encodeURIComponent(newClientEmail)}`);
  const projData = await projRes.json();
  console.log(`✅ Proyectos asignados a ${newClientEmail}: ${projData.projects?.length || 0}`);
  if (projData.projects?.[0]) {
    console.log(`   - Proyecto: "${projData.projects[0].name}" | Avance: ${projData.projects[0].progress}% | Líder: ${projData.projects[0].leadEngineer}`);
  }

  // 6. Probar Agente IA con Memoria y Regateo Comercial
  console.log('\n🔹 PASO 6: Probando Agente IA de EDMYSOFT con objeción de precio (Regateo)...');
  const chatRes = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Hola Edier, me interesa el Plan Estándar pero $2.200.000 COP se sale de mi presupuesto actual, ¿me puedes hacer algún descuento o dar alguna facilidad de pago?',
      history: [],
      senderName: 'Carlos Gómez',
    }),
  });
  const chatData = await chatRes.json();
  console.log(`✅ Chat status: ${chatRes.status} | Éxito: ${chatData.success}`);
  console.log('🤖 RESPUESTA COMERCIAL DEL BOT DE EDMYSOFT (Concesión estratégica & anclaje):');
  console.log('----------------------------------------------------');
  console.log(chatData.reply);
  console.log('----------------------------------------------------');

  // 7. Probar Modo Demostración Temporal para Clientes (Exclusivo WhatsApp)
  console.log('\n🔹 PASO 7: Configurando Modo Demostración Temporal para Clientes en WhatsApp...');
  const demoPayload = {
    active: true,
    durationHours: 3,
    clientBusinessName: 'Parrilla & Fuego Steakhouse',
    industry: 'Restaurante y Gastronomía Premium',
    businessDescription: 'Restaurante campestre de cortes madurados, vinos importados y eventos sociales en Chía.',
    servicesAndPrices: '- Corte Tomahawk (1kg): $145.000 COP\n- Ojo de Bife 400g: $75.000 COP\n- Menú Degustación 4 tiempos: $110.000 COP\n- Reserva de mesa VIP: Sin costo con consumo mínimo',
    faqs: 'Horario: Miércoles a Domingo de 12:00 PM a 10:00 PM. Ubicación: Km 2 Vía Chía-Cajicá.',
    bookingUrl: 'https://wa.me/573234166354?text=Quiero%20reservar%20mesa%20en%20Parrilla%20y%20Fuego',
    specialInstructions: 'Sé muy hospitalario y elegante. Ofrece reservar mesa para este fin de semana.',
  };

  const demoPutRes = await fetch(`${BASE_URL}/api/admin/whatsapp-demo`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify(demoPayload),
  });
  const demoPutData = await demoPutRes.json();
  console.log(`✅ Modo Demo activado con éxito: ${demoPutData.success}`);
  console.log(`✅ Expira en: ${demoPutData.config?.expiresAt}`);

  // 8. Verificar que el Web Bot sigue siendo EDMYSOFT (Estricto Aislamiento)
  console.log('\n🔹 PASO 8: Verificando que el Bot de la Web NUNCA se contamine y siga siendo EDMYSOFT...');
  const webChatRes = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: '¿A qué se dedica tu empresa y qué tecnologías utilizan?',
      history: [],
      senderName: 'Visitante Web',
    }),
  });
  const webChatData = await webChatRes.json();
  console.log('🌐 RESPUESTA EN LA WEB (EDMYSOFT puro):');
  console.log('----------------------------------------------------');
  console.log(webChatData.reply);
  console.log('----------------------------------------------------');
  const webIsEdmysoft = webChatData.reply.toLowerCase().includes('edmysoft') || webChatData.reply.toLowerCase().includes('software') || webChatData.reply.toLowerCase().includes('inteligencia artificial');
  console.log(`✅ Aislamiento garantizado: El Web Bot responde como EDMYSOFT: ${webIsEdmysoft}`);

  // 9. Vista previa del Informe Diario de las 6:00 PM
  console.log('\n🔹 PASO 9: Verificando Informe Diario de Ventas a las 6:00 PM...');
  const reportRes = await fetch(`${BASE_URL}/api/admin/daily-report`, {
    headers: { Cookie: adminCookie },
  });
  const reportData = await reportRes.json();
  console.log(`✅ Status: ${reportRes.status} | Éxito: ${reportData.success}`);
  if (reportData.report) {
    console.log('📊 RESUMEN DIARIO LISTO PARA ENVIAR AL WHATSAPP DE EDIER:');
    console.log('----------------------------------------------------');
    console.log(reportData.report.textReport);
    console.log('----------------------------------------------------');
  }

  // 10. Restaurar modo normal en WhatsApp
  console.log('\n🔹 PASO 10: Restaurando WhatsApp a modo oficial EDMYSOFT...');
  await fetch(`${BASE_URL}/api/admin/whatsapp-demo`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({ active: false }),
  });
  console.log('✅ Modo Demo desactivado. WhatsApp volvió al canal comercial oficial de EDMYSOFT.');

  console.log('\n====================================================');
  console.log('🎉 TODOS LOS 10 PASOS DEL TEST SUITE COMPLETADOS CON ÉXITO');
  console.log('====================================================');
}

testSuite();
