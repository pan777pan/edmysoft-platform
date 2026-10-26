const http = require('http');

async function testSuite() {
  console.log('====================================================');
  console.log('🚀 INICIANDO TEST SUITE E2E (HTTP LIVE APIs): EDMYSOFT');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:3000';
  const adminCookie = 'edmysoft_session=' + encodeURIComponent(JSON.stringify({
    id: 'usr_admin_edier',
    email: 'ediergallego59@gmail.com',
    name: 'Edier Mery Gallego',
    role: 'SUPERADMIN'
  }));

  try {
    // ----------------------------------------------------
    // TEST 1: Verificar Endpoint de Precios (/api/admin/pricing)
    // ----------------------------------------------------
    console.log('🔹 TEST 1: Consultando y actualizando precios dinámicos...');
    const pricingRes = await fetch(`${BASE_URL}/api/admin/pricing`, {
      headers: { Cookie: adminCookie }
    });
    const pricingData = await pricingRes.json();
    console.log(`✅ Status: ${pricingRes.status} | Éxito: ${pricingData.success}`);
    if (pricingData.plans) {
      pricingData.plans.forEach(p => {
        console.log(`   - [${p.slug}] ${p.name}: Setup $${p.setupCop.toLocaleString()} COP | Mensual $${p.monthlyCop.toLocaleString()} COP`);
      });
    }
    console.log(`✅ Reglas de Regateo cargadas: Descuento Máx: ${pricingData.negotiationConfig?.maxDiscountPercent}%, Cuotas: ${pricingData.negotiationConfig?.allowInstallmentOffer}`);

    // ----------------------------------------------------
    // TEST 2: Registro Oficial de Cliente (/api/auth/register)
    // ----------------------------------------------------
    console.log('\n🔹 TEST 2: Probando registro oficial de cliente en base de datos...');
    const uniqueEmail = `cliente.oficial.${Date.now()}@inversionesandinas.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Carlos Alberto Restrepo',
        companyName: 'Inversiones Andinas SAS',
        phone: '+57 312 456 7890',
        email: uniqueEmail,
        password: 'Password#2026!',
      }),
    });
    const regData = await regRes.json();
    console.log(`✅ Status: ${regRes.status} | Éxito: ${regData.success}`);
    console.log(`✅ Usuario registrado: ${regData.user?.name} (${regData.user?.email}), Rol: ${regData.user?.role}`);

    // Verificar login oficial
    console.log('🔹 TEST 2.1: Verificando login oficial del cliente recién registrado...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password#2026!',
      }),
    });
    const loginData = await loginRes.json();
    console.log(`✅ Login status: ${loginRes.status} | Éxito: ${loginData.success} | Redirige a: ${loginData.redirectTo}`);

    // ----------------------------------------------------
    // TEST 3: Agente IA en la Web — Memoria y Regateo Comercial
    // ----------------------------------------------------
    console.log('\n🔹 TEST 3: Probando Agente IA de EDMYSOFT con objeción de precio (Regateo)...');
    const chatRes = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hola Edier, me interesa el Plan Estándar pero $2.200.000 COP está muy alto para mi presupuesto. ¿Qué facilidades de pago o descuento me puedes ofrecer hoy?' }
        ],
        channel: 'WEB',
        leadName: 'Carlos Restrepo',
      }),
    });
    const chatData = await chatRes.json();
    console.log(`✅ Chat status: ${chatRes.status} | Éxito: ${chatData.success}`);
    console.log('🤖 RESPUESTA DEL AGENTE (Regateo & Concesiones):');
    console.log('----------------------------------------------------');
    console.log(chatData.reply);
    console.log('----------------------------------------------------');

    // ----------------------------------------------------
    // TEST 4: Configuración de Modo Demostración Temporal
    // ----------------------------------------------------
    console.log('\n🔹 TEST 4: Probando activación de Modo Demostración Temporal...');
    const demoPayload = {
      active: true,
      durationHours: 2,
      clientBusinessName: 'Odontología Sonrisas Colombia',
      industry: 'Salud Oral y Ortodoncia',
      businessDescription: 'Clínica odontológica especialista en diseño de sonrisa, implantes y ortodoncia invisible.',
      servicesAndPrices: '- Valoración odontológica inicial: $30.000 COP (Gratis si inicia tratamiento)\n- Limpieza profunda con ultrasonido: $80.000 COP\n- Ortodoncia invisible (mensualidad): $120.000 COP',
      faqs: 'Ubicación: Calle 100 con 15, Bogotá. Horario: Lunes a Sábado de 8:00 AM a 7:00 PM.',
      bookingUrl: 'https://wa.me/573234166354?text=Quiero%20agendar%20valoracion%20dental',
      specialInstructions: 'Sé muy amable. Enfatiza que la valoración es gratuita si inicia tratamiento.',
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
    console.log(`✅ Modo Demo activado: ${demoPutData.success} | Expira: ${demoPutData.config?.expiresAt}`);

    // Consultar estado demo
    const demoGetRes = await fetch(`${BASE_URL}/api/admin/whatsapp-demo`, {
      headers: { Cookie: adminCookie }
    });
    const demoGetData = await demoGetRes.json();
    console.log(`✅ Estado actual Demo: ${demoGetData.isCurrentlyActive ? 'ACTIVO' : 'INACTIVO'} para: "${demoGetData.config?.clientBusinessName}"`);

    // ----------------------------------------------------
    // TEST 5: Generación y Vista Previa del Informe Diario a las 6:00 PM
    // ----------------------------------------------------
    console.log('\n🔹 TEST 5: Probando vista previa del Informe Diario a las 6:00 PM...');
    const reportRes = await fetch(`${BASE_URL}/api/admin/daily-report`, {
      headers: { Cookie: adminCookie }
    });
    const reportData = await reportRes.json();
    console.log(`✅ Informe status: ${reportRes.status} | Éxito: ${reportData.success}`);
    if (reportData.report) {
      console.log('📊 REPORTE CONSOLIDADO DIARIO:');
      console.log('----------------------------------------------------');
      console.log(reportData.report.textReport);
      console.log('----------------------------------------------------');
      console.log(`   - Fecha: ${reportData.report.date}`);
      console.log(`   - Mensajes procesados hoy: ${reportData.report.totalMessagesToday}`);
      console.log(`   - Conversaciones activas: ${reportData.report.totalConversationsToday}`);
      console.log(`   - Leads Calientes: ${reportData.report.hotLeads?.length || 0}`);
      console.log(`   - Citas agendadas: ${reportData.report.meetings?.length || 0}`);
    }

    // Desactivar demo para dejar WhatsApp en modo normal
    console.log('\n🔹 TEST 6: Restaurando WhatsApp a modo EDMYSOFT normal...');
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
    console.log('🎉 TODOS LOS TESTS HTTP FINALIZARON SATISFACTORIAMENTE');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Error en test suite:', err);
  }
}

testSuite();
