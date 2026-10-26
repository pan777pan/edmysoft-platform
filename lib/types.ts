export type ServiceCategory =
  | 'IA'
  | 'CHATBOTS'
  | 'AUTOMATIZACION'
  | 'DESARROLLO_WEB'
  | 'SOFTWARE_A_MEDIDA'
  | 'CRM'
  | 'MANTENIMIENTO';

export type BillingPeriod = 'ONE_TIME' | 'MONTHLY' | 'ANNUAL' | 'PER_UNIT' | 'PER_HOUR';

export type ModuleRule = 'INCLUDED' | 'OPTIONAL' | 'REQUIRED' | 'INCOMPATIBLE';

export type RecurringCostMode = 'INCLUDED' | 'BILLED_SEPARATELY' | 'CLIENT_DIRECT';

export type OpportunityStage =
  | 'NUEVO'
  | 'EN_DIAGNOSTICO'
  | 'CALIFICADO'
  | 'COTIZACION_EN_PREPARACION'
  | 'PENDIENTE_APROBACION'
  | 'ENVIADA'
  | 'GANADA'
  | 'PERDIDA';

export type QuoteStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export type ConversationStatus = 'AI_HANDLING' | 'HUMAN_CONTROL' | 'CLOSED';

export interface RecurringCostItem {
  provider: string;
  concept: string;
  mode: RecurringCostMode;
  internalCost: number;
  clientPrice: number;
  estimatedVolume?: string;
  consumptionAlertThreshold?: number;
  notes?: string;
}

export interface QuoteCalculationInput {
  planId?: string;
  selectedModuleIds?: string[];
  customItems?: {
    conceptName: string;
    description?: string;
    setupPrice: number;
    recurringPrice?: number;
  }[];
  discountAmount?: number;
  depositPercentOrFixed?: {
    type: 'PERCENT' | 'FIXED';
    value: number;
  };
  recurringCosts?: RecurringCostItem[];
}

export interface QuoteCalculationResult {
  setupSubtotal: number;
  setupDiscount: number;
  setupTotal: number;
  recurringTotal: number; // Facturado por EDMYSOFT
  clientDirectTotal: number; // Costos informativos a terceros
  internalEstimatedCost: number; // Costo interno de EDMYSOFT
  depositRequired: number;
  balanceDue: number;
  items: {
    conceptName: string;
    description?: string;
    setupPrice: number;
    recurringPrice: number;
    isIncludedInPlan: boolean;
    quantity: number;
  }[];
  recurringCosts: RecurringCostItem[];
  requiresApproval: boolean;
  approvalReasons: string[];
}
