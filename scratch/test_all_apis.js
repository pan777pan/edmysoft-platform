async function testApiEndpoints() {
  const endpoints = [
    { method: 'GET', path: '/api/catalog' },
    { method: 'GET', path: '/api/leads' },
    { method: 'GET', path: '/api/pricing' },
    { method: 'GET', path: '/api/whatsapp/baileys' },
    { method: 'GET', path: '/api/admin/whatsapp-demo' },
    {
      method: 'POST',
      path: '/api/ai/chat',
      body: { message: 'Hola' }
    },
    {
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'ediergallego59@gmail.com', password: 'edsoft1013341239' }
    }
  ];

  console.log('--- TESTING ALL API ENDPOINTS ---');
  for (const ep of endpoints) {
    const t0 = Date.now();
    try {
      const opts = {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (ep.body) opts.body = JSON.stringify(ep.body);

      const res = await fetch('http://localhost:3000' + ep.path, opts);
      const data = await res.json().catch(() => ({}));
      const ms = Date.now() - t0;
      console.log(`[${res.status}] ${ep.method} ${ep.path.padEnd(25)} in ${ms}ms - success: ${data.success !== false}`);
      if (res.status >= 400 || data.success === false) {
        console.log('   Error:', data.error || data.message || 'Unknown');
      }
    } catch (err) {
      console.log(`[ERR] ${ep.method} ${ep.path}: ${err.message}`);
    }
  }
}

testApiEndpoints();
