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
  const base = 'https://yearly-mistress-professor-preference.trycloudflare.com';
  console.log('Testing Cloudflare Tunnel on ' + base + ' ...');
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
    } catch (err) {
      console.log(`[ERR] ${r.padEnd(28)}: ${err.message}`);
    }
  }
}

checkAll();
