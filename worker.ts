import http from 'http';
import prisma from './lib/prisma';
import {
  startBaileysSocket,
  disconnectBaileysSocket,
  getBaileysState,
  setBaileysSettings,
  sendWhatsAppMessageDirect,
} from './lib/whatsapp-baileys';

const PORT = Number(process.env.PORT) || 8080;

// Servidor HTTP ligero para health-check de Render/Koyeb y API de control
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  // Health-check (Render, Koyeb, UptimeRobot)
  if (url.pathname === '/' || url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(
      JSON.stringify({
        status: 'ok',
        service: 'EDMYSOFT WhatsApp 24/7 Worker',
        baileys: getBaileysState(),
        timestamp: new Date().toISOString(),
      })
    );
  }

  // Estado en vivo de WhatsApp
  if (url.pathname === '/api/status' && req.method === 'GET') {
    const state = getBaileysState();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, ...state, data: state }));
  }

  // Acciones (iniciar, desconectar, cambiar ajustes, mensaje de prueba)
  if (url.pathname === '/api/action' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { action, to, message, autoReplyAI, autoCalendar } = payload;

        if (action === 'start') {
          console.log('[Worker] Solicitud de inicio de socket recibida...');
          const state = await startBaileysSocket({ force: true, note: 'Iniciado vía Worker API' });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, ...state, data: state }));
        }

        if (action === 'disconnect') {
          console.log('[Worker] Solicitud de desconexión recibida...');
          const state = await disconnectBaileysSocket();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, ...state, data: state }));
        }

        if (action === 'settings') {
          const state = setBaileysSettings({ autoReplyAI, autoCalendar });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, ...state, data: state }));
        }

        if (action === 'send_test') {
          if (!to || !message) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: 'to y message requeridos' }));
          }
          await sendWhatsAppMessageDirect(to, message);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, message: 'Mensaje enviado con éxito' }));
        }

        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Acción no válida' }));
      } catch (err: any) {
        console.error('[Worker] Error procesando acción:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
});

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`[EDMYSOFT Worker] Servidor escuchando en http://0.0.0.0:${PORT}`);

  // Asegurar fila inicial en Supabase
  try {
    const existing = await prisma.whatsAppConnection.findFirst();
    if (!existing) {
      await prisma.whatsAppConnection.create({
        data: {
          provider: 'QR_DEVICE',
          status: 'DISCONNECTED',
        },
      });
      console.log('[Worker] Registro WhatsAppConnection inicial creado en Supabase.');
    }
  } catch (err) {
    console.error('[Worker] Error verificando WhatsAppConnection en Supabase:', err);
  }

  // Iniciar automáticamente el socket de Baileys al arrancar el contenedor
  try {
    console.log('[Worker] Arrancando socket de WhatsApp Baileys en segundo plano...');
    await startBaileysSocket({ note: 'Autoarranque al iniciar el worker' });
  } catch (err) {
    console.error('[Worker] Error al arrancar Baileys:', err);
  }
});

// Manejo limpio de apagado
process.on('SIGTERM', async () => {
  console.log('[Worker] Recibido SIGTERM, cerrando servidor...');
  server.close();
  await disconnectBaileysSocket();
  process.exit(0);
});
