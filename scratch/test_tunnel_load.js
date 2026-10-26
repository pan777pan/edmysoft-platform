const routes = [
  '/',
  '/admin/login',
  '/admin',
  '/admin/whatsapp',
  '/admin/catalogo/servicios',
  '/admin/catalogo/modulos',
  '/admin/conocimiento',
  '/api/whatsapp/baileys',
  '/api/admin/whatsapp-demo'
];

async function checkAll() {
  const base = 'https://f393f9ebd6f115.lhr.life';
  console.log('Testing all routes on ' + base + ' ...');
  for (const r of routes) {
    const t0 = Date.now();
    try {
      const res = await fetch(base + r, {
        headers: {
          'Cookie': 'edmysoft_session=' + JSON.stringify({ role: 'ADMIN', email: 'ediergallego59@gmail.com' })
        }
      });
      const ms = Date.now() - t0;
      console.log(`[${res.status}] ${r.padEnd(28)} in ${ms}ms`);
      if (res.status >= 400) {
        const text = await res.text();
        console.log(`   Error preview:`, text.slice(0, 150));
      }
    } catch (err) {
      console.log(`[ERR] ${r.padEnd(28)}: ${err.message}`);
    }
  }
}

checkAll();
