'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  ShieldCheck,
  HelpCircle,
  Bot,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Award,
  Sliders,
  FileText,
  X,
} from 'lucide-react';

interface KnowledgeFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface BusinessPolicy {
  id: string;
  title: string;
  rule: string;
  severity: 'OBLIGATORIA' | 'FLEXIBLE';
}

interface ConversationGuideline {
  id: string;
  title: string;
  instruction: string;
}

interface BusinessKnowledgeData {
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

export default function BusinessKnowledgePage() {
  const [knowledge, setKnowledge] = useState<BusinessKnowledgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'FAQS' | 'POLICIES' | 'GUIDELINES' | 'CREDENTIALS'>('FAQS');

  // Modales
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<KnowledgeFAQ | null>(null);
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');
  const [faqCat, setFaqCat] = useState('General');

  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<BusinessPolicy | null>(null);
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyRule, setPolicyRule] = useState('');
  const [policySeverity, setPolicySeverity] = useState<'OBLIGATORIA' | 'FLEXIBLE'>('OBLIGATORIA');

  const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState<ConversationGuideline | null>(null);
  const [guideTitle, setGuideTitle] = useState('');
  const [guideInstruction, setGuideInstruction] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadKnowledge = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/knowledge');
      const data = await res.json();
      if (data.success && data.knowledge) {
        setKnowledge(data.knowledge);
      }
    } catch {
      showToast('Error cargando la base de conocimiento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledge();
  }, []);

  // Guardar estado completo
  const persistKnowledge = async (updated: BusinessKnowledgeData) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setKnowledge(data.knowledge);
        showToast('✓ Cerebro del Bot actualizado: la IA ha incorporado los nuevos datos.');
      } else {
        showToast(data.error || 'Error al guardar');
      }
    } catch {
      showToast('Error de red al guardar base de conocimiento');
    } finally {
      setSaving(false);
    }
  };

  // FAQs Handlers
  const openFaqModal = (faq?: KnowledgeFAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqQ(faq.question);
      setFaqA(faq.answer);
      setFaqCat(faq.category);
    } else {
      setEditingFaq(null);
      setFaqQ('');
      setFaqA('');
      setFaqCat('Comercial');
    }
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!knowledge) return;

    let updatedFaqs: KnowledgeFAQ[];
    if (editingFaq) {
      updatedFaqs = knowledge.faqs.map((f) =>
        f.id === editingFaq.id ? { ...f, question: faqQ, answer: faqA, category: faqCat } : f
      );
    } else {
      const newFaq: KnowledgeFAQ = {
        id: `faq-${Date.now()}`,
        question: faqQ,
        answer: faqA,
        category: faqCat,
      };
      updatedFaqs = [...knowledge.faqs, newFaq];
    }

    const next = { ...knowledge, faqs: updatedFaqs };
    setIsFaqModalOpen(false);
    persistKnowledge(next);
  };

  const handleDeleteFaq = (id: string) => {
    if (!knowledge || !confirm('¿Eliminar esta pregunta frecuente?')) return;
    const next = { ...knowledge, faqs: knowledge.faqs.filter((f) => f.id !== id) };
    persistKnowledge(next);
  };

  // Policies Handlers
  const openPolicyModal = (pol?: BusinessPolicy) => {
    if (pol) {
      setEditingPolicy(pol);
      setPolicyTitle(pol.title);
      setPolicyRule(pol.rule);
      setPolicySeverity(pol.severity);
    } else {
      setEditingPolicy(null);
      setPolicyTitle('');
      setPolicyRule('');
      setPolicySeverity('OBLIGATORIA');
    }
    setIsPolicyModalOpen(true);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!knowledge) return;

    let updated: BusinessPolicy[];
    if (editingPolicy) {
      updated = knowledge.policies.map((p) =>
        p.id === editingPolicy.id ? { ...p, title: policyTitle, rule: policyRule, severity: policySeverity } : p
      );
    } else {
      const newPol: BusinessPolicy = {
        id: `pol-${Date.now()}`,
        title: policyTitle,
        rule: policyRule,
        severity: policySeverity,
      };
      updated = [...knowledge.policies, newPol];
    }

    const next = { ...knowledge, policies: updated };
    setIsPolicyModalOpen(false);
    persistKnowledge(next);
  };

  const handleDeletePolicy = (id: string) => {
    if (!knowledge || !confirm('¿Eliminar esta regla comercial?')) return;
    const next = { ...knowledge, policies: knowledge.policies.filter((p) => p.id !== id) };
    persistKnowledge(next);
  };

  // Guidelines Handlers
  const openGuidelineModal = (gui?: ConversationGuideline) => {
    if (gui) {
      setEditingGuideline(gui);
      setGuideTitle(gui.title);
      setGuideInstruction(gui.instruction);
    } else {
      setEditingGuideline(null);
      setGuideTitle('');
      setGuideInstruction('');
    }
    setIsGuidelineModalOpen(true);
  };

  const handleSaveGuideline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!knowledge) return;

    let updated: ConversationGuideline[];
    if (editingGuideline) {
      updated = knowledge.guidelines.map((g) =>
        g.id === editingGuideline.id ? { ...g, title: guideTitle, instruction: guideInstruction } : g
      );
    } else {
      const newG: ConversationGuideline = {
        id: `gui-${Date.now()}`,
        title: guideTitle,
        instruction: guideInstruction,
      };
      updated = [...knowledge.guidelines, newG];
    }

    const next = { ...knowledge, guidelines: updated };
    setIsGuidelineModalOpen(false);
    persistKnowledge(next);
  };

  const handleDeleteGuideline = (id: string) => {
    if (!knowledge || !confirm('¿Eliminar esta directriz?')) return;
    const next = { ...knowledge, guidelines: knowledge.guidelines.filter((g) => g.id !== id) };
    persistKnowledge(next);
  };

  if (loading || !knowledge) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span>Cargando base de conocimiento del negocio...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl glass-panel bg-slate-900/95 border border-cyan-500/30 text-cyan-200 text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Conocimiento del Negocio & Cerebro del Bot
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Live Prompt & RAG
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Define las respuestas oficiales, reglas de descuento, políticas de anticipo y credenciales técnicas. Los cambios se sincronizan en vivo en WhatsApp y Web.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadKnowledge}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 transition"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex flex-wrap border-b border-white/10 text-xs font-semibold gap-1">
        <button
          onClick={() => setActiveTab('FAQS')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'FAQS'
              ? 'border-cyan-400 text-cyan-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>1. Preguntas Frecuentes / FAQs ({knowledge.faqs?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('POLICIES')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'POLICIES'
              ? 'border-amber-400 text-amber-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>2. Políticas y Límites Comerciales ({knowledge.policies?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('GUIDELINES')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'GUIDELINES'
              ? 'border-indigo-400 text-indigo-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>3. Directrices de Conversación ({knowledge.guidelines?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('CREDENTIALS')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'CREDENTIALS'
              ? 'border-emerald-400 text-emerald-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>4. Ficha Técnica, EDMYSOFT & Casos de Éxito</span>
        </button>
      </div>

      {/* PESTAÑA 1: FAQS */}
      {activeTab === 'FAQS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Preguntas clave que los clientes suelen hacer. El bot responderá con estas respuestas exactas.
            </p>
            <button
              onClick={() => openFaqModal()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Nueva FAQ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledge.faqs?.map((faq) => (
              <div
                key={faq.id}
                className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/60 space-y-3 flex flex-col justify-between hover:border-cyan-500/30 transition shadow-lg text-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {faq.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openFaqModal(faq)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white"
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="p-1 rounded-lg text-red-400 hover:text-red-300"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-white text-sm">{faq.question}</h4>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: POLÍTICAS Y REGLAS */}
      {activeTab === 'POLICIES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Límites comerciales estrictos. La IA jamás violará una regla marcada como OBLIGATORIA.
            </p>
            <button
              onClick={() => openPolicyModal()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Regla Comercial</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledge.policies?.map((pol) => (
              <div
                key={pol.id}
                className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/60 space-y-3 flex flex-col justify-between hover:border-amber-500/30 transition shadow-lg text-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        pol.severity === 'OBLIGATORIA'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {pol.severity}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openPolicyModal(pol)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white"
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePolicy(pol.id)}
                        className="p-1 rounded-lg text-red-400 hover:text-red-300"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-white text-sm">{pol.title}</h4>
                  <p className="text-slate-300 leading-relaxed">{pol.rule}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: DIRECTRICES DE CONVERSACIÓN */}
      {activeTab === 'GUIDELINES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Instrucciones sobre cómo debe expresarse, calificar y conducir las conversaciones el asistente.
            </p>
            <button
              onClick={() => openGuidelineModal()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Directriz</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledge.guidelines?.map((gui) => (
              <div
                key={gui.id}
                className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/60 space-y-3 flex flex-col justify-between hover:border-indigo-500/30 transition shadow-lg text-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-500/20">
                      Directriz IA
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openGuidelineModal(gui)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white"
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGuideline(gui.id)}
                        className="p-1 rounded-lg text-red-400 hover:text-red-300"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-white text-sm">{gui.title}</h4>
                  <p className="text-slate-300 leading-relaxed">{gui.instruction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 4: FICHA TÉCNICA, TUSOFT & CASOS DE ÉXITO */}
      {activeTab === 'CREDENTIALS' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-slate-900/60 space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                Ficha Institucional y Respaldo Técnico
              </h3>
              <p className="text-xs text-slate-400">
                Información de credenciales que el bot cita para generar confianza y cerrar ventas corporativas.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Director Técnico & Arquitecto</label>
              <input
                type="text"
                value={knowledge.technicalLead}
                onChange={(e) => setKnowledge({ ...knowledge, technicalLead: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-white/10 px-3.5 py-2.5 text-white outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Alianza de Infraestructura</label>
              <input
                type="text"
                value={knowledge.partnerBacking}
                onChange={(e) => setKnowledge({ ...knowledge, partnerBacking: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-white/10 px-3.5 py-2.5 text-white outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Pitch Central de EDMYSOFT</label>
            <textarea
              rows={2}
              value={knowledge.corePitch}
              onChange={(e) => setKnowledge({ ...knowledge, corePitch: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">
              Casos de Éxito y Cifras Comprobables (RAG Context)
            </label>
            <textarea
              rows={4}
              value={knowledge.extraFreeformNotes}
              onChange={(e) => setKnowledge({ ...knowledge, extraFreeformNotes: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-cyan-400"
              placeholder="Menciona métricas específicas, porcentajes de reducción de tiempos, número de usuarios..."
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => persistKnowledge(knowledge)}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar y Actualizar Cerebro del Bot'}</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL FAQ */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full bg-[#0d1424] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>{editingFaq ? 'Editar FAQ' : 'Nueva Pregunta Frecuente'}</span>
              </h3>
              <button onClick={() => setIsFaqModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-3.5">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Categoría</label>
                <input
                  type="text"
                  required
                  value={faqCat}
                  onChange={(e) => setFaqCat(e.target.value)}
                  placeholder="Ej: Precios, Seguridad, Tiempos, Integraciones"
                  className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Pregunta del Cliente *</label>
                <input
                  type="text"
                  required
                  value={faqQ}
                  onChange={(e) => setFaqQ(e.target.value)}
                  placeholder="Ej: ¿Cuánto tiempo toma implementar el bot?"
                  className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Respuesta Oficial del Bot *</label>
                <textarea
                  rows={4}
                  required
                  value={faqA}
                  onChange={(e) => setFaqA(e.target.value)}
                  placeholder="La respuesta exacta que el bot debe suministrar al cliente..."
                  className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-md shadow-cyan-500/20"
                >
                  {saving ? 'Guardando...' : editingFaq ? 'Guardar Cambios' : 'Crear FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL POLÍTICA */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full bg-[#0d1424] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>{editingPolicy ? 'Editar Regla Comercial' : 'Nueva Regla Comercial'}</span>
              </h3>
              <button onClick={() => setIsPolicyModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Título de la Regla *</label>
                  <input
                    type="text"
                    required
                    value={policyTitle}
                    onChange={(e) => setPolicyTitle(e.target.value)}
                    placeholder="Ej: Garantía de satisfacción"
                    className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Severidad</label>
                  <select
                    value={policySeverity}
                    onChange={(e) => setPolicySeverity(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-amber-400"
                  >
                    <option value="OBLIGATORIA">OBLIGATORIA</option>
                    <option value="FLEXIBLE">FLEXIBLE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Detalle de la Regla *</label>
                <textarea
                  rows={3}
                  required
                  value={policyRule}
                  onChange={(e) => setPolicyRule(e.target.value)}
                  placeholder="Condiciones específicas que el bot debe respetar..."
                  className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-md shadow-amber-500/20"
                >
                  {saving ? 'Guardando...' : editingPolicy ? 'Guardar Cambios' : 'Crear Regla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DIRECTRIZ */}
      {isGuidelineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full bg-[#0d1424] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>{editingGuideline ? 'Editar Directriz' : 'Nueva Directriz'}</span>
              </h3>
              <button onClick={() => setIsGuidelineModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGuideline} className="space-y-3.5">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Título de la Directriz *</label>
                <input
                  type="text"
                  required
                  value={guideTitle}
                  onChange={(e) => setGuideTitle(e.target.value)}
                  placeholder="Ej: Empatía y Escucha Activa"
                  className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Instrucción para el Modelo de IA *</label>
                <textarea
                  rows={3}
                  required
                  value={guideInstruction}
                  onChange={(e) => setGuideInstruction(e.target.value)}
                  placeholder="Cómo debe comportarse la IA..."
                  className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white outline-none focus:border-indigo-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsGuidelineModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md shadow-indigo-600/20"
                >
                  {saving ? 'Guardando...' : editingGuideline ? 'Guardar Cambios' : 'Crear Directriz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
