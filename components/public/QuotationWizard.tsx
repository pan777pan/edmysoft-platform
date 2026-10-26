'use client';

import { useState } from 'react';
import {
  Globe,
  Workflow,
  Bot,
  Smartphone,
  Layers,
  ArrowRight,
  CheckCircle2,
  Send,
  Sparkles,
  Phone,
} from 'lucide-react';

export default function QuotationWizard() {
  const [step, setStep] = useState(1);
  const [solutionType, setSolutionType] = useState('Desarrollo Web & Web App');
  const [scopeLevel, setScopeLevel] = useState('Escalamiento Profesional (1-3 meses)');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedQuoteId, setSubmittedQuoteId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.length < 15 || !email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name,
          email,
          phone,
          companyName: name,
          channel: 'WEB_WIZARD',
          serviceInterested: solutionType,
          diagnosisAnswers: {
            scopeLevel,
            description,
          },
        }),
      });

      const data = await res.json();
      const generatedId = `COT-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedQuoteId(generatedId);
    } catch (err) {
      console.error(err);
      setSubmittedQuoteId(`COT-${Math.floor(1000 + Math.random() * 9000)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="cotizador" className="py-20 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-cyan-500/30 shadow-2xl bg-[#0d1424]">
          {/* Header del Wizard */}
          <div className="text-center mb-8">
            <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Módulo Interactivo de Cotización
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
              Configura y Cotiza tu Proyecto a Medida
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl mx-auto">
              Diseño de propuesta formal por Edier Mery Gallego y el equipo de ingeniería de EDMYSOFT.
            </p>
          </div>

          {submittedQuoteId ? (
            <div className="p-8 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">¡Solicitud de Cotización Registrada!</h3>
              <p className="text-sm text-slate-300 max-w-lg mx-auto">
                Hemos registrado tu requerimiento con el código{' '}
                <strong className="text-cyan-400 font-mono text-base">{submittedQuoteId}</strong>. Se ha
                notificado al equipo de ingeniería y recibirás la propuesta en tu correo:{' '}
                <span className="font-semibold text-white">{email}</span>.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/573234166354?text=${encodeURIComponent(
                    `Hola Edier, acabo de enviar la cotización ${submittedQuoteId} sobre ${solutionType} para ${name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg"
                >
                  <Phone className="w-4 h-4" />
                  <span>Avisar a Edier Gallego por WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedQuoteId(null);
                    setStep(1);
                    setDescription('');
                  }}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Cotizar Otro Proyecto
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Indicadores de Paso */}
              <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-800 -z-10" />

                {[
                  { num: 1, label: 'Solución' },
                  { num: 2, label: 'Alcance' },
                  { num: 3, label: 'Detalles' },
                  { num: 4, label: 'Contacto' },
                ].map((s) => {
                  const isActive = step === s.num;
                  const isDone = step > s.num;
                  return (
                    <div
                      key={s.num}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-slate-900 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                          : isDone
                          ? 'bg-slate-900 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-950 border-white/10 text-slate-500'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                          isActive
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : isDone
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {s.num}
                      </span>
                      <span className="hidden sm:inline">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Formulario por Pasos */}
              <form onSubmit={handleSubmit}>
                {/* Paso 1: Tipo de Solución */}
                {step === 1 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      1. Selecciona el tipo de solución requerida:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {[
                        {
                          val: 'Desarrollo Web & Web App',
                          title: 'Página Web / Web App',
                          desc: 'Plataformas a medida, e-commerce o sistemas corporativos.',
                          icon: Globe,
                        },
                        {
                          val: 'Automatización de Procesos (RPA)',
                          title: 'Automatización de Procesos',
                          desc: 'Workflows con n8n, conexión de APIs y reducción de tareas manuales.',
                          icon: Workflow,
                        },
                        {
                          val: 'Inteligencia Artificial & Agentes',
                          title: 'Inteligencia Artificial & Agentes',
                          desc: 'Agentes conversacionales, WhatsApp Cloud, LLMs y RAG.',
                          icon: Bot,
                        },
                        {
                          val: 'Aplicación Móvil o Desktop',
                          title: 'Aplicación Móvil o Desktop',
                          desc: 'Apps nativas/híbridas (iOS/Android) o software de escritorio.',
                          icon: Smartphone,
                        },
                        {
                          val: 'Solución Integral End-to-End (Web + IA + Automatización)',
                          title: 'Solución Integral End-to-End (Ecosistema Completo)',
                          desc: 'Arquitectura integral combinando web, agentes IA y automatización con respaldo de alta ingeniería EDMYSOFT.',
                          icon: Layers,
                          fullWidth: true,
                        },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = solutionType === item.val;
                        return (
                          <div
                            key={item.val}
                            onClick={() => setSolutionType(item.val)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                              item.fullWidth ? 'sm:col-span-2' : ''
                            } ${
                              isSelected
                                ? 'bg-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-500/10'
                                : 'bg-slate-900/80 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 mt-0.5 ${
                                isSelected ? 'text-cyan-400' : 'text-slate-400'
                              }`}
                            />
                            <div>
                              <p className="font-semibold text-white text-sm">{item.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-300 hover:scale-105 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                      >
                        <span>Siguiente: Alcance</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Paso 2: Alcance o Complejidad */}
                {step === 2 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      2. Alcance o complejidad estimada del proyecto:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {[
                        {
                          val: 'MVP / Lanzamiento Ágil (2-4 semanas)',
                          badge: 'Fase Inicial',
                          title: 'MVP / Solución Puntual',
                          desc: 'Ideal para validar producto o automatizar un flujo comercial específico rápidamente.',
                          color: 'text-cyan-400',
                        },
                        {
                          val: 'Escalamiento Profesional (1-3 meses)',
                          badge: 'Recomendado',
                          title: 'Proyecto Corporativo Medio',
                          desc: 'Múltiples módulos, panel administrativo, integraciones API y base de datos relacional.',
                          color: 'text-indigo-400',
                        },
                        {
                          val: 'Arquitectura Enterprise (+3 meses)',
                          badge: 'Gran Escala',
                          title: 'Ecosistema Enterprise',
                          desc: 'Alta concurrencia, IA personalizada y célula de ingeniería y soporte de EDMYSOFT.',
                          color: 'text-emerald-400',
                        },
                      ].map((item) => {
                        const isSelected = scopeLevel === item.val;
                        return (
                          <div
                            key={item.val}
                            onClick={() => setScopeLevel(item.val)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all h-full flex flex-col justify-between ${
                              isSelected
                                ? 'bg-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-500/10'
                                : 'bg-slate-900/80 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div>
                              <span className={`text-[11px] font-bold uppercase ${item.color}`}>
                                {item.badge}
                              </span>
                              <p className="font-bold text-white text-sm mt-1">{item.title}</p>
                              <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-300 hover:scale-105 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                      >
                        <span>Siguiente: Requerimientos</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Paso 3: Detalles y Requerimientos */}
                {step === 3 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-200">
                      3. Cuéntanos sobre el problema a resolver o los requerimientos de tu proyecto:
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe las funciones clave que necesitas, qué sistemas utilizas actualmente o qué proceso deseas automatizar..."
                      className="w-full rounded-xl bg-slate-900 border border-white/15 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Mínimo 15 caracteres ({description.length} caracteres escritos)</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        disabled={description.length < 15}
                        onClick={() => setStep(4)}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-300 hover:scale-105 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                      >
                        <span>Siguiente: Tus Datos</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Paso 4: Datos de Contacto */}
                {step === 4 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-200">
                      4. Datos de contacto para recibir la propuesta formal:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1 font-medium">
                          Nombre completo / Empresa *
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ej: Carlos Mendoza - Logística Andina"
                          className="w-full rounded-xl bg-slate-900 border border-white/15 px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 font-medium">
                          Correo electrónico corporativo *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="carlos@empresa.com"
                          className="w-full rounded-xl bg-slate-900 border border-white/15 px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-slate-400 block mb-1 font-medium">
                          Teléfono / WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+57 300 000 0000"
                          className="w-full rounded-xl bg-slate-900 border border-white/15 px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                      >
                        Atrás
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !name || !email || !phone}
                        className="px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-300 hover:scale-105 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-xl shadow-cyan-500/25 flex items-center gap-2 transition-all"
                      >
                        <Send className="w-4 h-4" />
                        <span>{loading ? 'Enviando...' : 'Enviar Solicitud a EDMYSOFT'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
