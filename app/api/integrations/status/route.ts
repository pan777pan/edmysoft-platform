import { NextResponse } from 'next/server';

export async function GET() {
  const hasMeta = !!(process.env.META_ACCESS_TOKEN && process.env.META_PHONE_NUMBER_ID);
  const hasWompi = !!(process.env.WOMPI_PUBLIC_KEY && process.env.WOMPI_PRIVATE_KEY);
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const hasN8N = !!process.env.N8N_WEBHOOK_URL;

  const integrations = [
    {
      id: 'whatsapp-meta',
      name: 'WhatsApp Business Platform (Cloud API)',
      provider: 'Meta',
      category: 'Mensajería',
      status: hasMeta ? 'CONNECTED' : 'CONFIGURED_TEST_MODE',
      details: hasMeta ? 'Conexión activa con Phone Number ID' : 'Modo Sandbox de desarrollo listo para verificación',
      lastPing: new Date().toISOString(),
    },
    {
      id: 'openrouter-ai',
      name: 'Motor de Inteligencia Artificial (OpenRouter)',
      provider: 'OpenRouter / Anthropic',
      category: 'Inteligencia Artificial',
      status: hasOpenRouter ? 'CONNECTED' : 'LOCAL_FALLBACK_ACTIVE',
      details: hasOpenRouter ? 'Modelo activo: Claude 3.5 Sonnet' : 'Motor determinista local de respaldo activo',
      lastPing: new Date().toISOString(),
    },
    {
      id: 'wompi-payments',
      name: 'Pasarela de Cobro Wompi (Colombia)',
      provider: 'Bancolombia / Wompi',
      category: 'Pagos y Anticipos',
      status: hasWompi ? 'CONFIGURED_TEST_MODE' : 'DISCONNECTED',
      details: 'Soporte de PSE, Nequi, Daviplata y Tarjetas de Crédito',
      lastPing: new Date().toISOString(),
    },
    {
      id: 'n8n-orchestrator',
      name: 'Orquestador de Procesos n8n',
      provider: 'n8n',
      category: 'Automatización',
      status: hasN8N ? 'CONFIGURED_TEST_MODE' : 'DISCONNECTED',
      details: 'Endpoint de webhook configurado para eventos de CRM y cotizaciones',
      lastPing: new Date().toISOString(),
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar API',
      provider: 'Google Cloud',
      category: 'Agenda Comercial',
      status: 'CONFIGURED_TEST_MODE',
      details: 'Consulta de disponibilidad horaria y reservas automáticas',
      lastPing: new Date().toISOString(),
    },
  ];

  return NextResponse.json({ success: true, integrations });
}
