import fs from 'fs';
import path from 'path';

export interface KnowledgeFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface BusinessPolicy {
  id: string;
  title: string;
  rule: string;
  severity: 'OBLIGATORIA' | 'FLEXIBLE';
}

export interface ConversationGuideline {
  id: string;
  title: string;
  instruction: string;
}

export interface BusinessKnowledgeData {
  companyName: string;
  technicalLead: string;
  partnerBacking: string;
  corePitch: string;
  guidelines: ConversationGuideline[];
  policies: BusinessPolicy[];
  faqs: KnowledgeFAQ[];
  extraFreeformNotes: string;
  updatedAt: string;
}

const CONFIG_DIR = path.join(process.cwd(), '.edmysoft');
const KNOWLEDGE_FILE = path.join(CONFIG_DIR, 'business-knowledge.json');

export const DEFAULT_BUSINESS_KNOWLEDGE: BusinessKnowledgeData = {
  companyName: 'EDMYSOFT',
  technicalLead: 'Edier Mery Gallego (CEO, Director Técnico y Arquitecto de Software)',
  partnerBacking: 'EDMYSOFT — infraestructura propia de alta disponibilidad y célula de desarrollo especializada.',
  corePitch: 'Empresa colombiana especializada en agentes de inteligencia artificial para ventas, automatización de procesos empresariales y desarrollo de software a medida.',
  guidelines: [
    {
      id: 'g-1',
      title: 'Calificación Comercial Progresiva',
      instruction: 'No abrumar al prospecto con cuestionarios largos. Hacer preguntas cortas orientadas a identificar el canal principal, volumen diario de clientes y presupuesto orientativo.',
    },
    {
      id: 'g-2',
      title: 'Consulta Obligatoria de Tarifas Oficiales',
      instruction: 'Toda cotización se realiza basándose en el catálogo oficial de EDMYSOFT. Jamás inventar precios sin respaldo.',
    },
    {
      id: 'g-3',
      title: 'Escalamiento a Asesor Humano',
      instruction: 'Ante solicitudes de alcance complejo, requerimientos fuera de catálogo o si el cliente insiste en hablar con una persona, invitarlo a agendar sesión con Edier Mery Gallego o transferir a WhatsApp.',
    },
  ],
  policies: [
    {
      id: 'p-1',
      title: 'Descuentos Autónomos Máximos',
      rule: 'El bot solo puede conceder hasta un 10% de descuento en el setup inicial del Plan Plus como concesión de cierre en la misma semana.',
      severity: 'OBLIGATORIA',
    },
    {
      id: 'p-2',
      title: 'Modalidad de Pago y Anticipos',
      rule: 'Todo proyecto se inicia con un 50% de anticipo para arranque de desarrollo y el 50% restante contra entrega a satisfacción.',
      severity: 'OBLIGATORIA',
    },
    {
      id: 'p-3',
      title: 'Plazos de Entrega Garantizados',
      rule: 'Los plazos de entrega estándar son de 7 a 15 días hábiles a partir de la confirmación del anticipo y entrega de accesos.',
      severity: 'FLEXIBLE',
    },
  ],
  faqs: [
    {
      id: 'faq-1',
      question: '¿Qué es EDMYSOFT y quién lidera el equipo?',
      answer: 'EDMYSOFT es una empresa tecnológica colombiana líder en inteligencia artificial y automatización de ventas. El equipo es liderado por Edier Mery Gallego (CEO y Arquitecto de Software) con infraestructura de alta disponibilidad y soporte de ingeniería de EDMYSOFT.',
      category: 'Empresa',
    },
    {
      id: 'faq-2',
      question: '¿El bot funciona con mi propio número de WhatsApp?',
      answer: 'Sí, conectamos tu número actual de WhatsApp personal o Business mediante código QR en segundos, o a través de la API oficial de Meta Cloud con número verificado.',
      category: 'WhatsApp',
    },
    {
      id: 'faq-3',
      question: '¿Se puede conectar con mi Google Calendar?',
      answer: 'Totalmente. El bot verifica disponibilidad en tiempo real y permite a los clientes agendar citas virtuales por Google Meet o presenciales.',
      category: 'Agendamiento',
    },
    {
      id: 'faq-4',
      question: '¿Qué formas de pago reciben en Colombia?',
      answer: 'Aceptamos transferencias bancarias a Bancolombia, Nequi, Daviplata, pasarela Wompi (tarjetas de crédito/débito) y PSE.',
      category: 'Pagos',
    },
  ],
  extraFreeformNotes: 'En caso de que el cliente pregunte por casos de éxito, mencionar clínicas médicas que redujeron su tiempo de atención en un 78%, empresas de logística con más de 180 vehículos monitoreados y procesos de facturación optimizados de 40 horas a 15 minutos mensuales.',
  updatedAt: new Date().toISOString(),
};

export function loadBusinessKnowledge(): BusinessKnowledgeData {
  try {
    if (fs.existsSync(KNOWLEDGE_FILE)) {
      const raw = fs.readFileSync(KNOWLEDGE_FILE, 'utf-8');
      return { ...DEFAULT_BUSINESS_KNOWLEDGE, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Error leyendo business-knowledge.json, usando defaults:', err);
  }
  return DEFAULT_BUSINESS_KNOWLEDGE;
}

export function saveBusinessKnowledge(data: Partial<BusinessKnowledgeData>): BusinessKnowledgeData {
  const current = loadBusinessKnowledge();
  const next: BusinessKnowledgeData = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

/**
 * Convierte la base de conocimiento en un bloque de texto formateado para el System Prompt del bot
 */
export function formatKnowledgeForPrompt(k: BusinessKnowledgeData): string {
  const lines: string[] = [];

  lines.push(`\n### BASE DE CONOCIMIENTO Y REGLAS OFICIALES DEL NEGOCIO (EDMYSOFT):`);
  lines.push(`- Empresa: ${k.companyName}`);
  lines.push(`- Director Técnico: ${k.technicalLead}`);
  lines.push(`- Respaldo de Infraestructura: ${k.partnerBacking}`);
  lines.push(`- Propósito: ${k.corePitch}`);

  if (k.guidelines?.length > 0) {
    lines.push(`\n**DIRECTRICES DE CONVERSACIÓN DE LA IA:**`);
    k.guidelines.forEach((g) => {
      lines.push(`• *${g.title}:* ${g.instruction}`);
    });
  }

  if (k.policies?.length > 0) {
    lines.push(`\n**POLÍTICAS Y LÍMITES COMERCIALES INMUTABLES:**`);
    k.policies.forEach((p) => {
      lines.push(`• [${p.severity}] *${p.title}:* ${p.rule}`);
    });
  }

  if (k.faqs?.length > 0) {
    lines.push(`\n**PREGUNTAS FRECUENTES ENTRENADAS (RESPUESTAS OFICIALES):**`);
    k.faqs.forEach((f) => {
      lines.push(`Q: ${f.question}\nA: ${f.answer}`);
    });
  }

  if (k.extraFreeformNotes?.trim()) {
    lines.push(`\n**NOTAS ADICIONALES DE CONOCIMIENTO TÉCNICO & COMERCIAL:**`);
    lines.push(k.extraFreeformNotes.trim());
  }

  return lines.join('\n');
}
