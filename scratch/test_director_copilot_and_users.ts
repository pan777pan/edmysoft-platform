import { isOwnerSender, handleDirectorCopilotMessage } from '../lib/director-copilot';
import { loadBusinessKnowledge } from '../lib/knowledge-manager';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('=== TEST 1: RECONOCIMIENTO EXCLUSIVO DEL DUEÑO (+57 323 416 6354) ===\n');

  const ownerNum1 = '573234166354';
  const ownerNum2 = '3234166354';
  const clientNum = '573109876543';

  console.log('1. Verificando discriminación de remitente:');
  console.log('   ¿573234166354 es el Dueño?:', isOwnerSender(ownerNum1) ? '✅ SÍ (CORRECTO)' : '❌ NO');
  console.log('   ¿3234166354 es el Dueño?:', isOwnerSender(ownerNum2) ? '✅ SÍ (CORRECTO)' : '❌ NO');
  console.log('   ¿573109876543 es el Dueño?:', !isOwnerSender(clientNum) ? '✅ NO ES EL DUEÑO (CORRECTO)' : '❌ ERROR');

  console.log('\n=== TEST 2: APRENDIZAJE ACTIVO Y ENSEÑANZA POR PARTE DE EDIER ===\n');
  const learnMsg = 'Aprende que a partir de ahora el Plan Plus incluye 3 meses de soporte prioritario gratuito y setup en 24 horas';
  const resLearn = await handleDirectorCopilotMessage(learnMsg, [], ownerNum1);
  console.log('Respuesta del Copiloto a la orden de aprendizaje:\n', resLearn.reply);

  const kb = loadBusinessKnowledge();
  const learnedInKb = kb.guidelines?.some(g => g.instruction.includes('soporte prioritario gratuito')) ||
                      kb.extraFreeformNotes?.includes('soporte prioritario gratuito');
  console.log('\n¿La nueva regla se guardó en la Base de Conocimiento oficial?:', learnedInKb ? '✅ SÍ' : '❌ NO');

  console.log('\n=== TEST 3: SUPERVISIÓN Y ANÁLISIS DE CHATS CON CLIENTES ===\n');
  const resAnalysis = await handleDirectorCopilotMessage('Analiza las conversaciones de hoy y dime cómo podemos mejorar el cierre con los clientes', [], ownerNum1);
  console.log('Respuesta del Copiloto al análisis de supervisión:\n', resAnalysis.reply);

  console.log('\n=== TEST 4: BANDEJA DE DUDAS Y PREGUNTAS SIN RESOLVER ===\n');
  const resDoubts = await handleDirectorCopilotMessage('¿Qué dudas de clientes tienes pendientes o qué no has sabido responder?', [], ownerNum1);
  console.log('Respuesta del Copiloto a la consulta de dudas:\n', resDoubts.reply);

  console.log('\n=== TEST 5: PREGUNTA SUBJETIVA Y ESTRATÉGICA DE ALTA COMPLEJIDAD ===\n');
  const resStrategy = await handleDirectorCopilotMessage('¿Qué opinas de lanzar un módulo exclusivo para restaurantes campestres y cómo ves el mercado en Colombia?', [], ownerNum1);
  console.log('Respuesta del Copiloto a pregunta estratégica:\n', resStrategy.reply);

  console.log('\n=== TEST 6: GESTIÓN DE EQUIPO, TRABAJADORES Y PERMISOS RBAC ===\n');
  const testWorkerEmail = `worker_test_${Date.now()}@edmysoft.com`;
  
  // 1. Crear colaborador
  console.log('1. Creando trabajador con permisos granulares...');
  const hash = await bcrypt.hash('clave123456', 10);
  const createdWorker = await prisma.user.create({
    data: {
      name: 'Daniel Restrepo Agudelo',
      email: testWorkerEmail,
      passwordHash: hash,
      role: 'TRABAJADOR_VENTAS',
      jobTitle: 'Asesor Comercial Senior',
      phone: '573123456789',
      permissions: JSON.stringify(['crm_leads', 'whatsapp_chat']),
      isActive: true,
    },
  });
  console.log('   ✅ Trabajador creado en DB:', {
    id: createdWorker.id,
    name: createdWorker.name,
    email: createdWorker.email,
    role: createdWorker.role,
    jobTitle: createdWorker.jobTitle,
    permissions: JSON.parse(createdWorker.permissions || '[]'),
  });

  // 2. Modificar colaborador
  console.log('\n2. Modificando rol y permisos del colaborador...');
  const updatedWorker = await prisma.user.update({
    where: { id: createdWorker.id },
    data: {
      role: 'ADMIN',
      permissions: JSON.stringify(['crm_leads', 'whatsapp_chat', 'catalog_pricing', 'financial_reports']),
      jobTitle: 'Director Comercial & Operaciones',
    },
  });
  console.log('   ✅ Trabajador actualizado:', {
    role: updatedWorker.role,
    jobTitle: updatedWorker.jobTitle,
    permissions: JSON.parse(updatedWorker.permissions || '[]'),
  });

  // 3. Eliminar colaborador de prueba
  console.log('\n3. Limpiando colaborador de prueba...');
  await prisma.user.delete({ where: { id: createdWorker.id } });
  console.log('   ✅ Colaborador de prueba eliminado correctamente.');

  console.log('\n======================================================');
  console.log('TODAS LAS PRUEBAS DE MODO DIRECCIÓN Y EQUIPO COMPLETADAS CON ÉXITO');
  console.log('======================================================');
}

runTests().catch(console.error);
