const testMessages = [
  'Hola',
  '¿Cuánto cuesta el Agente de IA?'
];

async function testWebChatCloudflare() {
  const base = process.env.BASE_URL || 'https://synthesis-table-governmental-hand.trycloudflare.com';
  console.log('Testing Cloudflare URL:', base + '/api/ai/chat ...');
  let history = [];
  for (const msg of testMessages) {
    console.log('\n--- Sending:', msg, '---');
    const t0 = Date.now();
    try {
      const res = await fetch(base + '/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history })
      });
      console.log('HTTP Status:', res.status, 'in', Date.now() - t0, 'ms');
      const data = await res.json();
      console.log('Success:', data.success);
      console.log('Reply preview:', data.reply ? data.reply.slice(0, 150) : data);
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

testWebChatCloudflare();
