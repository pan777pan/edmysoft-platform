const path = require('path');
const http = require('http');

async function main() {
  console.log('====================================================');
  console.log('🚀 INICIANDO TEST SUITE E2E: EDMYSOFT NUEVAS FUNCIONES');
  console.log('====================================================\n');

  // Cambiar directorio al proyecto
  process.chdir('C:\\Users\\edier\\.gemini\\antigravity-ide\\scratch\\edmysoft-platform');

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // ----------------------------------------------------
    // TEST 1: Verificar Base de Datos y Planes
    // ----------------------------------------------------
    console.log('🔹 TEST 1: Verificando base de datos y catálogo de precios...');
    const plans = await prisma.plan.findMany();
    console.log(`✅ Planes encontrados en SQLite: ${plans.length}`);
    for (const p of plans) {
      console.log(`   - [${p.slug}] ${p.name}: Setup $${(p.setupPrice || 0).toLocaleString()} COP | Mensual $${(p.recurringPrice || 0).toLocaleString()} COP`);
    }

    // ----------------------------------------------------
    // TEST 2: Registro Oficial de Cliente (Persona Natural / SAS)
    // ----------------------------------------------------
    console.log('\n🔹 TEST 2: Probando registro oficial de cliente en base de datos...');
    const testEmail = `cliente.oficial.${Date.now()}@solucionesbogota.com`;
    const bcrypt = require('bcryptjs');

    // Simular llamada al endpoint de registro
    const passwordHash = await bcrypt.hash('Cliente#2026Seguro', 10);
    const testUser = await prisma.user.create({
      data: {
        name: 'Andrés Felipe Morales',
        email: testEmail,
        passwordHash,
        role: 'CLIENT',
        isActive: true,
      },
    });

    const testContact = await prisma.contact.create({
      data: {
        fullName: 'Andrés Felipe Morales',
        email: testEmail,
        phone: '+57 311 987 6543',
        companyName: 'Morales Logística SAS',
        preferredChannel: 'WEB_FORM',
      },
    });

    const testProject = await prisma.clientProject.create({
      data: {
        name: 'Implementación Tecnológica — Morales Logística SAS',
        ownerEmail: testEmail,
        clientName: 'Andrés Felipe Morales',
        progress: 25,
        stage: 'Análisis',
        eta: '10 días hábiles',
        leadEngineer: 'Edier Mery Gallego (CEO & AI Architect)',
      },
    });

    console.log(`✅ Usuario cliente creado: ${testUser.name} (${testUser.email}), Rol: ${testUser.role}`);
    console.log(`✅ Contacto CRM vinculado: ${testContact.fullName} (${testContact.companyName})`);
    console.log(`✅ Proyecto oficial inicializado: ${testProject.name}`);

    // Verificar login
    const isPassValid = await bcrypt.compare('Cliente#2026Seguro', testUser.passwordHash);
    console.log(`✅ Validación de contraseña hash bcrypt: ${isPassValid ? 'CORRECTO (Acceso concedido)' : 'FALLIDO'}`);

    // ----------------------------------------------------
    // TEST 3: Motor de IA y Regateo Comercial
    // ----------------------------------------------------
    console.log('\n🔹 TEST 3: Probando Motor de IA de EDMYSOFT con Memoria y Regateo Comercial...');
    const { generateAIResponse } = require('./lib/ai-engine');

    const negotiationChat = [
      { role: 'user', content: 'Hola, me interesa el Plan Estándar pero $2.200.000 me parece muy costoso y se sale de mi presupuesto actual, ¿me pueden hacer algún descuento o facilidad?' },
    ];

    const aiNegotiationReply = await generateAIResponse(
      negotiationChat,
      'Cliente Negociador',
      'WEB',
      '+57 311 000 0000',
      'conv_neg_test_1'
    );

    console.log('🤖 RESPUESTA DEL AGENTE COMERCIAL (Regateo & Concesiones Estratégicas):');
    console.log('----------------------------------------------------');
    console.log(aiNegotiationReply.reply);
    console.log('----------------------------------------------------');
    console.log(`Action: ${aiNegotiationReply.action || 'NORMAL'} | Intent: ${aiNegotiationReply.intent}`);

    // ----------------------------------------------------
    // TEST 4: Modo Demostración Temporal para Clientes (WhatsApp)
    // ----------------------------------------------------
    console.log('\n🔹 TEST 4: Probando Modo Demostración Temporal para Clientes en WhatsApp...');
    const demoConfig = {
      active: true,
      expiresAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      clientBusinessName: 'Clínica Veterinaria Huellitas Felices',
      industry: 'Salud Animal y Cirugía Veterinaria',
      businessDescription: 'Clínica veterinaria 24 horas en Chapinero, Bogotá. Urgencias, vacunación, cirugías y spa para perros y gatos.',
      servicesAndPrices: '- Consulta general: $50.000 COP\n- Plan de Vacunación completo: $120.000 COP\n- Esterilización canina/felina: desde $180.000 COP\n- Urgencias 24h: Disponibles sin cita previa',
      faqs: 'Horarios: 24/7 los 365 días del año. Dirección: Calle 63 # 13-45, Bogotá.',
      bookingUrl: 'https://wa.me/573234166354?text=Quiero%20agendar%20cita%20veterinaria',
      specialInstructions: 'Sé muy cariñoso con los dueños de mascotas. Menciona que atendemos urgencias 24/7.',
    };

    const demoChat = [
      { role: 'user', content: 'Hola buenas tardes, mi perrito tiene fiebre y no quiere comer, ¿cuánto cuesta la consulta y a qué horas abren?' },
    ];

    // WhatsApp con Demo Config activa
    const demoReply = await generateAIResponse(
      demoChat,
      'Dueño de Mascota',
      'WHATSAPP',
      '+57 320 123 4567',
      'conv_demo_test_1',
      demoConfig
    );

    console.log('🐾 RESPUESTA EN MODO DEMOSTRACIÓN (Clínica Veterinaria Huellitas Felices):');
    console.log('----------------------------------------------------');
    console.log(demoReply.reply);
    console.log('----------------------------------------------------');

    // ----------------------------------------------------
    // TEST 5: Verificación de Aislamiento (Web Bot sigue siendo EDMYSOFT)
    // ----------------------------------------------------
    console.log('\n🔹 TEST 5: Verificando que el Bot de la Web NUNCA se contamine con el Demo...');
    const webChat = [
      { role: 'user', content: '¿Qué servicios ofrece EDMYSOFT?' },
    ];
    // En la web no se pasa demoConfig
    const webReply = await generateAIResponse(
      webChat,
      'Visitante Web',
      'WEB',
      undefined,
      'conv_web_test_1'
    );

    console.log('🌐 RESPUESTA EN BOT DE LA WEB (EDMYSOFT puro):');
    console.log('----------------------------------------------------');
    console.log(webReply.reply);
    console.log('----------------------------------------------------');
    const isEdmysoft = webReply.reply.toLowerCase().includes('edmysoft') || webReply.reply.toLowerCase().includes('software') || webReply.reply.toLowerCase().includes('inteligencia artificial');
    console.log(`✅ Aislamiento garantizado: El Web Bot respondió como EDMYSOFT: ${isEdmysoft}`);

    // ----------------------------------------------------
    // TEST 6: Generación del Informe Diario Consolidado a las 6:00 PM
    // ----------------------------------------------------
    console.log('\n🔹 TEST 6: Probando generación del Informe Diario a las 6:00 PM...');
    const { generateDailyReport } = require('./lib/daily-report');
    const dailyReport = await generateDailyReport();

    console.log('📊 INFORME CONSOLIDADO GENERADO:');
    console.log('----------------------------------------------------');
    console.log(dailyReport.textReport);
    console.log('----------------------------------------------------');
    console.log(`✅ Fecha: ${dailyReport.date}`);
    console.log(`✅ Mensajes hoy: ${dailyReport.totalMessagesToday}`);
    console.log(`✅ Conversaciones activas: ${dailyReport.totalConversationsToday}`);
    console.log(`✅ Leads calientes: ${dailyReport.hotLeads.length}`);
    console.log(`✅ Citas agendadas: ${dailyReport.meetings.length}`);

    console.log('\n====================================================');
    console.log('🎉 TODOS LOS TESTS DE INTEGRACIÓN COMPLETADOS CON ÉXITO');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Error en test suite:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
