const testMessages = [
  'Hola',
  '¿Cuánto cuesta el Agente de IA?',
  'Tengo una tienda de celulares',
  'Quiero agendar una cita'
];

async function testWebChat() {
  console.log('Testing /api/ai/chat ...');
  let history = [];
  for (const msg of testMessages) {
    console.log('\n--- Sending:', msg, '---');
    const t0 = Date.now();
    try {
      const res = await fetch('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history })
      });
      console.log('HTTP Status:', res.status, 'in', Date.now() - t0, 'ms');
      const data = await res.json();
      console.log('Success:', data.success);
      console.log('Reply preview:', data.reply ? data.reply.slice(0, 150) : data);
      if (data.reply) {
        history.push({ role: 'user', content: msg });
        history.push({ role: 'assistant', content: data.reply });
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

testWebChat();
