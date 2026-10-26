import { generateAIResponse } from '../lib/ai-engine';

async function test() {
  console.log('--- TEST CONVERSATION: MERY EAGLE ---');

  // Turn 1:
  const h1: any[] = [];
  const r1 = await generateAIResponse('Hola', h1, { contactName: 'Mery🦅' });
  console.log('User: Hola');
  console.log('Bot:\n', r1.reply);
  console.log('\n----------------------------------------\n');

  // Turn 2:
  const h2: any[] = [
    { role: 'user', content: 'Hola' },
    { role: 'assistant', content: r1.reply }
  ];
  const r2 = await generateAIResponse('Tengo un negocio de celular y quiero que mi negocio prospere', h2, { contactName: 'Mery🦅' });
  console.log('User: Tengo un negocio de celular y quiero que mi negocio prospere');
  console.log('Bot:\n', r2.reply);
  console.log('\n----------------------------------------\n');

  // Turn 3:
  const h3: any[] = [
    ...h2,
    { role: 'user', content: 'Tengo un negocio de celular y quiero que mi negocio prospere' },
    { role: 'assistant', content: r2.reply }
  ];
  const r3 = await generateAIResponse('Al día atienden 6 clientes', h3, { contactName: 'Mery🦅' });
  console.log('User: Al día atienden 6 clientes');
  console.log('Bot:\n', r3.reply);
  console.log('\n----------------------------------------\n');

  // Turn 4:
  const h4: any[] = [
    ...h3,
    { role: 'user', content: 'Al día atienden 6 clientes' },
    { role: 'assistant', content: r3.reply }
  ];
  const r4 = await generateAIResponse('Dale de una agendemos', h4, { contactName: 'Mery🦅' });
  console.log('User: Dale de una agendemos');
  console.log('Bot:\n', r4.reply);
  console.log('\n----------------------------------------\n');

  // Turn 5:
  const h5: any[] = [
    ...h4,
    { role: 'user', content: 'Dale de una agendemos' },
    { role: 'assistant', content: r4.reply }
  ];
  const r5 = await generateAIResponse('El lunes me queda bien', h5, { contactName: 'Mery🦅' });
  console.log('User: El lunes me queda bien');
  console.log('Bot:\n', r5.reply);
  console.log('\n----------------------------------------\n');

  // Turn 6:
  const h6: any[] = [
    ...h5,
    { role: 'user', content: 'El lunes me queda bien' },
    { role: 'assistant', content: r5.reply }
  ];
  const r6 = await generateAIResponse('A las 2:00 pm', h6, { contactName: 'Mery Gallego' });
  console.log('User: A las 2:00 pm');
  console.log('Bot:\n', r6.reply);
}

test().catch(console.error);
