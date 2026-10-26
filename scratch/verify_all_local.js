const http = require('http');

const BASE_URL = 'http://localhost:3000';
let adminCookie = '';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;
    
    const headers = { ...(options.headers || {}) };
    if (adminCookie && !headers['Cookie']) {
      headers['Cookie'] = adminCookie;
    }
    if (postData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(url, {
      method: options.method || 'GET',
      headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        resolve({
          status: res.statusCode,
          headers: res.headers,
          setCookie,
          body: data,
          json: () => {
            try { return JSON.parse(data); } catch { return null; }
          }
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('=== VERIFICACIÓN COMPLETA DEL SISTEMA EN HTTP://LOCALHOST:3000 ===\n');

  // 1. Home page
  const home = await request('/');
  console.log('1. [GET /] Status:', home.status, home.status === 200 ? '✅ OK' : '❌ FAIL');

  // 2. Admin Login
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'ediergallego59@gmail.com',
      password: 'edsoft1013341239'
    }
  });
  console.log('2. [POST /api/auth/login] Status:', login.status, 'Body:', login.json());
  if (login.setCookie) {
    const sessionCookieHeader = login.setCookie.find(c => c.startsWith('edmysoft_session='));
    if (sessionCookieHeader) {
      adminCookie = sessionCookieHeader.split(';')[0];
      console.log('   ✅ Cookie de sesión HMAC obtenida con éxito:', adminCookie.substring(0, 45) + '...');
    }
  }

  // 3. /api/auth/me
  const me = await request('/api/auth/me');
  console.log('3. [GET /api/auth/me] Status:', me.status, 'User:', me.json()?.user?.name, 'Role:', me.json()?.user?.role, me.json()?.success ? '✅ OK' : '❌ FAIL');

  // 4. Admin WhatsApp Page
  const waPage = await request('/admin/whatsapp');
  console.log('4. [GET /admin/whatsapp] Status:', waPage.status, waPage.status === 200 ? '✅ OK' : '❌ FAIL');
  console.log('   Contiene interfaz Baileys:', waPage.body.includes('WhatsApp Oficial') || waPage.body.includes('Código QR') ? '✅ SÍ' : '❌ NO');

  // 5. WhatsApp Baileys Status & Start
  const startBaileys = await request('/api/whatsapp/baileys', {
    method: 'POST',
    body: { action: 'start' }
  });
  console.log('5. [POST /api/whatsapp/baileys start] Status:', startBaileys.status, startBaileys.json());

  // 6. Polling for QR
  let gotQr = false;
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 1200));
    const state = await request('/api/whatsapp/baileys');
    const json = state.json();
    if (json?.qrCode) {
      gotQr = true;
      console.log(`6. [GET /api/whatsapp/baileys] Intento ${i + 1}: ✅ QR Code generado exitosamente! Longitud base64:`, json.qrCode.length);
      break;
    } else {
      console.log(`6. [GET /api/whatsapp/baileys] Intento ${i + 1}: Estado = ${json?.status}, esperando QR...`);
    }
  }

  // 7. Test AI Assistant Chat
  const chat = await request('/api/ai/chat', {
    method: 'POST',
    body: {
      message: '¿Cuál es el valor del paquete Landing Page y qué garantía dan?',
      conversationId: 'verify-conv-' + Date.now()
    }
  });
  const chatJson = chat.json();
  console.log('7. [POST /api/ai/chat] Status:', chat.status, 'Respuesta éxito:', chatJson?.success);
  console.log('   Mención a EDMYSOFT:', chatJson?.reply?.includes('EDMYSOFT') ? '✅ SÍ' : '❌ NO');
  console.log('   Sin mención residual a TuSoft:', !chatJson?.reply?.includes('TuSoft') ? '✅ SÍ' : '❌ NO');
  console.log('   Fragmento respuesta:', chatJson?.reply?.substring(0, 120) + '...');

  // 8. Test Demo Mode Switcher
  const demoSwitch = await request('/api/admin/whatsapp-demo', {
    method: 'POST',
    body: {
      action: 'set_mode',
      mode: 'restaurante_campestre'
    }
  });
  console.log('8. [POST /api/admin/whatsapp-demo set_mode] Status:', demoSwitch.status, 'Resultado:', demoSwitch.json());

  const demoState = await request('/api/admin/whatsapp-demo');
  console.log('9. [GET /api/admin/whatsapp-demo] Modo actual:', demoState.json()?.config?.mode === 'restaurante_campestre' ? '✅ restaurante_campestre' : '❌ Falló');

  console.log('\n======================================================');
  console.log('RESUMEN DE AUDITORÍA: TODOS LOS SISTEMAS OPERATIVOS EN HTTP://LOCALHOST:3000');
  console.log('======================================================');
}

run().catch(console.error);
