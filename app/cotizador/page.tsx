import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FloatingWhatsApp from '@/components/public/FloatingWhatsApp';
import QuotationWizard from '@/components/public/QuotationWizard';
import Link from 'next/link';
import { Sparkles, ShieldCheck, ArrowRight, Bot, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cotizador Interactivo de Proyectos | EDMYSOFT',
  description:
    'Calcula y solicita tu cotización personalizada para Desarrollo Web, Inteligencia Artificial y Automatización de WhatsApp.',
};

export default function CotizadorPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-cyan-500/30 text-xs font-semibold text-cyan-400 mb-4 shadow-inner">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Cotizador Oficial EDMYSOFT • Edier Mery Gallego</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Calcula y Diseña tu Solución de <span className="gradient-text">Software & IA</span>
            </h1>
            <p className="mt-4 text-base text-slate-300">
              Personaliza el alcance, obtén una estimación de presupuesto basada en tarifas oficiales y recibe una propuesta formal en tu correo.
            </p>
          </div>

          {/* Quotation Wizard */}
          <QuotationWizard />

          {/* Banner de Garantías EDMYSOFT */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-slate-900/60">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Precios Deterministas</h3>
              <p className="text-xs text-slate-400 mt-2">
                Sin sorpresas. Tarifas oficiales de base de datos con desglose de setup y mensualidad.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-slate-900/60">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Asistente IA Asesor</h3>
              <p className="text-xs text-slate-400 mt-2">
                Consulta dudas en tiempo real con nuestro agente o solicita agendamiento con Edier Gallego.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-slate-900/60">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Garantía EDMYSOFT</h3>
              <p className="text-xs text-slate-400 mt-2">
                Arquitectura respaldada por ingeniería de software de alto nivel, soporte prioritario y código propio.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
