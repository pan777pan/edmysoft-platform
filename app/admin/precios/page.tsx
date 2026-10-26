'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  Save,
  CheckCircle2,
  Sparkles,
  Layers,
  ShieldCheck,
  TrendingUp,
  Percent,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface PlanState {
  slug: string;
  name: string;
  description: string;
  setupPrice: number;
  recurringPrice: number;
  isRecommended: boolean;
  featuresIncluded: string[];
}

interface NegotiationState {
  maxDiscountPercent: number;
  allowTwoInstallments: boolean;
  minSetupFloorCOP: {
    estandar: number;
    plus: number;
    enterprise: number;
  };
}

export default function AdminPreciosPage() {
  const [plans, setPlans] = useState<Record<string, PlanState>>({});
  const [negotiation, setNegotiation] = useState<NegotiationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pricing');
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans || {});
        setNegotiation(data.negotiation || null);
      } else {
        setError(data.error || 'No se pudo cargar la información de precios.');
      }
    } catch {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handlePriceChange = (slug: string, field: 'setupPrice' | 'recurringPrice', value: number) => {
    setPlans((prev) => ({
      ...prev,
      [slug]: {
        ...prev[slug],
        [field]: Math.max(0, value),
      },
    }));
  };

  const handleDescChange = (slug: string, value: string) => {
    setPlans((prev) => ({
      ...prev,
      [slug]: {
        ...prev[slug],
        description: value,
      },
    }));
  };

  const handleFeatureAdd = (slug: string) => {
    setPlans((prev) => ({
      ...prev,
      [slug]: {
        ...prev[slug],
        featuresIncluded: [...(prev[slug]?.featuresIncluded || []), 'Nueva característica'],
      },
    }));
  };

  const handleFeatureChange = (slug: string, index: number, value: string) => {
    setPlans((prev) => {
      const updatedFeatures = [...(prev[slug]?.featuresIncluded || [])];
      updatedFeatures[index] = value;
      return {
        ...prev,
        [slug]: {
          ...prev[slug],
          featuresIncluded: updatedFeatures,
        },
      };
    });
  };

  const handleFeatureDelete = (slug: string, index: number) => {
    setPlans((prev) => {
      const updatedFeatures = (prev[slug]?.featuresIncluded || []).filter((_, i) => i !== index);
      return {
        ...prev,
        [slug]: {
          ...prev[slug],
          featuresIncluded: updatedFeatures,
        },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    setError(null);
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plans,
          negotiation,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      } else {
        setError(data.error || 'Error al guardar los precios.');
      }
    } catch {
      setError('No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh] text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="text-sm">Cargando catálogo de precios en tiempo real...</span>
      </div>
    );
  }

  const formatCOP = (num: number) => '$' + (num || 0).toLocaleString('es-CO') + ' COP';

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-emerald-400" /> Gestor Oficial de Precios y Regateo
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Modifica las tarifas oficiales de EDMYSOFT. Todos los cambios se aplican de inmediato en la página web pública,
            en el cotizador dinámico y en las respuestas del Agente de IA (WhatsApp y Web).
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Cambios de Tarifas
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>¡Precios y reglas de regateo actualizados exitosamente! La web y el bot ya están utilizando estas tarifas.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PLANES GRID */}
      <div className="grid lg:grid-cols-3 gap-6">
        {Object.entries(plans).map(([slug, plan]) => {
          const isPlus = slug === 'plus' || plan.isRecommended;
          return (
            <div
              key={slug}
              className={`rounded-2xl border p-5 flex flex-col justify-between space-y-5 bg-[#0b1018] relative transition ${
                isPlus ? 'border-cyan-500/40 shadow-xl shadow-cyan-500/5 ring-1 ring-cyan-500/20' : 'border-white/10'
              }`}
            >
              {isPlus && (
                <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-[11px] font-bold text-slate-950 uppercase tracking-wide">
                  ⭐ Más Vendido
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className={`w-5 h-5 ${isPlus ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <h2 className="text-lg font-bold text-white">{plan.name}</h2>
                </div>

                <textarea
                  value={plan.description}
                  onChange={(e) => handleDescChange(slug, e.target.value)}
                  rows={2}
                  className="w-full text-xs text-slate-300 bg-slate-950/60 border border-white/10 rounded-lg p-2.5 focus:border-cyan-500/50 outline-none resize-none"
                  placeholder="Descripción comercial del plan..."
                />

                {/* SETUP PRICE */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Inversión Inicial (Setup COP):</span>
                    <span className="text-emerald-400 font-mono text-[11px]">{formatCOP(plan.setupPrice)}</span>
                  </label>
                  <input
                    type="number"
                    step={50000}
                    value={plan.setupPrice}
                    onChange={(e) => handlePriceChange(slug, 'setupPrice', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* RECURRING PRICE */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Mensualidad (Soporte COP):</span>
                    <span className="text-cyan-400 font-mono text-[11px]">{formatCOP(plan.recurringPrice)}/mes</span>
                  </label>
                  <input
                    type="number"
                    step={25000}
                    value={plan.recurringPrice}
                    onChange={(e) => handlePriceChange(slug, 'recurringPrice', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 outline-none"
                  />
                </div>

                {/* CARACTERÍSTICAS / INCLUSIONES */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Características incluidas:</span>
                    <button
                      type="button"
                      onClick={() => handleFeatureAdd(slug)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Añadir
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {plan.featuresIncluded?.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => handleFeatureChange(slug, idx, e.target.value)}
                          className="flex-1 text-xs bg-slate-950/80 border border-white/10 rounded px-2 py-1 text-slate-200 outline-none focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleFeatureDelete(slug, idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Eliminar viñeta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Identificador técnico:</span>
                <code className="text-slate-300 font-mono bg-white/5 px-2 py-0.5 rounded">{slug}</code>
              </div>
            </div>
          );
        })}
      </div>

      {/* REGLAS DE REGATEO Y NEGOCIACIÓN COMERCIAL */}
      {negotiation && (
        <section className="rounded-2xl border border-white/10 bg-[#0b1018] p-6 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-400" /> Reglas de Regateo Comercial para la IA
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Define cómo debe negociar el Agente de IA cuando un prospecto pide rebaja o dice que es costoso. El bot
                siempre intentará cerrar al precio oficial, pero podrá utilizar estas concesiones estratégicas si detecta
                riesgo de perder la venta.
              </p>
            </div>
            <span className="text-[11px] px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
              Estrategia SPIN + Negociación
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* DESCUENTO MÁXIMO AUTORIZADO */}
            <div className="p-4 rounded-xl border border-white/10 bg-slate-950/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">Descuento Máximo por Cierre Rápido</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  {negotiation.maxDiscountPercent}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={25}
                step={1}
                value={negotiation.maxDiscountPercent}
                onChange={(e) =>
                  setNegotiation((prev) => prev ? { ...prev, maxDiscountPercent: Number(e.target.value) } : null)
                }
                className="w-full accent-amber-400 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Si el cliente regatea, el bot puede proponer hasta un {negotiation.maxDiscountPercent}% de descuento en el setup
                únicamente si confirma el inicio de proyecto esta misma semana.
              </p>
            </div>

            {/* FACILIDADES DE PAGO EN 2 CUOTAS */}
            <div className="p-4 rounded-xl border border-white/10 bg-slate-950/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">Ofrecer Pago en 2 Cuotas</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={negotiation.allowTwoInstallments}
                    onChange={(e) =>
                      setNegotiation((prev) => prev ? { ...prev, allowTwoInstallments: e.target.checked } : null)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <p className="text-[11px] text-slate-400">
                Cuando el cliente argumente falta de liquidez, el bot propondrá formalmente el esquema 50% de anticipo para
                inicio de desarrollo y 50% contra entrega a satisfacción, facilitando el cierre de la venta.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ACCIÓN INFERIOR */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Todas las Tarifas
        </button>
      </div>
    </div>
  );
}
