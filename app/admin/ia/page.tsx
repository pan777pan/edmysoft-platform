'use client';

import { useEffect, useState } from 'react';
import { Bot, CheckCircle2, AlertTriangle, Loader2, KeyRound, Send, Bell, Sparkles, ExternalLink, Save } from 'lucide-react';

interface PublicConfig {
  provider: 'auto' | 'gemini' | 'openai' | 'openrouter' | 'local';
  geminiApiKey: string;
  geminiModel: string;
  openaiApiKey: string;
  openaiModel: string;
  openrouterApiKey: string;
  openrouterModel: string;
  temperature: number;
  ownerWhatsApp: string;
  notifyOwner: boolean;
  extraInstructions: string;
  hasGemini: boolean;
  hasOpenAI: boolean;
  hasOpenRouter: boolean;
}

interface TestResult {
  usingLLM: boolean;
  modelUsed: string;
  reply: string;
  toolsUsed?: string[];
  ms: number;
  hasAnyKey: boolean;
  status: { ok: boolean; provider: string; model: string; error: string | null } | null;
}

const inputCls =
  'w-full rounded-xl bg-slate-950/70 border border-white/10 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition';

export default function AdminIAPage() {
  const [cfg, setCfg] = useState<PublicConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<TestResult | null>(null);
  const [testMsg, setTestMsg] = useState('Hola, tengo una clínica y me escriben muchos pacientes por WhatsApp. ¿Qué me recomiendas?');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/ai-config')
      .then((r) => r.json())
      .then((d) => (d.success ? setCfg(d.config) : setError('Inicia sesión como administrador para configurar la IA.')))
      .catch(() => setError('No se pudo cargar la configuración.'));
  }, []);

  const update = <K extends keyof PublicConfig>(k: K, v: PublicConfig[K]) => cfg && setCfg({ ...cfg, [k]: v });

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/admin/ai-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    const d = await res.json();
    if (d.success) {
      setCfg(d.config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const runTest = async () => {
    setTesting(true);
    setTest(null);
    await save();
    const res = await fetch('/api/admin/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: testMsg }),
    });
    const d = await res.json();
    if (d.success) setTest(d);
    setTesting(false);
  };

  if (error) {
    return <div className="p-8 text-sm text-amber-300">{error}</div>;
  }
  if (!cfg) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando configuración…
      </div>
    );
  }

  const llmReady = cfg.hasGemini || cfg.hasOpenAI || cfg.hasOpenRouter;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-cyan-400" /> Cerebro IA del asesor comercial
        </h1>
        <p className="text-sm text-slate-400">
          Conecta un modelo de lenguaje real para que el bot de WhatsApp y el chat de la web conversen con criterio comercial,
          recuerden el contexto, califiquen leads y agenden citas.
        </p>
      </header>

      {/* ESTADO */}
      <div
        className={`rounded-2xl border p-4 flex items-start gap-3 ${
          llmReady ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-cyan-500/30 bg-cyan-500/5'
        }`}
      >
        {llmReady ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
        ) : (
          <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
        )}
        <div className="text-sm">
          <p className="font-semibold text-white">
            {llmReady ? 'Modelo LLM en la nube activo' : 'Motor Consultor Experto Activo (Sin costo)'}
          </p>
          <p className="text-slate-400 mt-0.5">
            {llmReady
              ? 'El agente opera con modelo de lenguaje avanzado y function calling en tiempo real. Pulsa «Probar agente» para simular una consulta.'
              : 'El bot ya cuenta con 10+ playbooks por sector (inmobiliarias, clínicas, tiendas, restaurantes), cotizador automático en COP y agendamiento con Google Calendar. Para activar además razonamiento libre con Google Gemini 2.5 Flash gratuito, pega tu clave abajo.'}
          </p>
        </div>
      </div>

      {/* PROVEEDORES */}
      <section className="rounded-2xl border border-white/10 bg-[#0b1018] p-5 space-y-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-cyan-400" /> Proveedor y credenciales
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-1.5 block">
            <span className="text-xs text-slate-400">Proveedor activo</span>
            <select className={inputCls} value={cfg.provider} onChange={(e) => update('provider', e.target.value as PublicConfig['provider'])}>
              <option value="auto">Automático (Gemini → OpenAI → OpenRouter → local)</option>
              <option value="gemini">Solo Google Gemini</option>
              <option value="openai">Solo OpenAI (ChatGPT)</option>
              <option value="openrouter">Solo OpenRouter</option>
              <option value="local">Agente local (sin IA externa)</option>
            </select>
          </label>
          <label className="space-y-1.5 block">
            <span className="text-xs text-slate-400">
              Creatividad: {cfg.temperature.toFixed(1)} <span className="text-slate-500">(0.5-0.7 recomendado)</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={cfg.temperature}
              onChange={(e) => update('temperature', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 mt-2"
            />
          </label>
        </div>

        {/* Gemini */}
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Google Gemini <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Gratis · recomendado</span>
            </span>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
            >
              Obtener clave gratis <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              className={`${inputCls} sm:col-span-2`}
              placeholder="Pega aquí tu API key de Gemini (AIza...)"
              value={cfg.geminiApiKey}
              onChange={(e) => update('geminiApiKey', e.target.value)}
              autoComplete="off"
            />
            <input className={inputCls} value={cfg.geminiModel} onChange={(e) => update('geminiModel', e.target.value)} placeholder="gemini-2.5-flash" />
          </div>
        </div>

        {/* OpenAI */}
        <div className="rounded-xl border border-white/10 p-4 space-y-3">
          <span className="text-sm font-semibold text-slate-200">OpenAI (ChatGPT)</span>
          <div className="grid sm:grid-cols-3 gap-3">
            <input className={`${inputCls} sm:col-span-2`} placeholder="sk-..." value={cfg.openaiApiKey} onChange={(e) => update('openaiApiKey', e.target.value)} autoComplete="off" />
            <input className={inputCls} value={cfg.openaiModel} onChange={(e) => update('openaiModel', e.target.value)} placeholder="gpt-4o-mini" />
          </div>
        </div>

        {/* OpenRouter */}
        <div className="rounded-xl border border-white/10 p-4 space-y-3">
          <span className="text-sm font-semibold text-slate-200">OpenRouter (modelos gratuitos variados)</span>
          <div className="grid sm:grid-cols-3 gap-3">
            <input className={`${inputCls} sm:col-span-2`} placeholder="sk-or-..." value={cfg.openrouterApiKey} onChange={(e) => update('openrouterApiKey', e.target.value)} autoComplete="off" />
            <input className={inputCls} value={cfg.openrouterModel} onChange={(e) => update('openrouterModel', e.target.value)} placeholder="meta-llama/llama-3.3-70b-instruct:free" />
          </div>
        </div>
      </section>

      {/* ALERTAS Y REGLAS */}
      <section className="rounded-2xl border border-white/10 bg-[#0b1018] p-5 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" /> Alertas al dueño y reglas del negocio
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <label className="space-y-1.5 block">
            <span className="text-xs text-slate-400">Tu WhatsApp (con indicativo, sin +)</span>
            <input className={inputCls} value={cfg.ownerWhatsApp} onChange={(e) => update('ownerWhatsApp', e.target.value)} placeholder="573234166354" />
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer pb-2.5">
            <input type="checkbox" checked={cfg.notifyOwner} onChange={(e) => update('notifyOwner', e.target.checked)} className="w-4 h-4 accent-cyan-400" />
            Avisarme por WhatsApp de leads calientes, citas y solicitudes de asesor
          </label>
        </div>
        <label className="space-y-1.5 block">
          <span className="text-xs text-slate-400">
            Instrucciones adicionales para el bot (promociones, políticas, tono, datos nuevos). Tienen prioridad alta.
          </span>
          <textarea
            rows={5}
            className={inputCls}
            value={cfg.extraInstructions}
            onChange={(e) => update('extraInstructions', e.target.value)}
            placeholder="Ej.: Esta semana ofrecemos el diagnóstico gratis a clínicas. Si el cliente es de Medellín menciona que podemos reunirnos presencial."
          />
        </label>
      </section>

      {/* ACCIONES */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          id="ia-save"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold transition disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar configuración
        </button>
        {saved && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Guardado</span>}
      </div>

      {/* PRUEBA */}
      <section className="rounded-2xl border border-white/10 bg-[#0b1018] p-5 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Send className="w-4 h-4 text-cyan-400" /> Probar agente
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input className={inputCls} value={testMsg} onChange={(e) => setTestMsg(e.target.value)} />
          <button
            id="ia-test"
            onClick={runTest}
            disabled={testing}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 text-sm font-semibold transition disabled:opacity-60"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />} Probar
          </button>
        </div>

        {test && (
          <div className="space-y-3">
            <div className={`text-xs inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${test.usingLLM ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' : 'border-amber-500/30 text-amber-300 bg-amber-500/10'}`}>
              {test.usingLLM ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {test.usingLLM ? `LLM activo: ${test.modelUsed}` : 'Respondió el agente local (sin LLM)'} · {test.ms} ms
              {test.toolsUsed?.length ? ` · herramientas: ${test.toolsUsed.join(', ')}` : ''}
            </div>
            {!test.usingLLM && test.status?.error && (
              <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3 break-words">
                Error del proveedor ({test.status.provider}): {test.status.error}
              </p>
            )}
            {!test.usingLLM && !test.hasAnyKey && (
              <p className="text-xs text-amber-300">Aún no hay ninguna clave guardada. Pega la clave de Gemini arriba y vuelve a probar.</p>
            )}
            <div className="rounded-xl bg-slate-950/70 border border-white/10 p-4 text-sm text-slate-200 whitespace-pre-wrap">{test.reply}</div>
          </div>
        )}
      </section>
    </div>
  );
}
