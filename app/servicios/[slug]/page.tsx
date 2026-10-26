import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FloatingWhatsApp from '@/components/public/FloatingWhatsApp';
import prisma from '@/lib/prisma';
import { formatCOP } from '@/lib/formatters';
import {
  Bot,
  MessageSquare,
  Workflow,
  Globe,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Check,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';


export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const service = await prisma.service.findUnique({
    where: { slug },
    include: {
      plans: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
      modules: {
        where: { isActive: true },
      },
    },
  });

  if (!service) {
    notFound();
  }

  const features = typeof service.features === 'string' ? JSON.parse(service.features) : service.features;
  const problemsSolved = service.problemsSolved ? (typeof service.problemsSolved === 'string' ? JSON.parse(service.problemsSolved) : service.problemsSolved) : [];
  const useCases = service.useCases ? (typeof service.useCases === 'string' ? JSON.parse(service.useCases) : service.useCases) : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#090d16] text-slate-100">
      <Navbar />

      {/* HEADER HERO DEL SERVICIO */}
      <section className="pt-16 pb-14 border-b border-white/5 bg-[#0b101c] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {service.category}
                </span>
                {service.badgeText && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {service.badgeText}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                {service.name}
              </h1>

              <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
                {service.longDesc || service.shortDesc}
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl bg-slate-900/80 border-white/10 shrink-0 space-y-4 text-center sm:text-left">
              <div>
                <span className="text-xs text-slate-400 block">Moneda oficial</span>
                <span className="text-sm font-bold text-white">Pesos Colombianos (COP)</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Tiempo estimado de entrega</span>
                <span className="text-sm font-bold text-cyan-400">7 a 15 días hábiles</span>
              </div>
              <Link
                href={`/diagnostico?service=${service.slug}`}
                className="w-full block text-center px-6 py-3 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/20"
              >
                Solicitar Cotización de este Servicio
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMAS QUE RESUELVE Y CASOS DE USO */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Problemas que resuelve */}
          <div className="glass-panel p-8 rounded-3xl border-white/5 bg-slate-900/50 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Problemas que Resuelve</h3>
            </div>
            {Array.isArray(problemsSolved) && problemsSolved.length > 0 ? (
              <ul className="space-y-3 text-sm text-slate-300">
                {problemsSolved.map((prob: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                    <span>{prob}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">Optimiza los tiempos de respuesta y elimina cuellos de botella en la atención comercial.</p>
            )}
          </div>

          {/* Casos de uso */}
          <div className="glass-panel p-8 rounded-3xl border-white/5 bg-slate-900/50 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Casos de Uso Empresariales</h3>
            </div>
            {Array.isArray(useCases) && useCases.length > 0 ? (
              <ul className="space-y-3 text-sm text-slate-300">
                {useCases.map((uc: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                    <span>{uc}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">Calificación de prospectos, agendamiento de citas y soporte continuo en canales digitales.</p>
            )}
          </div>
        </div>
      </section>

      {/* PLANES COMERCIALES DISPONIBLES */}
      <section className="py-16 bg-[#0c121e] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-white">Planes Oficiales para {service.name}</h2>
            <p className="text-sm text-slate-400">
              Selecciona el alcance que mejor se ajuste a tu operación. Sin tarifas ocultas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {service.plans.map((plan) => {
              const planFeatures = typeof plan.featuresIncluded === 'string' ? JSON.parse(plan.featuresIncluded) : plan.featuresIncluded;

              return (
                <div
                  key={plan.id}
                  className={`p-8 rounded-3xl border transition-all flex flex-col justify-between ${
                    plan.isRecommended
                      ? 'bg-gradient-to-b from-cyan-950/30 to-slate-900 border-cyan-500/50 shadow-2xl shadow-cyan-500/15'
                      : 'bg-slate-900/60 border-white/5'
                  }`}
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                      {plan.isRecommended && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-400 text-slate-950">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{plan.description}</p>

                    <div className="py-4 border-y border-white/5 space-y-1">
                      <span className="text-[11px] text-slate-400 uppercase font-semibold block">Implementación (Setup inicial)</span>
                      <span className="text-3xl font-extrabold text-cyan-400">{formatCOP(plan.setupPrice)}</span>
                      {plan.recurringPrice > 0 ? (
                        <span className="text-xs text-slate-300 block">
                          + {formatCOP(plan.recurringPrice)} / mes recurrente
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-400 block font-semibold">Sin mensualidad obligatoria</span>
                      )}
                    </div>

                    {Array.isArray(planFeatures) && (
                      <div className="space-y-3">
                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                          Funcionalidades incluidas:
                        </span>
                        <ul className="space-y-2 text-xs text-slate-300">
                          {planFeatures.map((f: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5">
                    <Link
                      href={`/diagnostico?plan=${plan.slug}&service=${service.slug}`}
                      className="w-full block text-center py-3 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-md"
                    >
                      Elegir Plan {plan.name}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MÓDULOS ADICIONALES COMPATIBLES */}
      {service.modules.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Módulos y Funcionalidades Adicionales</h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Personaliza tu solución con módulos complementarios. Si un plan ya incluye la funcionalidad, no se te cobrará de nuevo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.modules.map((mod) => (
              <div key={mod.id} className="glass-panel p-6 rounded-2xl border-white/5 bg-slate-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{mod.code}</span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{mod.name}</h4>
                  <p className="mt-1 text-xs text-slate-400">{mod.description}</p>
                </div>
                <div className="pt-3 border-t border-white/5 flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Inversión:</span>
                  <span className="text-sm font-bold text-cyan-400">{formatCOP(mod.setupPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PREGUNTAS FRECUENTES DEL SERVICIO */}
      <section className="py-16 bg-[#0c121e] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white">Preguntas Frecuentes</h3>
            <p className="text-xs text-slate-400">Respuestas directas sobre la contratación y operación técnica.</p>
          </div>

          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-2xl border-white/5 bg-slate-900/50 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                ¿Qué pasa si mi empresa ya utiliza WhatsApp Business en el celular?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluamos tu caso: podemos activar el agente sobre una línea dedicada para mantener tu celular intacto, o asesorarte en la migración oficial a Meta Cloud API para centralizar toda tu operación sin riesgos.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-white/5 bg-slate-900/50 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                ¿Cómo se pagan los servicios?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Manejamos anticipo formal (generalmente entre el 30% y 50%) para iniciar la fase de desarrollo y arquitectura, y el saldo pendiente contra entrega y aprobación de pruebas de funcionamiento. Aceptamos transferencias Bancolombia, PSE, Nequi y tarjetas.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-white/5 bg-slate-900/50 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                ¿La IA puede cometer errores en los precios?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                No. En EDMYSOFT la IA no calcula precios de forma libre; consulta una calculadora matemática determinista conectada a la base de datos oficial. Si una cotización tiene condiciones especiales, pasa obligatoriamente por aprobación humana.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
