const adminPages = [
  '/admin',
  '/admin/oportunidades',
  '/admin/contactos',
  '/admin/conversaciones',
  '/admin/cotizaciones',
  '/admin/catalogo/servicios',
  '/admin/catalogo/modulos',
  '/admin/precios',
  '/admin/conocimiento',
  '/admin/ia',
  '/admin/whatsapp',
  '/admin/automatizaciones',
  '/admin/integraciones',
  '/admin/ajustes',
  '/admin/actividad',
  '/admin/costes-recurrentes',
  '/admin/cms',
  '/admin/login'
];

async function checkAdminPages() {
  const base = process.env.BASE_URL || 'https://synthesis-table-governmental-hand.trycloudflare.com';
  console.log('Testing ALL Admin Pages via Cloudflare Tunnel:', base);
  let failed = 0;
  for (const page of adminPages) {
    const t0 = Date.now();
    try {
      const res = await fetch(base + page, {
        headers: {
          'Cookie': 'edmysoft_session=' + JSON.stringify({ role: 'ADMIN', email: 'ediergallego59@gmail.com' })
        }
      });
      const ms = Date.now() - t0;
      if (res.status === 200) {
        console.log(`✅ [200] ${page.padEnd(30)} in ${ms}ms`);
      } else {
        failed++;
        console.log(`❌ [${res.status}] ${page.padEnd(30)} in ${ms}ms`);
      }
    } catch (err) {
      failed++;
      console.log(`❌ [ERR] ${page.padEnd(30)}: ${err.message}`);
    }
  }
  console.log(`Finished: ${adminPages.length - failed}/${adminPages.length} pages operational.`);
}

checkAdminPages();
