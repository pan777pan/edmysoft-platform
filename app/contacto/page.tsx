'use client';

import { useState } from 'react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FloatingWhatsApp from '@/components/public/FloatingWhatsApp';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle, Loader2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    companyName: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          companyName: form.companyName,
          serviceInterest: 'Contacto Comercial General',
          identifiedNeed: form.message,
          preferredChannel: 'WHATSAPP',
        }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#090d16] text-slate-100">
      <Navbar />

      <section className="pt-20 pb-12 border-b border-white/5 bg-[#0b101c]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Atención y Soporte</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">Contáctanos</h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Estamos disponibles para asesorarte en la arquitectura y automatización tecnológica de tu empresa.
          </p>
        </div>
      </section>

      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Canales Directos */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Canales Oficiales</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Priorizamos la atención ágil vía WhatsApp, donde nuestro asistente comercial y asesores humanos atienden tus dudas en minutos.
            </p>

            <div className="space-y-4 pt-2">
              <a
                href="https://wa.me/573000000000?text=Hola%20EDMYSOFT,%20quiero%20hacer%20una%20consulta%20comercial"
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl glass-panel bg-slate-900/60 border-white/5 flex items-center gap-4 hover:border-emerald-500/40 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">WhatsApp Comercial</h4>
                  <span className="text-xs text-slate-400">+57 300 000 0000 (Atención 24/7)</span>
                </div>
              </a>

              <div className="p-5 rounded-2xl glass-panel bg-slate-900/60 border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Correo Electrónico</h4>
                  <span className="text-xs text-slate-400">contacto@edmysoft.com</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl glass-panel bg-slate-900/60 border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Ubicación y Horario</h4>
                  <span className="text-xs text-slate-400">Colombia — Atención Nacional e Internacional</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario Directo */}
          <div className="glass-panel p-8 rounded-3xl border-white/10 bg-slate-900/70 shadow-2xl">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">¡Mensaje Enviado!</h3>
                <p className="text-xs text-slate-400">
                  Nos comunicaremos al número de WhatsApp suministrado en breve.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">Envíanos un mensaje directo</h3>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Tu nombre"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+57 300..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Empresa</label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      placeholder="Nombre empresa"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="correo@empresa.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">¿Cómo podemos ayudarte? *</label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Describe brevemente tus requerimientos..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Send className="w-4 h-4" />}
                  Enviar Mensaje
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
