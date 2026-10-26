import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FloatingWhatsApp from '@/components/public/FloatingWhatsApp';
import { Bot, ShieldCheck, Cpu, Code2, Users2, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#090d16] text-slate-100">
      <Navbar />

      <section className="pt-20 pb-16 border-b border-white/5 bg-[#0b101c]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Identidad y Rigor Técnico</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">Sobre EDMYSOFT</h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Somos una empresa de soluciones tecnológicas dedicada a transformar procesos comerciales y operativos mediante inteligencia artificial, automatizaciones avanzadas y software a medida.
          </p>
        </div>
      </section>

      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-7 rounded-2xl border-white/5 bg-slate-900/40 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Ingeniería Robusta</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Desarrollamos con Next.js, TypeScript, PostgreSQL y APIs oficiales. No usamos soluciones improvisadas que pongan en riesgo tu número o tu reputación comercial.
            </p>
          </div>

          <div className="glass-panel p-7 rounded-2xl border-white/5 bg-slate-900/40 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Inteligencia Artificial Controlada</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nuestros modelos comprenden el contexto y el lenguaje natural, pero las cotizaciones, tarifas y estados financieros son calculados por motores matemáticos en el servidor.
            </p>
          </div>

          <div className="glass-panel p-7 rounded-2xl border-white/5 bg-slate-900/40 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Transparencia y Privacidad</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Separamos estrictamente la inversión de desarrollo de los consumos recurrentes de Meta, hosting o tokens, evitando cobros duplicados o sorpresas a fin de mes.
            </p>
          </div>
        </div>

        <div className="glass-panel p-8 sm:p-10 rounded-3xl border-white/10 bg-slate-900/60 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            ¿Listo para llevar tu negocio al siguiente nivel de automatización?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Hablemos de tus procesos actuales y descubre cómo un agente en WhatsApp o un flujo en n8n pueden ahorrarte cientos de horas hombre cada mes.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/diagnostico"
              className="px-6 py-3 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
            >
              Realizar Diagnóstico Gratuito
            </Link>
            <Link
              href="/contacto"
              className="px-6 py-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Contactar al Equipo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
