import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FloatingWhatsApp from '@/components/public/FloatingWhatsApp';
import prisma from '@/lib/prisma';
import { formatCOP } from '@/lib/formatters';
import { Bot, MessageSquare, Workflow, Globe, Cpu, Layers, ArrowRight, Check } from 'lucide-react';


export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { order: 'asc' },
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

  return (
    <div className="flex flex-col min-h-screen bg-[#090d16] text-slate-100">
      <Navbar />

      <section className="pt-16 pb-12 border-b border-white/5 bg-[#0b101c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Portafolio Oficial</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">Servicios y Soluciones EDMYSOFT</h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Explora nuestros servicios de inteligencia artificial, automatización comercial y desarrollo de software. Todos los precios proceden directamente de nuestro catálogo administrable.
          </p>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {services.map((service) => {
          const features = typeof service.features === 'string' ? JSON.parse(service.features) : service.features;

          return (
            <div
              key={service.id}
              id={service.slug}
              className="glass-panel p-8 sm:p-10 rounded-3xl border-white/10 bg-[#0f172a]/70 space-y-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    {service.category === 'IA' && <Bot className="w-7 h-7" />}
                    {service.category === 'CHATBOTS' && <MessageSquare className="w-7 h-7" />}
                    {service.category === 'AUTOMATIZACION' && <Workflow className="w-7 h-7" />}
                    {service.category === 'DESARROLLO_WEB' && <Globe className="w-7 h-7" />}
                    {service.category === 'SOFTWARE_A_MEDIDA' && <Cpu className="w-7 h-7" />}
                    {!['IA', 'CHATBOTS', 'AUTOMATIZACION', 'DESARROLLO_WEB', 'SOFTWARE_A_MEDIDA'].includes(service.category) && (
                      <Layers className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">{service.name}</h2>
                      {service.badgeText && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {service.badgeText}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-400 max-w-2xl">{service.shortDesc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/servicios/${service.slug}`}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    Ver Detalle Completo
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/diagnostico"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
                  >
                    Cotizar Servicio
                  </Link>
                </div>
              </div>

              {/* Características Clave */}
              {Array.isArray(features) && features.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
                    Capacidades y Entregables
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {features.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Planes Disponibles */}
              {service.plans.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
                    Planes Comerciales Disponibles
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {service.plans.map((plan) => {
                      const planFeatures = typeof plan.featuresIncluded === 'string' ? JSON.parse(plan.featuresIncluded) : plan.featuresIncluded;
                      return (
                        <div
                          key={plan.id}
                          className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                            plan.isRecommended
                              ? 'bg-gradient-to-b from-cyan-950/20 to-slate-900 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                              : 'bg-slate-900/50 border-white/5'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <h5 className="text-lg font-bold text-white">{plan.name}</h5>
                              {plan.isRecommended && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-400 text-slate-950">
                                  Recomendado
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-400">{plan.description}</p>

                            <div className="mt-4 py-3 border-y border-white/5">
                              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Implementación (Setup)</span>
                              <span className="text-2xl font-extrabold text-cyan-400">{formatCOP(plan.setupPrice)}</span>
                              {plan.recurringPrice > 0 && (
                                <span className="text-xs text-slate-300 block mt-0.5">
                                  + {formatCOP(plan.recurringPrice)} / mes recurrente
                                </span>
                              )}
                            </div>

                            {Array.isArray(planFeatures) && (
                              <ul className="mt-4 space-y-2 text-xs text-slate-400">
                                {planFeatures.map((f: string, i: number) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="mt-6 pt-4 border-t border-white/5">
                            <Link
                              href={`/diagnostico?plan=${plan.slug}&service=${service.slug}`}
                              className="w-full block text-center py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
                            >
                              Seleccionar y Cotizar
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
