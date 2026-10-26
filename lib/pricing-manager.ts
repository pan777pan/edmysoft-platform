import prisma from './prisma';
import fs from 'fs';
import path from 'path';

export interface PlanData {
  id?: string;
  slug: string;
  name: string;
  description: string;
  setupPrice: number;
  recurringPrice: number;
  isRecommended: boolean;
  featuresIncluded: string[];
}

export interface NegotiationConfig {
  maxDiscountPercent: number; // Porcentaje máximo de descuento que el bot puede ofrecer (ej: 10%)
  allowTwoInstallments: boolean; // Permitir ofrecer pago 50% anticipo y 50% contra entrega
  minSetupFloorCOP: {
    estandar: number;
    plus: number;
    enterprise: number;
  };
}

const CONFIG_DIR = path.join(process.cwd(), '.edmysoft');
const NEGOTIATION_FILE = path.join(CONFIG_DIR, 'negotiation-config.json');

const DEFAULT_NEGOTIATION: NegotiationConfig = {
  maxDiscountPercent: 10,
  allowTwoInstallments: true,
  minSetupFloorCOP: {
    estandar: 2000000,
    plus: 3400000,
    enterprise: 5800000,
  },
};

export function loadNegotiationConfig(): NegotiationConfig {
  try {
    if (fs.existsSync(NEGOTIATION_FILE)) {
      return { ...DEFAULT_NEGOTIATION, ...JSON.parse(fs.readFileSync(NEGOTIATION_FILE, 'utf-8')) };
    }
  } catch {
    /* fallback a valores por defecto */
  }
  return DEFAULT_NEGOTIATION;
}

export function saveNegotiationConfig(cfg: Partial<NegotiationConfig>): NegotiationConfig {
  const current = loadNegotiationConfig();
  const next: NegotiationConfig = { ...current, ...cfg };
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(NEGOTIATION_FILE, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

/**
 * Obtiene los planes comerciales vigentes desde la base de datos de Prisma.
 * Si no existen aún en la base de datos, los inicializa con los valores de catálogo.
 */
export async function getLivePlans(): Promise<Record<string, PlanData>> {
  try {
    const dbPlans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    if (dbPlans.length > 0) {
      const out: Record<string, PlanData> = {};
      for (const p of dbPlans) {
        let features: string[] = [];
        try {
          features = JSON.parse(p.featuresIncluded || '[]');
        } catch {
          features = [];
        }
        out[p.slug] = {
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.description || '',
          setupPrice: p.setupPrice,
          recurringPrice: p.recurringPrice,
          isRecommended: p.isRecommended,
          featuresIncluded: features,
        };
      }
      return out;
    }
  } catch (err) {
    console.warn('Error leyendo planes de BD, usando fallback:', err);
  }

  // Fallback si la BD aún no tiene los registros
  return {
    estandar: {
      slug: 'estandar',
      name: 'Plan Estándar',
      description: 'Atención inteligente 24/7 en WhatsApp para validar y responder consultas frecuentes.',
      setupPrice: 2200000,
      recurringPrice: 350000,
      isRecommended: false,
      featuresIncluded: ['Atención 24/7 en WhatsApp', 'Hasta 30 FAQs entrenadas', 'Control humano en 1 clic', 'Reportes básicos'],
    },
    plus: {
      slug: 'plus',
      name: 'Plan Plus (Recomendado)',
      description: 'El más vendido: cotizaciones en tiempo real, agendamiento con Google Calendar e integraciones n8n.',
      setupPrice: 3800000,
      recurringPrice: 550000,
      isRecommended: true,
      featuresIncluded: ['Todo lo del Estándar', 'Cotizador dinámico en chat', 'Agendamiento Google Calendar', 'Flujos n8n y webhooks CRM'],
    },
    enterprise: {
      slug: 'enterprise',
      name: 'Plan Enterprise',
      description: 'Solución corporativa multicanal (WhatsApp + Instagram + Web) con RAG vectorial sobre documentos.',
      setupPrice: 6500000,
      recurringPrice: 950000,
      isRecommended: false,
      featuresIncluded: ['Multicanal (WhatsApp + Instagram + Web)', 'Base de datos dedicada', 'RAG vectorial sobre PDFs/catálogos', 'Generador PDF gratis'],
    },
  };
}

/**
 * Actualiza los precios y detalles de un plan en la base de datos de Prisma.
 */
export async function updatePlan(
  slug: string,
  patch: {
    setupPrice?: number;
    recurringPrice?: number;
    description?: string;
    isRecommended?: boolean;
    featuresIncluded?: string[];
  }
): Promise<boolean> {
  try {
    const existing = await prisma.plan.findFirst({ where: { slug } });
    if (existing) {
      await prisma.plan.update({
        where: { id: existing.id },
        data: {
          ...(patch.setupPrice !== undefined ? { setupPrice: patch.setupPrice } : {}),
          ...(patch.recurringPrice !== undefined ? { recurringPrice: patch.recurringPrice } : {}),
          ...(patch.description !== undefined ? { description: patch.description } : {}),
          ...(patch.isRecommended !== undefined ? { isRecommended: patch.isRecommended } : {}),
          ...(patch.featuresIncluded !== undefined ? { featuresIncluded: JSON.stringify(patch.featuresIncluded) } : {}),
        },
      });
      return true;
    }
  } catch (err) {
    console.error('Error actualizando plan en BD:', err);
  }
  return false;
}
