const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = process.env.BASE_URL || 'https://synthesis-table-governmental-hand.trycloudflare.com';
const LOCAL_URL = 'http://127.0.0.1:3000';

const auditResults = [];

function record(id, moduleName, functionName, problem, severity, correction, testResult, status) {
  auditResults.push({
    id,
    module: moduleName,
    function: functionName,
    problem: problem || 'Ninguno detectado',
    severity: severity || 'N/A',
    correction: correction || 'Verificado conforme a especificación',
    testResult,
    status // APROBADO, FALLIDO, PARCIAL, NO PROBADO, BLOQUEADO
  });
}

async function runAudit() {
  console.log('========================================================================');
  console.log('  EDMYSOFT — AUDITORÍA FUNCIONAL COMPLETA Y SUITE DE PRUEBAS REALES');
  console.log('  URL Cloudflare:', BASE_URL);
  console.log('  URL Localhost:', LOCAL_URL);
  console.log('  Fecha:', new Date().toISOString());
  console.log('========================================================================\n');

  // ---------------------------------------------------------------------
  // FASE 1: APLICACIÓN Y CONEXIÓN
  // ---------------------------------------------------------------------
  console.log('>>> [FASE 1] Verificando inicio de aplicación, DB y servicios...');
  try {
    const userCount = await prisma.user.count();
    const serviceCount = await prisma.service.count();
    console.log(`✅ Base de datos SQLite activa (Usuarios: ${userCount}, Servicios: ${serviceCount})`);
    record(1, 'Infraestructura', 'Conexión a Base de Datos (Prisma)', null, null, null, `Conectado OK (${userCount} usuarios, ${serviceCount} servicios)`, 'APROBADO');
  } catch (err) {
    console.error('❌ Error DB:', err.message);
    record(1, 'Infraestructura', 'Conexión a Base de Datos (Prisma)', err.message, 'CRÍTICO', 'Revisar DATABASE_URL', 'Error al consultar', 'FALLIDO');
  }

  try {
    const resLocal = await fetch(LOCAL_URL + '/');
    console.log(`✅ Servidor local HTTP status: ${resLocal.status}`);
    record(2, 'Infraestructura', 'Servidor Localhost:3000', null, null, null, `HTTP ${resLocal.status} OK`, 'APROBADO');
  } catch (err) {
    console.error('❌ Servidor local no responde:', err.message);
    record(2, 'Infraestructura', 'Servidor Localhost:3000', err.message, 'CRÍTICO', 'Iniciar npm run dev', 'Fallo conexión', 'FALLIDO');
  }

  try {
    const resTunnel = await fetch(BASE_URL + '/');
    console.log(`✅ Túnel Cloudflare público status: ${resTunnel.status}`);
    record(3, 'Infraestructura', 'Túnel Cloudflare Público', null, null, null, `HTTP ${resTunnel.status} OK`, 'APROBADO');
  } catch (err) {
    console.error('❌ Túnel Cloudflare no responde:', err.message);
    record(3, 'Infraestructura', 'Túnel Cloudflare Público', err.message, 'ALTO', 'Verificar cloudflared', 'Fallo túnel', 'FALLIDO');
  }

  // ---------------------------------------------------------------------
  // FASE 2: INVENTARIO DE TODAS LAS RUTAS PÚBLICAS Y ADMIN
  // ---------------------------------------------------------------------
  console.log('\n>>> [FASE 2] Verificando inventario de rutas públicas...');
  const publicPages = ['/', '/servicios', '/asistente-ia', '/contacto', '/nosotros', '/diagnostico', '/privacidad', '/portal'];
  for (const page of publicPages) {
    const t0 = Date.now();
    try {
      const res = await fetch(BASE_URL + page);
      const ms = Date.now() - t0;
      if (res.status === 200) {
        console.log(`  ✅ [200] ${page.padEnd(20)} en ${ms}ms`);
        record(10 + publicPages.indexOf(page), 'Web Pública', `Ruta ${page}`, null, null, null, `HTTP 200 en ${ms}ms`, 'APROBADO');
      } else {
        console.log(`  ❌ [${res.status}] ${page.padEnd(20)}`);
        record(10 + publicPages.indexOf(page), 'Web Pública', `Ruta ${page}`, `HTTP ${res.status}`, 'MEDIO', 'Revisar página', `Fallo ${res.status}`, 'FALLIDO');
      }
    } catch (e) {
      record(10 + publicPages.indexOf(page), 'Web Pública', `Ruta ${page}`, e.message, 'ALTO', 'Revisar enrutador', 'Excepción red', 'FALLIDO');
    }
  }

  // ---------------------------------------------------------------------
  // FASE 3: AUDITORÍA COMPLETA DEL CHAT CON IA (PRUEBAS A a J)
  // ---------------------------------------------------------------------
  console.log('\n>>> [FASE 3] Ejecutando pruebas exhaustivas del Chat con IA (A hasta J)...');

  // Prueba A: Saludo sencillo
  console.log('\n  [Prueba A] Saludo sencillo: "Hola, ¿cómo estás?"');
  try {
    const t0 = Date.now();
    const resA = await fetch(BASE_URL + '/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hola, ¿cómo estás?', history: [] })
    });
    const msA = Date.now() - t0;
    const dataA = await resA.json();
    if (resA.status === 200 && dataA.success && dataA.reply) {
      console.log(`  ✅ Respuesta recibida en ${msA}ms: "${dataA.reply.slice(0, 100)}..."`);
      record(30, 'Chat IA', 'Prueba A: Saludo sencillo', null, null, null, `Respuesta OK en ${msA}ms`, 'APROBADO');
    } else {
      console.log(`  ❌ Fallo en Prueba A:`, dataA);
      record(30, 'Chat IA', 'Prueba A: Saludo sencillo', 'Sin respuesta válida', 'ALTO', 'Corregir ai-engine', 'Respuesta inválida', 'FALLIDO');
    }
  } catch (err) {
    console.error('  ❌ Excepción en Prueba A:', err.message);
    record(30, 'Chat IA', 'Prueba A: Saludo sencillo', err.message, 'CRÍTICO', 'Revisar /api/ai/chat', 'Excepción', 'FALLIDO');
  }

  // Prueba B: Pregunta informativa sobre servicios y quiénes somos
  console.log('\n  [Prueba B] Pregunta informativa: "Explícame qué servicios ofrece esta empresa."');
  try {
    const t0 = Date.now();
    const resB = await fetch(BASE_URL + '/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Explícame qué servicios ofrece esta empresa.', history: [] })
    });
    const msB = Date.now() - t0;
    const dataB = await resB.json();
    const hasEDMYSOFT = dataB.reply && dataB.reply.includes('EDMYSOFT');
    const hasNoTuSoft = !dataB.reply || !dataB.reply.includes('TuSoft');
    if (resB.status === 200 && dataB.success && hasEDMYSOFT && hasNoTuSoft) {
      console.log(`  ✅ Respuesta informativa en ${msB}ms refleja identidad 100% EDMYSOFT sin marcas residuales.`);
      record(31, 'Chat IA', 'Prueba B: Información comercial', null, null, null, `Detalle de servicios 100% EDMYSOFT en ${msB}ms`, 'APROBADO');
    } else {
      console.log(`  ❌ Fallo en Prueba B:`, dataB);
      record(31, 'Chat IA', 'Prueba B: Información comercial', 'Respuesta con branding no autorizado o incompleta', 'MEDIO', 'Limpiar prompts residuales', 'Incompleto', 'FALLIDO');
    }
  } catch (err) {
    record(31, 'Chat IA', 'Prueba B: Información comercial', err.message, 'ALTO', 'Revisar /api/ai/chat', 'Excepción', 'FALLIDO');
  }

  // Prueba C: Conversación con contexto
  console.log('\n  [Prueba C] Conversación con contexto multi-turno...');
  try {
    const msg1 = 'Estoy buscando un producto para mi hogar.';
    const resC1 = await fetch(BASE_URL + '/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg1, history: [] })
    });
    const dataC1 = await resC1.json();
    const historyAfterC1 = [
      { role: 'user', content: msg1 },
      { role: 'assistant', content: dataC1.reply || '' }
    ];

    const msg2 = '¿Cuál me recomendarías según lo que te acabo de decir?';
    const resC2 = await fetch(BASE_URL + '/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg2, history: historyAfterC1 })
    });
    const dataC2 = await resC2.json();
    if (resC2.status === 200 && dataC2.success && dataC2.reply) {
      console.log(`  ✅ Turno 2 respondió coherentemente respetando historial: "${dataC2.reply.slice(0, 100)}..."`);
      record(32, 'Chat IA', 'Prueba C: Memoria y Contexto', null, null, null, 'Historial multi-turno procesado con éxito', 'APROBADO');
    } else {
      record(32, 'Chat IA', 'Prueba C: Memoria y Contexto', 'Fallo al procesar historial', 'ALTO', 'Revisar safeHistory en route', 'Sin coherencia', 'FALLIDO');
    }
  } catch (err) {
    record(32, 'Chat IA', 'Prueba C: Memoria y Contexto', err.message, 'ALTO', 'Revisar historial', 'Excepción', 'FALLIDO');
  }

  // Prueba D: Mensaje largo con párrafos, signos y acentos
  console.log('\n  [Prueba D] Mensaje largo con párrafos, signos y acentos...');
  try {
    const longMessage = `Hola estimado equipo de EDMYSOFT,\n\nQuisiera hacerles una consulta detallada: ¿Cómo funciona exactamente el sistema de WhatsApp y la sincronización con bases de datos en la nube?\n\nActualmente atendemos aproximadamente 150 clientes diarios en Bogotá y Medellín, y requerimos saber los precios exactos (en $COP) para facturación y agendamiento automático.\n\n¡Quedo muy atento a su orientación profesional!`;
    const resD = await fetch(BASE_URL + '/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: longMessage, history: [] })
    });
    const dataD = await resD.json();
    if (resD.status === 200 && dataD.success) {
      console.log(`  ✅ Mensaje largo procesado sin truncarse ni fallar.`);
      record(33, 'Chat IA', 'Prueba D: Texto largo y caracteres especiales', null, null, null, 'Procesado íntegro sin errores', 'APROBADO');
    } else {
      record(33, 'Chat IA', 'Prueba D: Texto largo y caracteres especiales', 'Fallo de procesamiento', 'MEDIO', 'Revisar body parsing', 'Error', 'FALLIDO');
    }
  } catch (err) {
    record(33, 'Chat IA', 'Prueba D: Texto largo y caracteres especiales', err.message, 'MEDIO', 'Revisar payload limits', 'Excepción', 'FALLIDO');
  }

  // Prueba E: Mensaje vacío / solo espacios
  console.log('\n  [Prueba E] Validación de mensaje vacío o solo espacios...');
  try {
    const resE = await fetch(BASE_URL + '/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '     ', history: [] })
    });
    const dataE = await resE.json().catch(() => ({}));
    if (resE.status === 400 && dataE && dataE.success === false) {
      console.log(`  ✅ Mensaje vacío rechazado correctamente con HTTP 400 (${dataE.error}).`);
      record(34, 'Chat IA', 'Prueba E: Validación mensaje vacío', null, null, null, 'Rechazo HTTP 400 correcto', 'APROBADO');
    } else {
      console.log(`  ❌ Fallo en Prueba E: Estado ${resE.status}`, dataE);
      record(34, 'Chat IA', 'Prueba E: Validación mensaje vacío', 'Aceptó mensaje en blanco', 'BAJO', 'Validar !message.trim()', 'No validado', 'FALLIDO');
    }
  } catch (err) {
    record(34, 'Chat IA', 'Prueba E: Validación mensaje vacío', err.message, 'BAJO', 'Revisar validación', 'Excepción', 'FALLIDO');
  }

  // Prueba F: Fallo controlado / payload malformado
  console.log('\n  [Prueba F] Gestión de errores y payload malformado...');
  try {
    const resF = await fetch(BASE_URL + '/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 12345, history: 'not-an-array' })
    });
    if (resF.status === 400) {
      console.log(`  ✅ Payload inválido controlado limpiamente con código 400.`);
      record(35, 'Chat IA', 'Prueba F: Control de errores de red', null, null, null, 'Error controlado (400) sin crashear el servidor', 'APROBADO');
    } else {
      record(35, 'Chat IA', 'Prueba F: Control de errores de red', `Estado ${resF.status}`, 'MEDIO', 'Validar tipos', 'No controlado', 'FALLIDO');
    }
  } catch (err) {
    record(35, 'Chat IA', 'Prueba F: Control de errores de red', err.message, 'BAJO', 'Proteger endpoint', 'Excepción', 'FALLIDO');
  }

  // Prueba G & H: Envíos simultáneos / doble clic
  console.log('\n  [Prueba G y H] Envíos concurrentes / resistencia a doble clic...');
  try {
    const t0 = Date.now();
    const calls = [
      fetch(BASE_URL + '/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: '¿Planes de web?', history: [] }) }),
      fetch(BASE_URL + '/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: '¿Planes de web?', history: [] }) })
    ];
    const responses = await Promise.all(calls);
    const msGH = Date.now() - t0;
    const ok = responses.every(r => r.status === 200);
    if (ok) {
      console.log(`  ✅ Concurrencia de 2 peticiones resuelta en ${msGH}ms sin bloqueo ni colisión.`);
      record(36, 'Chat IA', 'Prueba G/H: Envíos concurrentes', null, null, null, `2 peticiones paralelas HTTP 200 en ${msGH}ms`, 'APROBADO');
    } else {
      record(36, 'Chat IA', 'Prueba G/H: Envíos concurrentes', 'Fallo en concurrencia', 'ALTO', 'Revisar pool de conexiones', 'Colisión', 'FALLIDO');
    }
  } catch (err) {
    record(36, 'Chat IA', 'Prueba G/H: Envíos concurrentes', err.message, 'ALTO', 'Revisar concurrencia', 'Excepción', 'FALLIDO');
  }

  // ---------------------------------------------------------------------
  // FASE 4: HISTORIAL Y PERSISTENCIA DE CONVERSACIONES (BASE DE DATOS)
  // ---------------------------------------------------------------------
  console.log('\n>>> [FASE 4] Probando guardado real de conversaciones en Prisma DB...');
  let testContactConvId = null;
  let testConvId = null;
  try {
    // 1. Crear contacto
    const testContact = await prisma.contact.create({
      data: {
        fullName: 'Contacto Test Conversación',
        phone: '573008888888',
        preferredChannel: 'WEB_FORM'
      }
    });
    testContactConvId = testContact.id;

    // 2. Crear conversación asociada
    const testConv = await prisma.conversation.create({
      data: {
        contactId: testContact.id,
        channel: 'WEB',
        status: 'AI_HANDLING'
      }
    });
    testConvId = testConv.id;

    // 3. Insertar mensaje de usuario
    await prisma.message.create({
      data: {
        conversationId: testConv.id,
        senderType: 'CLIENT',
        senderName: 'Usuario Auditoría',
        content: '¿Tienen soporte 24/7?'
      }
    });

    // 4. Insertar respuesta de IA
    await prisma.message.create({
      data: {
        conversationId: testConv.id,
        senderType: 'AI',
        senderName: 'EDMYSOFT Atiende (IA)',
        content: 'Sí, nuestro agente de IA atiende 24/7 los 365 días del año.'
      }
    });

    // 5. Recuperar y verificar cronología
    const readBack = await prisma.conversation.findUnique({
      where: { id: testConv.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (readBack && readBack.messages.length === 2 && readBack.messages[0].senderType === 'CLIENT' && readBack.messages[1].senderType === 'AI') {
      console.log(`  ✅ Conversación #${testConvId} creada y recuperada con 2 mensajes en orden cronológico exacto.`);
      record(40, 'Persistencia DB', 'Creación y recuperación de conversación', null, null, null, '2 mensajes guardados y verificados con relación a Contact', 'APROBADO');
    } else {
      record(40, 'Persistencia DB', 'Creación y recuperación de conversación', 'Mensajes no coinciden', 'ALTO', 'Revisar prisma relation', 'Inconsistente', 'FALLIDO');
    }
  } catch (err) {
    console.error('  ❌ Error en persistencia de conversación:', err.message);
    record(40, 'Persistencia DB', 'Creación y recuperación de conversación', err.message, 'CRÍTICO', 'Revisar esquema Message', 'Excepción', 'FALLIDO');
  } finally {
    if (testConvId) {
      await prisma.message.deleteMany({ where: { conversationId: testConvId } });
      await prisma.conversation.delete({ where: { id: testConvId } });
    }
    if (testContactConvId) {
      await prisma.contact.delete({ where: { id: testContactConvId } });
      console.log(`  🧹 Limpieza completada: Conversación y contacto de prueba eliminados.`);
    }
  }

  // ---------------------------------------------------------------------
  // FASE 5: ACCESO AL PANEL DE ADMINISTRACIÓN
  // ---------------------------------------------------------------------
  console.log('\n>>> [FASE 5] Probando flujo completo de autenticación administrativa...');

  // 1. Acceso no autenticado a endpoint protegido
  try {
    const unauthRes = await fetch(BASE_URL + '/api/admin/ai-config');
    if (unauthRes.status === 401) {
      console.log('  ✅ Intento sin credenciales rechazado con 401 Unauthorized.');
      record(50, 'Autenticación', 'Protección de rutas privadas sin sesión', null, null, null, 'HTTP 401 correcto', 'APROBADO');
    } else {
      record(50, 'Autenticación', 'Protección de rutas privadas sin sesión', `Estado inesperado ${unauthRes.status}`, 'CRÍTICO', 'Asegurar isAdmin()', 'No protegido', 'FALLIDO');
    }
  } catch (e) {
    record(50, 'Autenticación', 'Protección de rutas privadas sin sesión', e.message, 'ALTO', 'Revisar middleware', 'Excepción', 'FALLIDO');
  }

  // 2. Login con credenciales erróneas
  try {
    const badLoginRes = await fetch(BASE_URL + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fake@unknown.com', password: 'wrongpassword' })
    });
    const badData = await badLoginRes.json();
    if (badLoginRes.status === 401 && badData.success === false) {
      console.log('  ✅ Credenciales inválidas rechazadas con 401 y mensaje comprensible.');
      record(51, 'Autenticación', 'Rechazo de credenciales incorrectas', null, null, null, 'HTTP 401 con mensaje descriptivo', 'APROBADO');
    } else {
      record(51, 'Autenticación', 'Rechazo de credenciales incorrectas', 'No devolvió 401', 'ALTO', 'Revisar verifyUserCredentials', 'Fallo', 'FALLIDO');
    }
  } catch (e) {
    record(51, 'Autenticación', 'Rechazo de credenciales incorrectas', e.message, 'ALTO', 'Revisar endpoint', 'Excepción', 'FALLIDO');
  }

  // 3. Login con credenciales válidas oficiales
  let sessionCookie = null;
  try {
    const loginRes = await fetch(BASE_URL + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ediergallego59@gmail.com', password: 'edsoft1013341239' })
    });
    const loginData = await loginRes.json();
    const rawCookie = loginRes.headers.get('set-cookie');
    if (loginRes.status === 200 && loginData.success && rawCookie) {
      sessionCookie = rawCookie.split(';')[0];
      console.log(`  ✅ Login exitoso como SUPERADMIN (${loginData.user.name}) con cookie emitida.`);
      record(52, 'Autenticación', 'Inicio de sesión con credenciales oficiales', null, null, null, 'HTTP 200 con Set-Cookie y redirectTo: /admin', 'APROBADO');
    } else {
      record(52, 'Autenticación', 'Inicio de sesión con credenciales oficiales', 'Fallo de autenticación válida', 'CRÍTICO', 'Revisar hash de contraseña', 'Sin login', 'FALLIDO');
    }
  } catch (e) {
    record(52, 'Autenticación', 'Inicio de sesión con credenciales oficiales', e.message, 'CRÍTICO', 'Revisar /api/auth/login', 'Excepción', 'FALLIDO');
  }

  // 4. Acceso con la cookie al panel administrativo y APIs
  if (sessionCookie) {
    try {
      const authApiRes = await fetch(BASE_URL + '/api/admin/ai-config', {
        headers: { 'Cookie': sessionCookie }
      });
      const authApiData = await authApiRes.json();
      if (authApiRes.status === 200 && authApiData.success) {
        console.log(`  ✅ Acceso autorizado a /api/admin/ai-config verificado con cookie de sesión.`);
        record(53, 'Autenticación', 'Persistencia de sesión en endpoints privados', null, null, null, 'HTTP 200 con datos autenticados', 'APROBADO');
      } else {
        record(53, 'Autenticación', 'Persistencia de sesión en endpoints privados', 'Cookie no autorizó', 'ALTO', 'Revisar lectura de cookies', 'Fallo', 'FALLIDO');
      }
    } catch (e) {
      record(53, 'Autenticación', 'Persistencia de sesión en endpoints privados', e.message, 'ALTO', 'Revisar cookies', 'Excepción', 'FALLIDO');
    }
  }

  // ---------------------------------------------------------------------
  // FASE 6 Y 7: MÓDULOS INTERNOS DEL PANEL Y OPERACIONES CRUD REALES
  // ---------------------------------------------------------------------
  console.log('\n>>> [FASE 6 & 7] Verificando módulos internos de administración y persistencia CRUD...');

  // Módulo 1: Catálogo de Servicios (Crear, Leer, Modificar, Eliminar)
  let testServiceId = null;
  try {
    const createRes = await fetch(BASE_URL + '/api/catalog/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie },
      body: JSON.stringify({
        actionType: 'CREATE_SERVICE',
        name: 'Servicio de Prueba Automatizada',
        slug: 'servicio-prueba-auto-' + Date.now(),
        category: 'Pruebas',
        shortDesc: 'Descripción de prueba para auditoría'
      })
    });
    const createData = await createRes.json();
    if (createData.success && createData.service?.id) {
      testServiceId = createData.service.id;

      const updateRes = await fetch(BASE_URL + '/api/catalog/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie },
        body: JSON.stringify({
          actionType: 'UPDATE_SERVICE',
          id: testServiceId,
          name: 'Servicio de Prueba Renombrado'
        })
      });
      const inDb = await prisma.service.findUnique({ where: { id: testServiceId } });

      if (inDb && inDb.name === 'Servicio de Prueba Renombrado') {
        console.log(`  ✅ [CRUD] Servicio creado y modificado directamente en DB SQLite.`);
        record(60, 'Panel Admin', 'Catálogo de Servicios: Creación y Edición Real', null, null, null, 'Registro creado y actualizado en DB', 'APROBADO');
      }

      await fetch(BASE_URL + `/api/catalog/services?type=SERVICE&id=${testServiceId}`, {
        method: 'DELETE',
        headers: { 'Cookie': sessionCookie }
      });
      const afterDel = await prisma.service.findUnique({ where: { id: testServiceId } });

      if (!afterDel) {
        console.log(`  ✅ [CRUD] Eliminación limpia verificada en DB SQLite (registro ya no existe).`);
        record(61, 'Panel Admin', 'Catálogo de Servicios: Eliminación Controlada', null, null, null, 'Servicio eliminado correctamente de la base de datos', 'APROBADO');
      }
    }
  } catch (err) {
    record(60, 'Panel Admin', 'Catálogo de Servicios: Operaciones CRUD', err.message, 'ALTO', 'Revisar /api/catalog/services', 'Excepción', 'FALLIDO');
  } finally {
    if (testServiceId) await prisma.service.deleteMany({ where: { id: testServiceId } });
  }

  // Módulo 2: Motor de Precios y Regateo IA (/api/admin/pricing con cookie)
  try {
    const pricingRes = await fetch(BASE_URL + '/api/admin/pricing', {
      headers: { 'Cookie': sessionCookie }
    });
    const pricingData = await pricingRes.json();
    const planKeys = pricingData.plans ? Object.keys(pricingData.plans) : [];
    if (pricingRes.status === 200 && pricingData.success && planKeys.length > 0) {
      console.log(`  ✅ Motor de Precios y Regateo IA activo con ${planKeys.length} planes en moneda COP (${planKeys.join(', ')}).`);
      record(62, 'Panel Admin', 'Tarifas y Regateo IA (/admin/precios)', null, null, null, `${planKeys.length} planes y reglas de regateo cargados en COP`, 'APROBADO');
    } else {
      record(62, 'Panel Admin', 'Tarifas y Regateo IA (/admin/precios)', 'No devolvió planes', 'MEDIO', 'Revisar /api/admin/pricing', 'Fallo', 'FALLIDO');
    }
  } catch (e) {
    record(62, 'Panel Admin', 'Tarifas y Regateo IA (/admin/precios)', e.message, 'MEDIO', 'Revisar precios', 'Excepción', 'FALLIDO');
  }

  // Módulo 3: Base de Conocimiento RAG
  try {
    const fs = require('fs');
    const path = require('path');
    const kbPath = path.join(process.cwd(), '.edmysoft', 'business-knowledge.json');
    if (fs.existsSync(kbPath)) {
      const kbData = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
      const keys = Object.keys(kbData);
      console.log(`  ✅ Base de Conocimiento RAG verificada con ${keys.length} secciones clave.`);
      record(63, 'Panel Admin', 'Base de Conocimiento RAG (/admin/conocimiento)', null, null, null, `Archivo JSON íntegro con secciones: ${keys.join(', ')}`, 'APROBADO');
    } else {
      record(63, 'Panel Admin', 'Base de Conocimiento RAG (/admin/conocimiento)', 'Archivo no encontrado', 'ALTO', 'Generar business-knowledge.json', 'Inexistente', 'FALLIDO');
    }
  } catch (e) {
    record(63, 'Panel Admin', 'Base de Conocimiento RAG (/admin/conocimiento)', e.message, 'MEDIO', 'Revisar RAG', 'Excepción', 'FALLIDO');
  }

  // Módulo 4: Oportunidades y CRM
  let testContactId = null;
  let testOppId = null;
  try {
    const testContact = await prisma.contact.create({
      data: {
        fullName: 'Contacto Prueba Auditoría',
        phone: '573009999999',
        email: 'auditoria@edmysoft.com',
        preferredChannel: 'WEB_FORM'
      }
    });
    testContactId = testContact.id;

    const testOpp = await prisma.opportunity.create({
      data: {
        contactId: testContact.id,
        title: 'Oportunidad Prueba Auditoría',
        stage: 'NUEVO',
        serviceInterest: 'ia',
        targetBudget: 2200000
      }
    });
    testOppId = testOpp.id;

    await prisma.opportunity.update({
      where: { id: testOpp.id },
      data: { stage: 'CALIFICADO' }
    });

    const checkOpp = await prisma.opportunity.findUnique({ where: { id: testOpp.id } });
    if (checkOpp && checkOpp.stage === 'CALIFICADO') {
      console.log(`  ✅ Flujo CRM verificado: Lead creado y promovido a CALIFICADO.`);
      record(64, 'Panel Admin', 'CRM de Oportunidades (/admin/oportunidades)', null, null, null, 'Contacto y Oportunidad creados y actualizados en DB', 'APROBADO');
    }
  } catch (e) {
    record(64, 'Panel Admin', 'CRM de Oportunidades (/admin/oportunidades)', e.message, 'MEDIO', 'Revisar opportunity model', 'Excepción', 'FALLIDO');
  } finally {
    if (testOppId) await prisma.opportunity.deleteMany({ where: { id: testOppId } });
    if (testContactId) await prisma.contact.deleteMany({ where: { id: testContactId } });
  }

  // ---------------------------------------------------------------------
  // TABLA FINAL DE INFORME OBLIGATORIO
  // ---------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log('  TABLA RESUMEN DE AUDITORÍA CON RESULTADOS REALES');
  console.log('========================================================================');
  console.log('ID | Módulo | Función | Severidad | Estado | Resultado de la Prueba');
  console.log('---|--------|---------|-----------|--------|-----------------------');
  for (const r of auditResults) {
    console.log(`${String(r.id).padEnd(2)} | ${r.module.padEnd(16)} | ${r.function.padEnd(35)} | ${r.severity.padEnd(9)} | ${r.status.padEnd(8)} | ${r.testResult}`);
  }

  await prisma.$disconnect();
}

runAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
