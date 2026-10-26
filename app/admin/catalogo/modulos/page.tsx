'use client';

import { useState, useEffect } from 'react';
import {
  Puzzle,
  PlusCircle,
  CheckCircle,
  Edit,
  Trash2,
  ShieldCheck,
  DollarSign,
  X,
  RefreshCw,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Code,
  Tag,
} from 'lucide-react';
import { formatCOP } from '@/lib/formatters';

interface Module {
  id: string;
  name: string;
  code: string;
  description: string;
  setupPrice: number;
  recurringPrice: number;
  billingPeriod: string;
  defaultRule: string;
  isTechnicalReady: boolean;
  isActive: boolean;
  serviceId?: string | null;
  service?: {
    id: string;
    name: string;
  } | null;
}

export default function AdminModulesCatalogPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal de Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [modName, setModName] = useState('');
  const [modCode, setModCode] = useState('');
  const [modDesc, setModDesc] = useState('');
  const [modSetupPrice, setModSetupPrice] = useState<number>(500000);
  const [modRecurringPrice, setModRecurringPrice] = useState<number>(100000);
  const [modDefaultRule, setModDefaultRule] = useState('OPTIONAL');
  const [modIsTechnicalReady, setModIsTechnicalReady] = useState(true);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadModules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/catalog/modules');
      const data = await res.json();
      if (data.success) {
        setModules(data.modules || []);
      }
    } catch {
      showToast('Error cargando módulos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const openModal = (mod?: Module) => {
    if (mod) {
      setEditingModule(mod);
      setModName(mod.name);
      setModCode(mod.code);
      setModDesc(mod.description);
      setModSetupPrice(mod.setupPrice);
      setModRecurringPrice(mod.recurringPrice);
      setModDefaultRule(mod.defaultRule);
      setModIsTechnicalReady(mod.isTechnicalReady);
    } else {
      setEditingModule(null);
      setModName('');
      setModCode('MOD_');
      setModDesc('');
      setModSetupPrice(500000);
      setModRecurringPrice(100000);
      setModDefaultRule('OPTIONAL');
      setModIsTechnicalReady(true);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingModule ? 'PUT' : 'POST';
      const body = {
        id: editingModule?.id,
        name: modName,
        code: modCode,
        description: modDesc,
        setupPrice: modSetupPrice,
        recurringPrice: modRecurringPrice,
        defaultRule: modDefaultRule,
        isTechnicalReady: modIsTechnicalReady,
      };

      const res = await fetch('/api/catalog/modules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingModule ? 'Módulo actualizado correctamente' : 'Nuevo módulo creado con éxito');
        setIsModalOpen(false);
        loadModules();
      } else {
        showToast(data.error || 'Error al guardar módulo');
      }
    } catch {
      showToast('Error de red al guardar módulo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este módulo del catálogo?')) return;
    try {
      const res = await fetch(`/api/catalog/modules?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Módulo eliminado del catálogo');
        loadModules();
      } else {
        showToast(data.error || 'Error al eliminar');
      }
    } catch {
      showToast('Error de red al eliminar');
    }
  };

  const toggleTechnicalReady = async (mod: Module) => {
    const nextState = !mod.isTechnicalReady;
    try {
      const res = await fetch('/api/catalog/modules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: mod.id,
          isTechnicalReady: nextState,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModules(modules.map((m) => (m.id === mod.id ? { ...m, isTechnicalReady: nextState } : m)));
        showToast(`Módulo marcado como: ${nextState ? 'Listo Técnicamente' : 'Solo Comercial'}`);
      }
    } catch {
      showToast('Error al actualizar estado técnico');
    }
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
              Módulos y Funcionalidades Adicionales
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Add-ons & Componentes
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de componentes add-on, reglas de inclusión por plan, tarifas de instalación y recurrencia mensual.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadModules}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 transition"
            title="Refrescar módulos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => openModal()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear Nuevo Módulo / Add-on</span>
          </button>
        </div>
      </div>

      {/* Grid de Módulos */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Cargando módulos configurados...</span>
        </div>
      ) : modules.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel bg-slate-900/60 border border-white/10 text-center space-y-3">
          <Puzzle className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No hay módulos registrados en el catálogo</h3>
          <p className="text-xs text-slate-400">Crea el primer módulo adicional o add-on.</p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
          >
            + Crear Primer Módulo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/60 space-y-4 flex flex-col justify-between hover:border-indigo-500/30 transition-all shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/20">
                    {mod.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleTechnicalReady(mod)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
                        mod.isTechnicalReady
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                      title="Haz clic para alternar entre Listo Técnicamente o Solo Comercial"
                    >
                      {mod.isTechnicalReady ? '✓ Listo Técnicamente' : '⚠ Solo Comercial'}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{mod.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed min-h-[36px]">
                    {mod.description || 'Sin descripción'}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-500">Regla por defecto:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-white/5">
                    {mod.defaultRule === 'INCLUDED' ? 'Incluido' : mod.defaultRule === 'REQUIRED' ? 'Obligatorio' : 'Opcional Add-on'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Setup Implementación:</span>
                    <span className="font-extrabold text-white">{formatCOP(mod.setupPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Recurrencia Mensual:</span>
                    <span className="font-extrabold text-cyan-400">{formatCOP(mod.recurringPrice)}/mes</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    onClick={() => openModal(mod)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 font-semibold flex items-center gap-1.5 transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Modificar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(mod.id)}
                    className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                    title="Eliminar módulo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREAR / EDITAR MÓDULO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full bg-[#0d1424] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-indigo-400" />
                <span>{editingModule ? `Editar: ${editingModule.name}` : 'Crear Nuevo Módulo / Add-on'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Nombre del Módulo *</label>
                <input
                  type="text"
                  required
                  value={modName}
                  onChange={(e) => {
                    setModName(e.target.value);
                    if (!editingModule) {
                      setModCode(
                        'MOD_' +
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]+/g, '_')
                            .replace(/^_+|_+$/g, '')
                      );
                    }
                  }}
                  placeholder="Ej: Integración con Pasarela de Pagos Wompi"
                  className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Código Técnico *</label>
                  <input
                    type="text"
                    required
                    value={modCode}
                    onChange={(e) => setModCode(e.target.value.toUpperCase())}
                    placeholder="MOD_PAYMENTS"
                    className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white font-mono outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Regla por Defecto</label>
                  <select
                    value={modDefaultRule}
                    onChange={(e) => setModDefaultRule(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-indigo-400"
                  >
                    <option value="OPTIONAL">Opcional (Add-on)</option>
                    <option value="INCLUDED">Incluido</option>
                    <option value="REQUIRED">Obligatorio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Descripción Técnica y Funcional</label>
                <textarea
                  rows={2}
                  value={modDesc}
                  onChange={(e) => setModDesc(e.target.value)}
                  placeholder="Qué soluciona este módulo y qué incluye técnicamente..."
                  className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-900/90 border border-white/5">
                <div>
                  <label className="text-slate-200 block mb-1 font-bold">Setup (COP)</label>
                  <input
                    type="number"
                    required
                    value={modSetupPrice}
                    onChange={(e) => setModSetupPrice(Number(e.target.value))}
                    step={50000}
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-3.5 py-2 text-white font-bold outline-none focus:border-indigo-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {formatCOP(modSetupPrice)}
                  </span>
                </div>
                <div>
                  <label className="text-slate-200 block mb-1 font-bold">Mensual (COP)</label>
                  <input
                    type="number"
                    required
                    value={modRecurringPrice}
                    onChange={(e) => setModRecurringPrice(Number(e.target.value))}
                    step={10000}
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-3.5 py-2 text-white font-bold outline-none focus:border-indigo-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {formatCOP(modRecurringPrice)}/mes
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <input
                  type="checkbox"
                  id="chk-tech"
                  checked={modIsTechnicalReady}
                  onChange={(e) => setModIsTechnicalReady(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-500"
                />
                <label htmlFor="chk-tech" className="text-xs text-indigo-200 font-semibold cursor-pointer">
                  Módulo Listo Técnicamente (disponible para entrega inmediata)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editingModule ? 'Guardar Cambios' : 'Crear Módulo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
