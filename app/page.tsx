import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FloatingWhatsApp from '@/components/public/FloatingWhatsApp';
import QuotationWizard from '@/components/public/QuotationWizard';
import prisma from '@/lib/prisma';
import { formatCOP } from '@/lib/formatters';
import {
  Bot,
  Zap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Workflow,
  MessageSquare,
  Globe,
  Cpu,
  Layers,
  Clock,
  Send,
  Building2,
  UserCheck,
  Smartphone,
  Phone,
  Mail,
  TrendingUp,
} from 'lucide-react';

export default async function HomePage() {
  // Consultar servicios activos del catálogo oficial
  const services = await prisma.service.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { order: 'asc' },
    include: {
      plans: {
        where: { isActive: true },
        orderBy: { setupPrice: 'asc' },
        take: 1,
      },
      modules: {
        where: { isActive: true },
      },
    },
  });

  // Consultar contenido CMS dinámico si existe
  const homeContent = await prisma.pageContent.findUnique({
    where: { slug: 'home' },
    include: {
      sections: {
        where: { isVisible: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#070b14] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      <Navbar />

      {/* A. HERO SECTION */}
      <section id="inicio" className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden border-b border-white/5">
        {/* Glow decorativo de fondo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge superior con sello TuSoft */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs font-semibold text-cyan-400 mb-8 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Ingeniería de Software de Alto Nivel en Colombia</span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400 font-bold">Tecnología & Software de Alto Nivel</span>
          </div>

          {/* Título Principal */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15] mb-6">
            Desarrollo Web, <span className="gradient-text">Inteligencia Artificial</span>, Agentes Virtuales y Automatización Empresarial
          </h1>

          {/* Subtítulo */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Transformamos desafíos complejos en software escalable a medida. Bajo la dirección técnica de{' '}
            <strong className="text-white font-semibold">Edier Mery Gallego</strong> y respaldados por la
            infraestructura multidesarrollador de <strong className="text-cyan-400 font-semibold">EDMYSOFT</strong>.
          </p>

          {/* Botones de acción principales */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#cotizador"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-indigo-300 hover:scale-105 shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2.5"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Cotizar Proyecto a Medida</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              href="/diagnostico"
              className="w-full sm:w-auto px-7 py-4 rounded-xl text-sm font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-center gap-2.5"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Diagnóstico Comercial Guiado</span>
            </Link>
          </div>

          {/* Micro-credenciales y Métricas Clave */}
          <div className="mt-16 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
              <p className="text-3xl font-extrabold text-white">100%</p>
              <p className="text-xs text-slate-400 mt-1">Arquitectura a Medida</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
              <p className="text-3xl font-extrabold text-cyan-400">24/7</p>
              <p className="text-xs text-slate-400 mt-1">Agentes IA & Automatización</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
              <p className="text-3xl font-extrabold text-cyan-400">EDMYSOFT</p>
              <p className="text-xs text-slate-400 mt-1">Respaldo Multidesarrollador</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
              <p className="text-3xl font-extrabold text-emerald-400">OWASP</p>
              <p className="text-xs text-slate-400 mt-1">Seguridad RBAC & PBKDF2</p>
            </div>
          </div>
        </div>
      </section>

      {/* B. SECCIÓN EDIER MERY GALLEGO & RESPALDO DE TUSOFT */}
      <section id="respaldo" className="py-20 bg-slate-950/60 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Propuesta de Valor Única</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Agilidad de Autor con la Solidez Corporativa de <span className="text-cyan-400">EDMYSOFT</span>
              </h2>

              <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                En <strong className="text-white">EDMYSOFT</strong> eliminamos la brecha entre el trato cercano de un
                arquitecto líder y la capacidad operativa de una casa de software consolidada. Cada proyecto es
                dirigido personalmente por <strong className="text-white">Edier Mery Gallego</strong>, garantizando
                comunicación directa, visión de negocio y excelencia en código.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="glass-panel p-5 rounded-xl border-l-4 border-l-cyan-500 bg-[#0c121e]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-base">Edier Mery Gallego</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Fundador & Líder Técnico. Especialista en arquitectura web moderna, integración de modelos de
                    Inteligencia Artificial y automatización de flujos críticos de ventas.
                  </p>
                </div>

                <div className="glass-panel p-5 rounded-xl border-l-4 border-l-indigo-500 bg-[#0c121e]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-base">Respaldo y Soporte EDMYSOFT</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Empresa colombiana de desarrollo de software que aporta infraestructura en la nube, equipo
                    multidesarrollador, QA y continuidad operativa garantizada.
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta Ejecutiva de Edier Mery Gallego */}
            <div className="lg:col-span-5">
              <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 bg-[#0d1424] relative overflow-hidden shadow-2xl">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-2xl font-extrabold text-white shadow-lg">
                    EG
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Líder Técnico & Fundador
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">Edier Mery Gallego</h3>
                    <p className="text-xs text-slate-400">EDMYSOFT • Soluciones Digitales Colombia</p>
                  </div>
                </div>

                <blockquote className="text-xs sm:text-sm text-slate-300 italic border-l-2 border-cyan-400 pl-4 mb-6 leading-relaxed">
                  &ldquo;Nuestro compromiso no es solo entregar líneas de código, sino construir activos digitales seguros
                  que automaticen la operación, reduzcan costos y multipliquen la capacidad comercial de cada
                  cliente.&rdquo;
                </blockquote>

                <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/80 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" /> Correo Oficial:
                    </span>
                    <a
                      href="mailto:ediergallego59@gmail.com"
                      className="font-medium text-white hover:text-cyan-400 transition-colors"
                    >
                      ediergallego59@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> Línea / WhatsApp:
                    </span>
                    <a
                      href="https://wa.me/573234166354"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-emerald-400 hover:underline"
                    >
                      +57 323 416 6354
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" /> Modelo Comercial:
                    </span>
                    <span className="font-semibold text-white">Cotización Determinista en COP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* C. 4 LÍNEAS DE SOLUCIONES ESPECIALIZADAS */}
      <section id="soluciones" className="py-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Catálogo Especializado</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Soluciones Tecnológicas de Punta a Punta
            </h2>
            <p className="text-slate-400 mt-3 text-sm sm:text-base">
              Selecciona la línea tecnológica que tu organización necesita escalar hoy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel rounded-2xl p-6 hover:border-cyan-500/50 transition-all group flex flex-col justify-between bg-[#0d1424]">
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Desarrollo Web & Web Apps</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Sitios corporativos de alto impacto, sistemas transaccionales a medida, plataformas SaaS, e-commerce y
                  paneles interactivos.
                </p>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 pt-4 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> React / Next.js / Tailwind
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Arquitectura Cloud & SEO
                </li>
              </ul>
            </div>

            <div className="glass-panel rounded-2xl p-6 hover:border-indigo-500/50 transition-all group flex flex-col justify-between bg-[#0d1424]">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
                  <Workflow className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Automatización (RPA / Workflows)</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Optimización de tiempos operativos con n8n, integración de APIs/ERPs/CRMs y eliminación de tareas
                  manuales repetitivas.
                </p>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 pt-4 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Sincronización de Sistemas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Bots Operativos & Alertas
                </li>
              </ul>
            </div>

            <div className="glass-panel rounded-2xl p-6 hover:border-purple-500/50 transition-all group flex flex-col justify-between bg-[#0d1424]">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Inteligencia Virtual & IA</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Agentes conversacionales autónomos, chatbots avanzados para WhatsApp Cloud e integración de modelos LLM
                  y bases de conocimiento RAG.
                </p>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 pt-4 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Agentes RAG & Atención 24/7
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> WhatsApp Cloud Oficial
                </li>
              </ul>
            </div>

            <div className="glass-panel rounded-2xl p-6 hover:border-amber-500/50 transition-all group flex flex-col justify-between bg-[#0d1424]">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Desarrollo de Aplicaciones</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Soluciones móviles (iOS/Android) y aplicaciones de escritorio personalizadas de alto rendimiento con
                  sincronización en tiempo real.
                </p>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 pt-4 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Apps Móviles Multiplataforma
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Sistemas Desktop Seguros
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* D. PORTAFOLIO Y 3 CASOS DE ÉXITO REALES CON MÉTRICAS */}
      <section id="portafolio" className="py-20 bg-slate-950/60 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Evidencia de Impacto</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">Portafolio y Casos de Éxito</h2>
            </div>
            <p className="text-sm text-slate-400 max-w-md mt-2 md:mt-0">
              Soluciones desplegadas bajo el liderazgo de Edier Mery Gallego y la arquitectura de respaldo de EDMYSOFT.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Caso 1: Salud */}
            <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between bg-[#0d1424]">
              <div className="p-6">
                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20">
                    Agentes IA & WhatsApp
                  </span>
                  <span className="text-slate-400">Sector Salud / Clínicas</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Agente Virtual de Triaje y Agendamiento Médico</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  <strong className="text-slate-200">Problema:</strong> Saturación del call center con más de 600
                  mensajes diarios sin respuesta oportuna y alta tasa de inasistencia a citas especializadas.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">Python FastAPI</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">OpenAI API</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">WhatsApp Cloud</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">PostgreSQL</span>
                </div>
              </div>
              <div className="bg-slate-900/90 px-6 py-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Resultado Verificable:</span>
                  <span className="text-sm font-bold text-cyan-400">-78% tiempo de respuesta • +42% citas</span>
                </div>
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
            </div>

            {/* Caso 2: Logística */}
            <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between bg-[#0d1424]">
              <div className="p-6">
                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/20">
                    Plataforma Web SaaS
                  </span>
                  <span className="text-slate-400">Logística Nacional</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Sistema Centralizado de Despachos y Flotas</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  <strong className="text-slate-200">Problema:</strong> Trazabilidad dispersa en hojas de cálculo
                  manuales que generaban retrasos de facturación y pérdidas operativas de combustible.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">Next.js 16</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">Node.js</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">Tailwind CSS</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">AWS Cloud</span>
                </div>
              </div>
              <div className="bg-slate-900/90 px-6 py-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Resultado Verificable:</span>
                  <span className="text-sm font-bold text-cyan-400">Control en tiempo real de +180 vehículos</span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              </div>
            </div>

            {/* Caso 3: Finanzas */}
            <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between bg-[#0d1424]">
              <div className="p-6">
                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20">
                    Automatización RPA
                  </span>
                  <span className="text-slate-400">Finanzas & Contabilidad</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Conciliación Automática de Facturación DIAN & ERP</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  <strong className="text-slate-200">Problema:</strong> 4 analistas contables dedicaban 5 días al mes
                  cruzando facturas electrónicas XML manualmente contra el sistema contable corporativo.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">Python Workers</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">REST APIs</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">PostgreSQL</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">SendGrid</span>
                </div>
              </div>
              <div className="bg-slate-900/90 px-6 py-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Resultado Verificable:</span>
                  <span className="text-sm font-bold text-cyan-400">De 40 horas/mes a 15 minutos</span>
                </div>
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* E. CATÁLOGO ADMINISTRABLE DESDE BASE DE DATOS */}
      <section id="catalogo" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Catálogo Administrable</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Soluciones Tecnológicas con Precios Oficiales
          </h2>
          <p className="text-sm text-slate-400">
            Los precios se gestionan desde el panel administrativo y alimentan el cotizador determinista.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const lowestPlan = service.plans[0];
            return (
              <div
                key={service.id}
                className="glass-panel p-7 rounded-2xl flex flex-col justify-between border-white/5 bg-[#0f172a]/70 hover:border-cyan-500/30 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      {service.category === 'IA' && <Bot className="w-6 h-6" />}
                      {service.category === 'CHATBOTS' && <MessageSquare className="w-6 h-6" />}
                      {service.category === 'AUTOMATIZACION' && <Workflow className="w-6 h-6" />}
                      {service.category === 'DESARROLLO_WEB' && <Globe className="w-6 h-6" />}
                      {service.category === 'SOFTWARE_A_MEDIDA' && <Cpu className="w-6 h-6" />}
                      {!['IA', 'CHATBOTS', 'AUTOMATIZACION', 'DESARROLLO_WEB', 'SOFTWARE_A_MEDIDA'].includes(
                        service.category
                      )}
                    </div>
                    {service.badgeText && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {service.badgeText}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white">{service.name}</h3>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {service.shortDesc}
                    </p>
                  </div>

                  {lowestPlan && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[11px] text-slate-500 block uppercase font-semibold">
                        Inversión base desde
                      </span>
                      <span className="text-lg font-extrabold text-cyan-400">
                        {formatCOP(lowestPlan.setupPrice)}
                      </span>
                      {lowestPlan.recurringPrice > 0 && (
                        <span className="text-xs text-slate-400 block">
                          + {formatCOP(lowestPlan.recurringPrice)} / mes
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 flex items-center justify-between border-t border-white/5">
                  <Link
                    href={`/servicios/${service.slug}`}
                    className="text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                  >
                    Ver planes y alcance
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <a
                    href="#cotizador"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
                  >
                    Cotizar
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* F. WIZARD INTERACTIVO DE COTIZACIÓN A MEDIDA (4 PASOS) */}
      <QuotationWizard />

      {/* G. MONITOR EN VIVO Y DEMOSTRACIÓN DE ATENCIÓN */}
      <section className="py-20 bg-slate-950/60 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                Rigor Técnico y Transparencia
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Una plataforma real construida para durar, no una plantilla superficial
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Muchas empresas temen conectar automatizaciones porque los bots suelen inventar precios o responder
                incoherencias. En EDMYSOFT resolvemos esto con ingeniería rigurosa:
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Precios Oficiales y Deterministas</h4>
                    <p className="text-xs text-slate-400">
                      Las tarifas provienen exclusivamente de la base de datos oficial. La IA jamás calcula ni inventa importes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Snapshots Inmutables de Cotización</h4>
                    <p className="text-xs text-slate-400">
                      Cada presupuesto emitido queda congelado en JSON. Los cambios futuros del catálogo nunca alteran
                      compromisos ya pactados.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Transparencia en Costes de Terceros</h4>
                    <p className="text-xs text-slate-400">
                      Diferenciamos lo que cobramos por setup, lo que incluye tu mensualidad y los consumos directos de Meta u hosting.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Consola de Simulación EDMYSOFT Atiende */}
            <div className="glass-panel p-8 rounded-3xl border-white/10 bg-slate-900/60 shadow-2xl relative">
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200">EDMYSOFT Atiende — Monitor en Vivo</span>
                </div>
                <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Canal Oficial WhatsApp
                </span>
              </div>

              <div className="space-y-4 py-6 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 text-slate-300">
                  <span className="text-cyan-400 font-semibold">[Cliente]:</span> Hola, necesito automatizar la atención
                  comercial de mi negocio con WhatsApp. ¿Tienen planes con agendamiento?
                </div>
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-200">
                  <span className="text-emerald-400 font-semibold">[EDMYSOFT Atiende]:</span> ¡Hola! Sí, contamos con el
                  Plan Plus que incluye cotizador dinámico y agendamiento en Google Calendar por $3.800.000 COP de setup.
                  ¿Te gustaría agendar una demo comercial con Edier Gallego?
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 text-slate-300">
                  <span className="text-cyan-400 font-semibold">[Cliente]:</span> Perfecto, me interesa para mañana en la
                  tarde.
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Estado de la IA: Activa</span>
                <Link
                  href="/admin/conversaciones"
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold hover:bg-amber-500/20 transition-colors"
                >
                  Botón &quot;Tomar el Control&quot; en Admin →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* C. COTIZADOR Y CALCULADORA INTERACTIVA A MEDIDA */}
      <QuotationWizard />

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
