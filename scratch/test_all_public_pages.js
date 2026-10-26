const publicPages = [
  '/',
  '/servicios',
  '/precios',
  '/nosotros',
  '/contacto',
  '/blog',
  '/portal'
];

async function checkPublicPages() {
  const base = 'https://yearly-mistress-professor-preference.trycloudflare.com';
  console.log('Testing ALL Public Pages via Cloudflare Tunnel...');
  let failed = 0;
  for (const page of publicPages) {
    const t0 = Date.now();
    try {
      const res = await fetch(base + page);
      const ms = Date.now() - t0;
      if (res.status === 200) {
        console.log(`✅ [200] ${page.padEnd(20)} in ${ms}ms`);
      } else {
        failed++;
        console.log(`❌ [${res.status}] ${page.padEnd(20)} in ${ms}ms`);
      }
    } catch (err) {
      failed++;
      console.log(`❌ [ERR] ${page.padEnd(20)}: ${err.message}`);
    }
  }
  console.log(`Finished: ${publicPages.length - failed}/${publicPages.length} public pages operational.`);
}

checkPublicPages();
