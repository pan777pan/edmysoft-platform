import { generateAIResponse } from '../lib/ai-engine';
import { getCustomerMemory } from '../lib/customer-memory';

async function runTests() {
  console.log('=== TEST 1: RECONOCIMIENTO Y MEMORIA CONTINUA DEL CLIENTE ===\n');

  const testPhone = '573109876543';
  const testName = 'Carlos Restrepo';

  // Sesión 1: El cliente se presenta e indica su negocio
  console.log('1. Turno inicial: Carlos se presenta y cuenta su dolor...');
  const res1 = await generateAIResponse(
    'Hola, me llamo Carlos Restrepo, tengo un restaurante campestre en Chía y nos entran 70 mensajes al día los fines de semana y se nos pierden reservas',
    [],
    {
      channel: 'WHATSAPP',
      contactPhone: testPhone,
      clientIdentifier: testPhone,
    }
  );

  console.log('Respuesta Turno 1:\n', res1.reply);
  console.log('\n--- Esperando persistencia de memoria ---');
  await new Promise((r) => setTimeout(r, 600));

  // Verificar perfil guardado en DB
  const memory = await getCustomerMemory(testPhone);
  console.log('Memoria guardada en DB:', {
    nombre: memory?.fullName,
    sector: memory?.businessSector,
    volumen: memory?.dailyVolume,
    dolor: memory?.keyPain,
    interacciones: memory?.interactionsCount,
  });

  const memoryOk =
    memory?.fullName?.includes('Carlos') &&
    memory?.businessSector?.includes('Gastronomía') &&
    memory?.dailyVolume?.includes('70');
  console.log('¿Memoria estructurada capturada correctamente?:', memoryOk ? '✅ SÍ' : '❌ NO');

  // Sesión 2: El cliente vuelve días después e inicia conversación vacía (sin historial inmediato en el array)
  console.log('\n2. Turno posterior: Carlos vuelve (sesión nueva, array vacío de historial)...');
  const res2 = await generateAIResponse('Hola buenas tardes', [], {
    channel: 'WHATSAPP',
    contactPhone: testPhone,
    clientIdentifier: testPhone,
  });

  console.log('Respuesta Turno 2 (Reconocimiento del cliente):\n', res2.reply);
  const recognizedName = res2.reply.includes('Carlos');
  const recognizedBiz = res2.reply.toLowerCase().includes('gastronomía') || res2.reply.toLowerCase().includes('restaurante');
  console.log('¿Reconoció a Carlos por su nombre?:', recognizedName ? '✅ SÍ' : '❌ NO');
  console.log('¿Hizo alusión a su negocio anterior?:', recognizedBiz ? '✅ SÍ' : '❌ NO');

  console.log('\n======================================================');
  console.log('=== TEST 2: RESPUESTAS INGENIOSAS ANTE COMENTARIOS "NADA QUE VER" (PIVOTE A LA VENTA) ===\n');

  const offTopicTests = [
    {
      prompt: 'Cuéntame un chiste por favor',
      expectedTheme: 'chiste / risa / humor',
      verify: (text: string) => text.toLowerCase().includes('dueño de negocio') || text.toLowerCase().includes('precio') || text.toLowerCase().includes('humor'),
    },
    {
      prompt: 'Ayer jugó la selección colombia, me encanta el fútbol',
      expectedTheme: 'fútbol / cancha / goles vs arquero',
      verify: (text: string) => text.toLowerCase().includes('cancha') || text.toLowerCase().includes('goleador') || text.toLowerCase().includes('arquero') || text.toLowerCase().includes('fútbol'),
    },
    {
      prompt: 'Tengo muchísima hambre voy a almorzar',
      expectedTheme: 'comida / almuerzo / paz mental',
      verify: (text: string) => text.toLowerCase().includes('almuerzo') || text.toLowerCase().includes('café') || text.toLowerCase().includes('tranquilidad'),
    },
    {
      prompt: 'Tengo mucha pereza de trabajar hoy, estoy agotado',
      expectedTheme: 'pereza / madre de la automatización',
      verify: (text: string) => text.toLowerCase().includes('pereza') || text.toLowerCase().includes('automatización') || text.toLowerCase().includes('repetitivas'),
    },
    {
      prompt: '¿Tú crees en los extraterrestres o en los ovnis?',
      expectedTheme: 'extraterrestres / tecnología fuera de serie',
      verify: (text: string) => text.toLowerCase().includes('extraterrestres') || text.toLowerCase().includes('tierra') || text.toLowerCase().includes('ia'),
    },
    {
      prompt: 'La economía del país está muy dura y la inflación alta',
      expectedTheme: 'optimización de costos / mayor margen',
      verify: (text: string) => text.toLowerCase().includes('costos') || text.toLowerCase().includes('presupuesto') || text.toLowerCase().includes('1.600.000'),
    },
  ];

  for (const t of offTopicTests) {
    console.log(`\n• Prueba: "${t.prompt}"`);
    const r = await generateAIResponse(t.prompt, [], { channel: 'WHATSAPP' });
    console.log(`Respuesta IA:\n${r.reply.slice(0, 220)}...`);
    const passed = t.verify(r.reply);
    console.log(`Resultado: ${passed ? '✅ PIVOTE INGENIOSO EXITOSO' : '❌ FALLÓ'}`);
  }

  console.log('\n=== FIN DE PRUEBAS AUTOMATIZADAS ===');
}

runTests().catch(console.error);
