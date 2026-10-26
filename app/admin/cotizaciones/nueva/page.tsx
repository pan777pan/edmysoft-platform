'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  PlusCircle,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  Phone,
  Layers,
  Repeat,
  Loader2,
} from 'lucide-react';
import { formatCOP } from '@/lib/formatters';
import { RecurringCostMode } from '@/lib/types';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  plans: {
    id: string;
    name: string;
    setupPrice: number;
    recurringPrice: number;
  }[];
  modules: {
    id: string;
    name: string;
    setupPrice: number;
    recurringPrice: number;
    defaultRule: string;
  }[];
}

export default function DynamicCalculatorPage() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [depositPercent, setDepositPercent] = useState(30); // 30% predeterminado

  // Custom Items (Camino B)
  const [customItems, setCustomItems] = useState<
    { conceptName: string; setupPrice: number; recurringPrice: number }[]
  >([]);

  // Recurring Costs (3 Modos)
  const [recurringCosts, setRecurringCosts] = useState<
    { provider: string; concept: string; mode: RecurringCostMode; internalCost: number; clientPrice: number }[]
  >([
    {
      provider: 'Meta Cloud API',
      concept: 'Consumo WhatsApp Cloud API',
      mode: 'CLIENT_DIRECT',
      internalCost: 0,
      clientPrice: 150000,
    },
  ]);

  // Live Calculation State
  const [calcResult, setCalcResult] = useState<any>(null);

  // Load Catalog and Contacts
  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, contactsRes] = await Promise.all([
          fetch('/api/catalog').then((r) => r.json()),
          fetch('/api/conversations').then((r) => r.json()),
        ]);

        if (catRes.success) setServices(catRes.services);
        if (contactsRes.success) {
          const cList = contactsRes.conversations.map((c: any) => c.contact);
          setContacts(cList);
          if (cList.length > 0) setSelectedContactId(cList[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Recalculate Live on every change
  useEffect(() => {
    async function updateCalculation() {
      try {
        const res = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: selectedPlanId || undefined,
            selectedModuleIds,
            customItems: customItems.length > 0 ? customItems : undefined,
            discountAmount,
            depositPercentOrFixed: {
              type: 'PERCENT',
              value: depositPercent,
            },
            recurringCosts,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setCalcResult(data.result);
        }
      } catch (e) {
        console.error(e);
      }
    }

    updateCalculation();
  }, [selectedPlanId, selectedModuleIds, customItems, discountAmount, depositPercent, recurringCosts]);

  const activeService = services.find((s) => s.id === selectedServiceId);

  const toggleModule = (modId: string) => {
    setSelectedModuleIds((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  const addCustomItem = () => {
    setCustomItems([
      ...customItems,
      { conceptName: 'Partida Personalizada Adicional', setupPrice: 1500000, recurringPrice: 0 },
    ]);
  };

  const removeCustomItem = (index: number) => {
    setCustomItems(customItems.filter((_, i) => i !== index));
  };

  const addRecurringCost = () => {
    setRecurringCosts([
      ...recurringCosts,
      {
        provider: 'OpenRouter / IA',
        concept: 'Consumo de Tokens IA',
        mode: 'CLIENT_DIRECT',
        internalCost: 0,
        clientPrice: 80000,
      },
    ]);
  };

  const removeRecurringCost = (index: number) => {
    setRecurringCosts(recurringCosts.filter((_, i) => i !== index));
  };

  // Submit and create quote
  const handleSaveQuote = async () => {
    if (!selectedContactId) {
      alert('Por favor selecciona un contacto.');
      return;
    }
    setSaving(true);

    try {
      // Obtener o crear una oportunidad rápida para asociar
      const contactObj = contacts.find((c) => c.id === selectedContactId);
      const opportunityId = contactObj?.opportunities?.[0]?.id;

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedContactId,
          opportunityId: opportunityId || 'opp_default',
          calculationInput: {
            planId: selectedPlanId || undefined,
            selectedModuleIds,
            customItems,
            discountAmount,
            depositPercentOrFixed: { type: 'PERCENT', value: depositPercent },
            recurringCosts,
          },
          notes: 'Cotización generada a través de la Calculadora Dinámica Oficial de EDMYSOFT.',
          commercialTerms: 'Condiciones de pago: Anticipo pactado y saldo contra entrega.',
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin/cotizaciones');
      } else {
        alert(data.error || 'Error al emitir cotización.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">6. Calculadora Dinámica Oficial</h1>
          <p className="text-xs text-slate-400 mt-1">
            Motor financiero determinista: combina paquetes estándar (Camino A), partidas a medida (Camino B) y costes recurrentes clasificados.
          </p>
        </div>

        <button
          onClick={handleSaveQuote}
          disabled={saving || !calcResult}
          className="px-6 py-3 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          Guardar y Emitir Cotización Oficial
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA: CONFIGURADOR DE PARTIDAS (2 COLUMNAS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Seleccionar Contacto */}
          <div className="glass-panel p-6 rounded-2xl border-white/5 bg-slate-900/60 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              1. Cliente / Contacto Destinatario
            </h3>
            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} {c.companyName ? `(${c.companyName})` : ''} — {c.phone || 'Sin tel.'}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Camino A: Paquete de Catálogo */}
          <div className="glass-panel p-6 rounded-2xl border-white/5 bg-slate-900/60 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              2. Camino A: Servicio y Plan de Catálogo (Opcional)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Servicio:</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    setSelectedPlanId('');
                    setSelectedModuleIds([]);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Sin servicio predefinido --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Plan Disponible:</label>
                <select
                  value={selectedPlanId}
                  disabled={!activeService}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white disabled:opacity-30 focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Seleccionar Plan --</option>
                  {activeService?.plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      Plan {p.name} — Setup: {formatCOP(p.setupPrice)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Módulos compatibles del servicio */}
            {activeService && activeService.modules.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                  Módulos adicionales compatibles:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeService.modules.map((mod) => {
                    const isChecked = selectedModuleIds.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center justify-between text-xs ${
                          isChecked
                            ? 'bg-cyan-950/30 border-cyan-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-semibold">{mod.name}</span>
                        <span className="text-cyan-400 font-extrabold">{formatCOP(mod.setupPrice)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Camino B: Partidas Personalizadas a Medida */}
          <div className="glass-panel p-6 rounded-2xl border-white/5 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                3. Camino B: Partidas Personalizadas (Desarrollo a Medida)
              </h3>
              <button
                type="button"
                onClick={addCustomItem}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Agregar Partida
              </button>
            </div>

            {customItems.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No hay partidas personalizadas añadidas. (Útil para proyectos específicos como bots adicionales).
              </p>
            ) : (
              <div className="space-y-3">
                {customItems.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                    <input
                      type="text"
                      value={item.conceptName}
                      onChange={(e) => {
                        const updated = [...customItems];
                        updated[idx].conceptName = e.target.value;
                        setCustomItems(updated);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      placeholder="Concepto de desarrollo"
                    />
                    <div className="w-36">
                      <input
                        type="number"
                        value={item.setupPrice}
                        onChange={(e) => {
                          const updated = [...customItems];
                          updated[idx].setupPrice = parseFloat(e.target.value) || 0;
                          setCustomItems(updated);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-cyan-400 font-bold"
                        placeholder="Setup COP"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomItem(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Costes Recurrentes Clasificados (Los 3 Modos) */}
          <div className="glass-panel p-6 rounded-2xl border-white/5 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-cyan-400" />
                  4. Costes Recurrentes (Clasificación de 3 Modos)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Modo 1: Incluido | Modo 2: Facturado aparte por EDMYSOFT | Modo 3: Pagado directo a terceros
                </span>
              </div>
              <button
                type="button"
                onClick={addRecurringCost}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Agregar Coste
              </button>
            </div>

            <div className="space-y-3">
              {recurringCosts.map((rc, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={rc.provider}
                      onChange={(e) => {
                        const updated = [...recurringCosts];
                        updated[idx].provider = e.target.value;
                        setRecurringCosts(updated);
                      }}
                      className="w-1/3 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      placeholder="Proveedor (ej: Meta Cloud)"
                    />
                    <input
                      type="text"
                      value={rc.concept}
                      onChange={(e) => {
                        const updated = [...recurringCosts];
                        updated[idx].concept = e.target.value;
                        setRecurringCosts(updated);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      placeholder="Concepto del coste"
                    />
                    <button
                      type="button"
                      onClick={() => removeRecurringCost(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Modo:</span>
                      <select
                        value={rc.mode}
                        onChange={(e) => {
                          const updated = [...recurringCosts];
                          updated[idx].mode = e.target.value as RecurringCostMode;
                          setRecurringCosts(updated);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] text-white"
                      >
                        <option value="CLIENT_DIRECT">Modo 3: Tercero Directo (No suma a EDMYSOFT)</option>
                        <option value="BILLED_SEPARATELY">Modo 2: Facturado aparte por EDMYSOFT</option>
                        <option value="INCLUDED">Modo 1: Incluido en mensualidad ($0 al cliente)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Precio cliente:</span>
                      <input
                        type="number"
                        value={rc.clientPrice}
                        disabled={rc.mode === 'INCLUDED'}
                        onChange={(e) => {
                          const updated = [...recurringCosts];
                          updated[idx].clientPrice = parseFloat(e.target.value) || 0;
                          setRecurringCosts(updated);
                        }}
                        className="w-28 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-bold text-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: RESUMEN FINANCIERO EN VIVO */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border-cyan-500/30 bg-[#090d16] shadow-2xl space-y-6 sticky top-6">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 pb-3 border-b border-white/5">
              <Calculator className="w-5 h-5 text-cyan-400" />
              Presupuesto en Tiempo Real
            </h3>

            {calcResult ? (
              <div className="space-y-4 text-xs">
                {/* Desglose de partidas */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Partidas Computadas ({calcResult.items.length})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {calcResult.items.map((it: any, i: number) => (
                      <div key={i} className="flex justify-between py-1 border-b border-white/5 text-[11px]">
                        <span className="text-slate-300">
                          {it.conceptName}
                          {it.isIncludedInPlan && <span className="text-cyan-400 font-bold ml-1">[INCLUIDO]</span>}
                        </span>
                        <span className="font-bold text-white">{formatCOP(it.setupPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotal y Descuentos */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal de Setup:</span>
                    <span className="font-bold text-white">{formatCOP(calcResult.setupSubtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Descuento autorizado:</span>
                    <div className="w-28">
                      <input
                        type="number"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                        placeholder="COP"
                        className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-rose-400 font-bold text-right"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-base font-extrabold pt-2 border-t border-white/10 text-cyan-400">
                    <span>Inversión Setup Total:</span>
                    <span>{formatCOP(calcResult.setupTotal)}</span>
                  </div>
                </div>

                {/* Costes Recurrentes Clasificados */}
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>Mensualidad EDMYSOFT:</span>
                    <span className="font-bold text-white">{formatCOP(calcResult.recurringTotal)} / mes</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Costes de Terceros (Informativo):</span>
                    <span className="font-semibold text-slate-300">{formatCOP(calcResult.clientDirectTotal)}</span>
                  </div>
                </div>

                {/* Anticipo y Saldo */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold">% Anticipo Pactado:</span>
                    <select
                      value={depositPercent}
                      onChange={(e) => setDepositPercent(parseInt(e.target.value))}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="20">20%</option>
                      <option value="30">30% (Estándar)</option>
                      <option value="50">50%</option>
                      <option value="100">100% Contado</option>
                    </select>
                  </div>

                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Anticipo Exigido:</span>
                    <span>{formatCOP(calcResult.depositRequired)}</span>
                  </div>

                  <div className="flex justify-between text-amber-400 font-bold pt-2 border-t border-white/5">
                    <span>Saldo Pendiente:</span>
                    <span>{formatCOP(calcResult.balanceDue)}</span>
                  </div>
                </div>

                {/* Alerta de Aprobación si aplica */}
                {calcResult.requiresApproval && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                    <span className="font-bold block flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Requiere Visto Bueno Humano:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                      {calcResult.approvalReasons.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">Calculando...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
