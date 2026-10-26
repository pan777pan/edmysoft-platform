const path = require('path');

// Simular el entorno
const { loadWhatsAppDemoConfig, handleDemoConversation } = require('../lib/whatsapp-demo.ts');

async function runTest() {
  console.log('=== TEST DE CONVERSACIÓN MULTI-TURNO: MODO DEMOSTRACIÓN ===\n');
  const cfg = loadWhatsAppDemoConfig();
  console.log('Negocio Activo:', cfg.clientBusinessName);
  console.log('Descripción:', cfg.clientDescription);
  console.log('--------------------------------------------------\n');

  const turns = [
    'Hola',
    'Para un cita',
    'Edier mery gallego  para úna revisión odontológica y sacar un acarie',
    'Mañana a las 10am',
    'Sí, perfecto muchas gracias',
  ];

  const history = [];

  for (let i = 0; i < turns.length; i++) {
    const userMsg = turns[i];
    console.log(`👤 CLIENTE [Turno ${i + 1}]:`, userMsg);

    const result = handleDemoConversation(userMsg, history, cfg, null);
    console.log(`🤖 BOT (${result.modelUsed} | Intent: ${result.intent}):\n${result.reply}\n`);
    console.log('--------------------------------------------------\n');

    history.push({ role: 'user', content: userMsg });
    history.push({ role: 'assistant', content: result.reply });
  }
}

runTest().catch(console.error);
