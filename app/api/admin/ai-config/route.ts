import { NextRequest, NextResponse } from 'next/server';
import { loadAIConfig, saveAIConfig, publicAIConfig } from '@/lib/ai-config';
import { generateAIResponse, getAIStatus } from '@/lib/ai-engine';
import { isAdminRequest } from '@/lib/session';

const isAdmin = isAdminRequest;

const unauthorized = () => NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

// GET: configuración (claves enmascaradas) + último estado del LLM
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  return NextResponse.json({ success: true, config: publicAIConfig(), status: getAIStatus() });
}

// PUT: guardar configuración
export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const allowed = [
    'provider',
    'geminiApiKey',
    'geminiModel',
    'openaiApiKey',
    'openaiModel',
    'openrouterApiKey',
    'openrouterModel',
    'temperature',
    'ownerWhatsApp',
    'notifyOwner',
    'extraInstructions',
  ];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];
  if (typeof patch.extraInstructions === 'string') patch.extraInstructions = patch.extraInstructions.slice(0, 4000);
  saveAIConfig(patch);
  return NextResponse.json({ success: true, config: publicAIConfig() });
}

// POST: probar el agente con un mensaje real contra el proveedor configurado
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const message = String(body.message || 'Hola, tengo una tienda y me escriben muchos clientes por WhatsApp. ¿Qué me recomiendas?');
  const started = Date.now();
  const result = await generateAIResponse(message, [], { channel: 'WEB', contactName: 'Prueba Admin', allowScheduling: false });
  const cfg = loadAIConfig();
  const usingLLM = !!result.modelUsed && !result.modelUsed.startsWith('agente-');
  return NextResponse.json({
    success: true,
    usingLLM,
    modelUsed: result.modelUsed,
    reply: result.reply,
    toolsUsed: result.toolsUsed,
    ms: Date.now() - started,
    hasAnyKey: !!(cfg.geminiApiKey || cfg.openaiApiKey || cfg.openrouterApiKey),
    status: getAIStatus(),
  });
}
