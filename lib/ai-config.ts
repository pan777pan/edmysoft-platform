import fs from 'fs';
import path from 'path';

/**
 * Configuración del agente de IA editable desde el panel (/admin/ia).
 * Se guarda en .edmysoft/ai-config.json (fuera del control de versiones)
 * y tiene prioridad sobre las variables de entorno.
 */
export interface AIConfig {
  provider: 'auto' | 'gemini' | 'openai' | 'openrouter' | 'local';
  geminiApiKey: string;
  geminiModel: string;
  openaiApiKey: string;
  openaiModel: string;
  openrouterApiKey: string;
  openrouterModel: string;
  temperature: number;
  ownerWhatsApp: string; // número que recibe alertas de leads calientes y citas
  notifyOwner: boolean;
  extraInstructions: string; // instrucciones comerciales adicionales del dueño
}

const CONFIG_DIR = path.join(process.cwd(), '.edmysoft');
const CONFIG_FILE = path.join(CONFIG_DIR, 'ai-config.json');

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'auto',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  openrouterApiKey: '',
  openrouterModel: 'meta-llama/llama-3.3-70b-instruct:free',
  temperature: 0.6,
  ownerWhatsApp: '573234166354',
  notifyOwner: true,
  extraInstructions: '',
};

let cache: { mtime: number; value: AIConfig } | null = null;

export function loadAIConfig(): AIConfig {
  let fileCfg: Partial<AIConfig> = {};
  try {
    const stat = fs.statSync(CONFIG_FILE);
    if (cache && cache.mtime === stat.mtimeMs) return cache.value;
    fileCfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    const merged = withEnvFallback({ ...DEFAULT_AI_CONFIG, ...fileCfg });
    cache = { mtime: stat.mtimeMs, value: merged };
    return merged;
  } catch {
    return withEnvFallback({ ...DEFAULT_AI_CONFIG });
  }
}

function withEnvFallback(cfg: AIConfig): AIConfig {
  return {
    ...cfg,
    geminiApiKey: cfg.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
    openaiApiKey: cfg.openaiApiKey || process.env.OPENAI_API_KEY || '',
    openrouterApiKey: cfg.openrouterApiKey || process.env.OPENROUTER_API_KEY || '',
    geminiModel: cfg.geminiModel || process.env.GEMINI_MODEL || DEFAULT_AI_CONFIG.geminiModel,
    openaiModel: cfg.openaiModel || process.env.OPENAI_MODEL || DEFAULT_AI_CONFIG.openaiModel,
  };
}

export function saveAIConfig(patch: Partial<AIConfig>): AIConfig {
  const current = loadAIConfig();
  const next: AIConfig = { ...current, ...patch };
  // Una clave enmascarada ("••••") enviada desde el panel significa "sin cambios"
  (['geminiApiKey', 'openaiApiKey', 'openrouterApiKey'] as const).forEach((k) => {
    if (typeof patch[k] === 'string' && patch[k]!.includes('•')) next[k] = current[k];
  });
  next.temperature = Math.min(1, Math.max(0, Number(next.temperature) || 0.6));
  next.ownerWhatsApp = String(next.ownerWhatsApp || '').replace(/\D/g, '');

  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), 'utf-8');
  cache = null;
  return next;
}

export function maskKey(key: string): string {
  if (!key) return '';
  return key.length <= 8 ? '••••' : `••••••••${key.slice(-4)}`;
}

/** Versión segura para enviar al navegador (claves enmascaradas). */
export function publicAIConfig(cfg: AIConfig = loadAIConfig()) {
  return {
    ...cfg,
    geminiApiKey: maskKey(cfg.geminiApiKey),
    openaiApiKey: maskKey(cfg.openaiApiKey),
    openrouterApiKey: maskKey(cfg.openrouterApiKey),
    hasGemini: !!cfg.geminiApiKey,
    hasOpenAI: !!cfg.openaiApiKey,
    hasOpenRouter: !!cfg.openrouterApiKey,
  };
}
