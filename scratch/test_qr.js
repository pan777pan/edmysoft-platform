// Reproduce: inicia sesión admin, pide "start" y sondea el estado del QR durante 40s
const BASE = process.env.BASE_URL || 'http://localhost:3000';
(async () => {
  const login = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASS }),
  });
  const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
  console.log('login', login.status);
  const h = { 'Content-Type': 'application/json', Cookie: cookie };

  const before = await (await fetch(BASE + '/api/whatsapp/baileys', { headers: h })).json();
  console.log('antes:', before.status, 'qr:', !!before.qrCode, 'err:', before.errorLog);

  const t0 = Date.now();
  const start = await fetch(BASE + '/api/whatsapp/baileys', { method: 'POST', headers: h, body: JSON.stringify({ action: 'start' }) });
  const sj = await start.json();
  console.log('start', start.status, sj.status, 'err:', sj.errorLog || sj.error, `${Date.now() - t0}ms`);

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const s = await (await fetch(BASE + '/api/whatsapp/baileys', { headers: h })).json();
    console.log(`t+${(i + 1) * 2}s`, s.status, 'qr:', s.qrCode ? `SI (${s.qrCode.length} chars)` : 'no', 'err:', s.errorLog);
    if (s.qrCode || s.status === 'CONNECTED') break;
  }
})();
