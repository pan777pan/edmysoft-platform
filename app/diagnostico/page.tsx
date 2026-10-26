'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FloatingWhatsApp from '@/components/public/FloatingWhatsApp';
import {
  Sparkles,
  Bot,
  MessageSquare,
  Workflow,
  Cpu,
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Building,
  Phone,
  Mail,
  User,
  Shield,
  Loader2,
} from 'lucide-react';

export default function DiagnosisPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    serviceInterest: 'Agentes de Inteligencia Artificial',
    identifiedNeed: '',
    currentChannels: ['WhatsApp'],
    monthlyLeadsVolume: '10 a 50 prospectos diarios',
    targetBudget: '3800000',
    fullName: '',
    phone: '',
    email: '',
    companyName: '',
  });

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const toggleChannel = (channel: string) => {
    setFormData((prev) => {
      const exists = prev.currentChannels.includes(channel);
      return {
        ...prev,
        currentChannels: exists
          ? prev.currentChannels.filter((c) => c !== channel)
          : [...prev.currentChannels, channel],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          companyName: formData.companyName,
          serviceInterest: formData.serviceInterest,
          identifiedNeed: `${formData.identifiedNeed}. Canales: ${formData.currentChannels.join(', ')}`,
          monthlyLeadsVolume: formData.monthlyLeadsVolume,
          targetBudget: formData.targetBudget,
          preferredChannel: 'WHATSAPP',
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/gracias');
      } else {
        setError(data.error || 'Ocurrió un error al enviar el diagnóstico.');
      }
    } catch {
      setError('Error de conexión. Inténtalo nuevamente o contáctanos por WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#090d16] text-slate-100">
      <Navbar />

      <section className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Diagnóstico Comercial Inteligente</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Evalúa la Automatización Ideal para tu Negocio
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Completa 3 sencillos pasos para identificar qué tecnología, plan y canal optimizarán tus ventas y tiempos de respuesta.
          </p>

          {/* Barra de progreso de 3 pasos */}
          <div className="flex items-center justify-center gap-3 pt-6 max-w-xs mx-auto">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex-1 flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= num
                      ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`flex-1 h-1 rounded-full ${
                      step > num ? 'bg-cyan-400' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CONTENEDOR DEL FORMULARIO */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border-white/10 bg-[#0f172a]/80 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* PASO 1: SERVICIO DE INTERÉS */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">1. ¿Qué solución tecnológica estás buscando principalmente?</h3>
                <p className="text-xs text-slate-400 mt-1">Selecciona la categoría que mejor describa tu objetivo.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    name: 'Agentes de Inteligencia Artificial',
                    desc: 'Atención autónoma en WhatsApp con cotizaciones y agendamiento.',
                    icon: Bot,
                  },
                  {
                    name: 'Chatbots y Atención Automatizada',
                    desc: 'Menús guiados y derivación para WhatsApp e Instagram.',
                    icon: MessageSquare,
                  },
                  {
                    name: 'Automatización con n8n',
                    desc: 'Workflows entre CRMs, correos, bases de datos y alertas.',
                    icon: Workflow,
                  },
                  {
                    name: 'Desarrollo Web & Software a Medida',
                    desc: 'Portales modernos, paneles administrativos y cotizadores.',
                    icon: Cpu,
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  const selected = formData.serviceInterest === item.name;
                  return (
                    <div
                      key={idx}
                      onClick={() => setFormData({ ...formData, serviceInterest: item.name })}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        selected
                          ? 'bg-cyan-950/30 border-cyan-400 shadow-md shadow-cyan-500/15'
                          : 'bg-slate-900/50 border-white/5 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-xl ${selected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-cyan-400'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Cuéntanos brevemente qué problema o proceso deseas resolver:
                </label>
                <textarea
                  rows={3}
                  value={formData.identifiedNeed}
                  onChange={(e) => setFormData({ ...formData, identifiedNeed: e.target.value })}
                  placeholder="Ej: Recibimos más de 30 mensajes al día en WhatsApp y nos tardamos horas en contestar o cotizar..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all flex items-center gap-2"
                >
                  Siguiente: Tu Operación
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: OPERACIÓN Y VOLUMEN */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">2. Cuéntanos sobre tu volumen y canales de atención</h3>
                <p className="text-xs text-slate-400 mt-1">Nos ayuda a calcular la capacidad técnica requerida.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-3">
                  ¿Qué canales utilizas actualmente para atender a tus clientes?
                </label>
                <div className="flex flex-wrap gap-3">
                  {['WhatsApp Business en celular', 'Instagram Direct', 'Facebook Messenger', 'Página Web', 'Llamadas Directas'].map((ch) => {
                    const isChecked = formData.currentChannels.includes(ch);
                    return (
                      <button
                        type="button"
                        key={ch}
                        onClick={() => toggleChannel(ch)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          isChecked
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isChecked && <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />}
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  ¿Cuántos mensajes o prospectos nuevos recibes al día aproximadamente?
                </label>
                <select
                  value={formData.monthlyLeadsVolume}
                  onChange={(e) => setFormData({ ...formData, monthlyLeadsVolume: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="1 a 10 diarios">Menos de 10 prospectos al día</option>
                  <option value="10 a 50 diarios">10 a 50 prospectos al día</option>
                  <option value="50 a 150 diarios">50 a 150 prospectos al día (Alto volumen)</option>
                  <option value="Más de 150 diarios">Más de 150 prospectos al día (Nivel empresarial)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Presupuesto orientativo estimado (en Pesos Colombianos COP):
                </label>
                <select
                  value={formData.targetBudget}
                  onChange={(e) => setFormData({ ...formData, targetBudget: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="2200000">Alrededor de $2.200.000 COP (Plan Estándar)</option>
                  <option value="3800000">Alrededor de $3.800.000 COP (Plan Plus / Recomendado)</option>
                  <option value="6500000">Alrededor de $6.500.000 COP (Plan Empresarial Multicanal)</option>
                  <option value="10000000">Más de $10.000.000 COP (Software a medida o gran escala)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all flex items-center gap-2"
                >
                  Siguiente: Tus Datos
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: DATOS DE CONTACTO */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">3. ¿A dónde te enviamos la propuesta y recomendaciones?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Nos comunicaremos por WhatsApp de forma transparente para presentarte la mejor alternativa.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Nombre y Apellidos *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Ej: Carlos Mendoza"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">WhatsApp de Contacto *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Ej: +57 312 456 7890"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Empresa o Negocio</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Ej: Innova Servicios SAS"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Correo Electrónico (Opcional)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Ej: contacto@innova.co"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-2.5 text-[11px] text-slate-400">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Tus datos están protegidos conforme a la política de tratamiento de datos personales de EDMYSOFT. No compartimos tu información con terceros ni enviamos spam.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-300 hover:scale-105 shadow-xl shadow-cyan-500/20 transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      Registrando Diagnóstico...
                    </>
                  ) : (
                    <>
                      Enviar y Recibir Diagnóstico
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
