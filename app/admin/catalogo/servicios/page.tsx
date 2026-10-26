'use client';

import { useState, useEffect } from 'react';
import {
  Layers,
  PlusCircle,
  CheckCircle,
  Edit,
  Trash2,
  ShieldCheck,
  Tag,
  DollarSign,
  Plus,
  X,
  Sparkles,
  ArrowRight,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { formatCOP } from '@/lib/formatters';

interface Plan {
  id: string;
  serviceId: string;
  slug: string;
  name: string;
  description: string | null;
  setupPrice: number;
  recurringPrice: number;
  billingPeriod: string;
  isRecommended: boolean;
  featuresIncluded: string;
  isActive: boolean;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  shortDesc: string | null;
  isActive: boolean;
  plans: Plan[];
}

export default function AdminServicesCatalogPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modales
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceSlug, setServiceSlug] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Inteligencia Artificial');
  const [serviceDesc, setServiceDesc] = useState('');

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planName, setPlanName] = useState('');
  const [planSlug, setPlanSlug] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planSetupPrice, setPlanSetupPrice] = useState<number>(2000000);
  const [planRecurringPrice, setPlanRecurringPrice] = useState<number>(350000);
  const [planIsRecommended, setPlanIsRecommended] = useState(false);
  const [planFeatures, setPlanFeatures] = useState<string[]>(['Atención 24/7']);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/catalog/services');
      const data = await res.json();
      if (data.success) {
        setServices(data.services || []);
      }
    } catch {
      showToast('Error cargando el catálogo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Abrir modal de Servicio (crear o editar)
  const openServiceModal = (srv?: Service) => {
    if (srv) {
      setEditingService(srv);
      setServiceName(srv.name);
      setServiceSlug(srv.slug);
      setServiceCategory(srv.category);
      setServiceDesc(srv.shortDesc || '');
    } else {
      setEditingService(null);
      setServiceName('');
      setServiceSlug('');
      setServiceCategory('Inteligencia Artificial');
      setServiceDesc('');
    }
    setIsServiceModalOpen(true);
  };

  // Guardar Servicio
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingService ? 'PUT' : 'POST';
      const body = {
        actionType: editingService ? 'UPDATE_SERVICE' : 'CREATE_SERVICE',
        id: editingService?.id,
        name: serviceName,
        slug: serviceSlug,
        category: serviceCategory,
        shortDesc: serviceDesc,
      };

      const res = await fetch('/api/catalog/services', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingService ? 'Servicio actualizado con éxito' : 'Nuevo servicio creado con éxito');
        setIsServiceModalOpen(false);
        loadServices();
      } else {
        showToast(data.error || 'Error al guardar servicio');
      }
    } catch {
      showToast('Error de red al guardar servicio');
    } finally {
      setSaving(false);
    }
  };

  // Abrir modal de Plan (crear o editar)
  const openPlanModal = (serviceId: string, plan?: Plan) => {
    setSelectedServiceId(serviceId);
    if (plan) {
      setEditingPlan(plan);
      setPlanName(plan.name);
      setPlanSlug(plan.slug);
      setPlanDesc(plan.description || '');
      setPlanSetupPrice(plan.setupPrice);
      setPlanRecurringPrice(plan.recurringPrice);
      setPlanIsRecommended(plan.isRecommended);
      try {
        setPlanFeatures(JSON.parse(plan.featuresIncluded || '[]'));
      } catch {
        setPlanFeatures([]);
      }
    } else {
      setEditingPlan(null);
      setPlanName('');
      setPlanSlug('');
      setPlanDesc('');
      setPlanSetupPrice(2200000);
      setPlanRecurringPrice(350000);
      setPlanIsRecommended(false);
      setPlanFeatures(['Atención 24/7 en WhatsApp', 'Flujos de n8n integrados']);
    }
    setIsPlanModalOpen(true);
  };

  // Guardar Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) return;
    setSaving(true);
    try {
      const method = editingPlan ? 'PUT' : 'POST';
      const body = {
        actionType: editingPlan ? 'UPDATE_PLAN' : 'CREATE_PLAN',
        id: editingPlan?.id,
        serviceId: selectedServiceId,
        name: planName,
        slug: planSlug,
        description: planDesc,
        setupPrice: planSetupPrice,
        recurringPrice: planRecurringPrice,
        isRecommended: planIsRecommended,
        featuresIncluded: planFeatures,
      };

      const res = await fetch('/api/catalog/services', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingPlan ? 'Plan actualizado con éxito' : 'Nuevo plan agregado con éxito');
        setIsPlanModalOpen(false);
        loadServices();
      } else {
        showToast(data.error || 'Error al guardar plan');
      }
    } catch {
      showToast('Error de red al guardar plan');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar Plan o Servicio
  const handleDelete = async (type: 'SERVICE' | 'PLAN', id: string) => {
    if (!confirm(`¿Estás seguro de eliminar este ${type === 'SERVICE' ? 'servicio completo' : 'plan'}?`)) return;
    try {
      const res = await fetch(`/api/catalog/services?type=${type}&id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`${type === 'SERVICE' ? 'Servicio' : 'Plan'} eliminado correctamente`);
        loadServices();
      } else {
        showToast(data.error || 'Error al eliminar');
      }
    } catch {
      showToast('Error de red al eliminar');
    }
  };

  const addFeature = () => {
    if (!newFeatureText.trim()) return;
    setPlanFeatures([...planFeatures, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const removeFeature = (idx: number) => {
    setPlanFeatures(planFeatures.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl glass-panel bg-slate-900/95 border border-cyan-500/30 text-cyan-200 text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Servicios y Planes Oficiales
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Gestor Visual CRUD
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Administra el catálogo de servicios, crea nuevos paquetes y modifica precios de Setup y Mensualidad que alimentan la web y la IA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadServices}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 transition"
            title="Refrescar catálogo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => openServiceModal()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {/* Lista de Servicios */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span>Cargando catálogo oficial desde base de datos...</span>
        </div>
      ) : services.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel bg-slate-900/60 border border-white/10 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No hay servicios registrados en la base de datos</h3>
          <p className="text-xs text-slate-400">Crea el primer servicio oficial de EDMYSOFT.</p>
          <button
            onClick={() => openServiceModal()}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
          >
            + Crear Primer Servicio
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {services.map((service) => (
            <div key={service.id} className="glass-panel p-6 rounded-3xl border border-white/10 bg-slate-900/60 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {service.category}
                    </span>
                    <h3 className="text-xl font-bold text-white">{service.name}</h3>
                    <span className="text-xs text-slate-500 font-mono">/{service.slug}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{service.shortDesc}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPlanModal(service.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Plan</span>
                  </button>
                  <button
                    onClick={() => openServiceModal(service)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition"
                    title="Editar servicio"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete('SERVICE', service.id)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                    title="Eliminar servicio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Planes configurados para este servicio */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Planes Comerciales Configurados ({service.plans?.length || 0})
                  </span>
                </div>

                {service.plans?.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-center text-xs text-slate-500">
                    Aún no hay planes configurados para este servicio.{' '}
                    <button
                      onClick={() => openPlanModal(service.id)}
                      className="text-cyan-400 font-bold hover:underline"
                    >
                      + Crear primer plan
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {service.plans.map((plan) => {
                      let features: string[] = [];
                      try {
                        features = JSON.parse(plan.featuresIncluded || '[]');
                      } catch {
                        features = [];
                      }

                      return (
                        <div
                          key={plan.id}
                          className={`p-5 rounded-2xl bg-slate-950 border transition-all space-y-3.5 relative flex flex-col justify-between ${
                            plan.isRecommended
                              ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                              : 'border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                {plan.isRecommended && (
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-cyan-500 text-slate-950 mb-1.5 uppercase">
                                    ★ Más Vendido / Recomendado
                                  </span>
                                )}
                                <h4 className="font-extrabold text-white text-base">{plan.name}</h4>
                                <span className="text-[10px] font-mono text-cyan-400">slug: {plan.slug}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openPlanModal(service.id, plan)}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10"
                                  title="Editar plan"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDelete('PLAN', plan.id)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                  title="Eliminar plan"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                              {plan.description || 'Sin descripción'}
                            </p>

                            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Setup Inicial:</span>
                                <span className="font-extrabold text-white">{formatCOP(plan.setupPrice)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Mensualidad:</span>
                                <span className="font-extrabold text-cyan-400">
                                  {formatCOP(plan.recurringPrice)}
                                  <span className="text-[10px] text-slate-500 font-normal">/mes</span>
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                                Incluye ({features.length} puntos):
                              </span>
                              <ul className="space-y-1 text-xs text-slate-300">
                                {features.slice(0, 4).map((f, i) => (
                                  <li key={i} className="flex items-center gap-1.5">
                                    <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                                    <span className="truncate">{f}</span>
                                  </li>
                                ))}
                                {features.length > 4 && (
                                  <li className="text-[10px] text-slate-500 pl-4.5">
                                    + {features.length - 4} ítems adicionales...
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              Vigente en IA & Web
                            </span>
                            <button
                              type="button"
                              onClick={() => openPlanModal(service.id, plan)}
                              className="text-cyan-400 hover:underline font-semibold"
                            >
                              Modificar Precios →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: CREAR / EDITAR SERVICIO */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full bg-[#0d1424] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>{editingService ? 'Editar Servicio' : 'Crear Nuevo Servicio'}</span>
              </h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => {
                    setServiceName(e.target.value);
                    if (!editingService) {
                      setServiceSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, '')
                      );
                    }
                  }}
                  placeholder="Ej: Agente de IA para WhatsApp"
                  className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Slug (Identificador)</label>
                  <input
                    type="text"
                    required
                    value={serviceSlug}
                    onChange={(e) => setServiceSlug(e.target.value)}
                    placeholder="agente-ia-whatsapp"
                    className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white font-mono outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Categoría</label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="Inteligencia Artificial">Inteligencia Artificial</option>
                    <option value="Software a Medida">Software a Medida</option>
                    <option value="Automatización n8n">Automatización n8n</option>
                    <option value="Desarrollo Web">Desarrollo Web</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Descripción Corta</label>
                <textarea
                  rows={2}
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Breve resumen del servicio para los clientes..."
                  className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editingService ? 'Actualizar' : 'Crear Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREAR / EDITAR PLAN */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel max-w-lg w-full bg-[#0d1424] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>{editingPlan ? `Editar Plan: ${editingPlan.name}` : 'Crear Nuevo Plan Tarifario'}</span>
              </h3>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Nombre del Plan *</label>
                  <input
                    type="text"
                    required
                    value={planName}
                    onChange={(e) => {
                      setPlanName(e.target.value);
                      if (!editingPlan) {
                        setPlanSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, '')
                        );
                      }
                    }}
                    placeholder="Ej. Plan Pro Avanzado"
                    className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Slug (Identificador)</label>
                  <input
                    type="text"
                    required
                    value={planSlug}
                    onChange={(e) => setPlanSlug(e.target.value)}
                    placeholder="pro-avanzado"
                    className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white font-mono outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Descripción del Alcance</label>
                <textarea
                  rows={2}
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  placeholder="A quién va dirigido y en qué tiempo se entrega..."
                  className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-white/5">
                <div>
                  <label className="text-slate-200 block mb-1 font-bold flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                    Setup Inicial (COP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={planSetupPrice}
                    onChange={(e) => setPlanSetupPrice(Number(e.target.value))}
                    step={50000}
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-3.5 py-2 text-white font-bold text-sm outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Formato: {formatCOP(planSetupPrice)}
                  </span>
                </div>
                <div>
                  <label className="text-slate-200 block mb-1 font-bold flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                    Mensualidad (COP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={planRecurringPrice}
                    onChange={(e) => setPlanRecurringPrice(Number(e.target.value))}
                    step={10000}
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-3.5 py-2 text-white font-bold text-sm outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Formato: {formatCOP(planRecurringPrice)}/mes
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <input
                  type="checkbox"
                  id="chk-rec"
                  checked={planIsRecommended}
                  onChange={(e) => setPlanIsRecommended(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500"
                />
                <label htmlFor="chk-rec" className="text-xs text-cyan-300 font-semibold cursor-pointer">
                  Marcar este plan como «Más Vendido / Recomendado»
                </label>
              </div>

              {/* Editor de Viñetas / Inclusiones */}
              <div className="space-y-2">
                <label className="text-slate-300 font-semibold block">
                  Puntos o Funcionalidades Incluidas ({planFeatures.length})
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                    placeholder="Ej: Base de conocimiento vectorial hasta 50 preguntas"
                    className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    + Agregar
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                  {planFeatures.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-white/5 text-slate-300 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
