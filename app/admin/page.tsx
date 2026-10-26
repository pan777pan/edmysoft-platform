import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatCOP, formatDateCO } from '@/lib/formatters';
import {
  Users,
  Kanban,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';


export default async function AdminDashboardPage() {
  // Consultas agregadas directas a la base de datos
  const totalContacts = await prisma.contact.count();
  const opportunities = await prisma.opportunity.findMany({
    include: { contact: true },
  });

  const quotes = await prisma.quote.findMany({
    include: { contact: true },
    orderBy: { createdAt: 'desc' },
  });

  const payments = await prisma.paymentTransaction.findMany();

  // Cálculos de KPIs reales
  const stageCounts: Record<string, number> = {};
  let totalPipelineValue = 0;

  for (const opp of opportunities) {
    stageCounts[opp.stage] = (stageCounts[opp.stage] || 0) + 1;
    if (opp.estimatedValue) {
      totalPipelineValue += opp.estimatedValue;
    }
  }

  // Métricas financieras
  let totalApprovedQuotesValue = 0;
  let totalDepositsPaid = 0;
  let totalBalanceDue = 0;
  let pendingApprovalQuotes = 0;
  let inPrepQuotes = 0;
  let sentQuotes = 0;

  for (const q of quotes) {
    if (q.status === 'APPROVED' || q.status === 'ACCEPTED') {
      totalApprovedQuotesValue += q.setupTotal;
    }
    if (q.status === 'PENDING_APPROVAL') {
      pendingApprovalQuotes++;
    }
    if (q.status === 'DRAFT') {
      inPrepQuotes++;
    }
    if (q.status === 'SENT') {
      sentQuotes++;
    }
    totalDepositsPaid += q.depositPaid;
    totalBalanceDue += q.balanceDue;
  }

  // Tareas de seguimiento pendientes
  const pendingTasks = await prisma.taskReminder.findMany({
    where: { isCompleted: false },
    include: { opportunity: { include: { contact: true } } },
    orderBy: { dueAt: 'asc' },
    take: 5,
  });

  return (
    <div className="space-y-8">
      {/* CABECERA CON ACCIONES RÁPIDAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">1. Resumen Comercial</h1>
          <p className="text-xs text-slate-400 mt-1">
            Indicadores financieros y comerciales calculados en tiempo real desde la base de datos oficial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/cotizaciones/nueva"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center gap-2 shadow-md shadow-cyan-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva Cotización
          </Link>
          <Link
            href="/admin/conversaciones"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            Bandeja WhatsApp
          </Link>
        </div>
      </div>

      {/* ALERTA DE VISTO BUENO SI HAY COTIZACIONES PENDIENTES */}
      {pendingApprovalQuotes > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-white block">
                {pendingApprovalQuotes} {pendingApprovalQuotes === 1 ? 'Cotización requiere' : 'Cotizaciones requieren'} Aprobación Humana
              </span>
              <span className="text-slate-400">
                Propuestas con descuentos o partidas personalizadas pendientes de visto bueno antes de su envío.
              </span>
            </div>
          </div>
          <Link
            href="/admin/cotizaciones"
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shrink-0"
          >
            Revisar
          </Link>
        </div>
      )}

      {/* TARJETAS DE KPIs FINANCIEROS Y COMERCIALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Valor Pipeline */}
        <div className="glass-panel p-5 rounded-2xl border-white/5 bg-slate-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Oportunidades Potenciales</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{formatCOP(totalPipelineValue)}</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>{opportunities.length} Oportunidades activas</span>
            <span className="text-cyan-400">{totalContacts} Contactos</span>
          </div>
        </div>

        {/* KPI 2: Propuestas Aprobadas */}
        <div className="glass-panel p-5 rounded-2xl border-white/5 bg-slate-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Propuestas Aprobadas</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{formatCOP(totalApprovedQuotesValue)}</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Ventas pactadas</span>
            <span className="text-emerald-400">{quotes.filter((q) => q.status === 'APPROVED' || q.status === 'ACCEPTED').length} Emitidas</span>
          </div>
        </div>

        {/* KPI 3: Anticipos y Abonos Recibidos */}
        <div className="glass-panel p-5 rounded-2xl border-white/5 bg-slate-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Anticipos Recibidos</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-300">{formatCOP(totalDepositsPaid)}</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Ingresos bancarios confirmados</span>
            <span className="text-indigo-400">{payments.length} Pagos</span>
          </div>
        </div>

        {/* KPI 4: Saldos por Cobrar */}
        <div className="glass-panel p-5 rounded-2xl border-white/5 bg-slate-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Saldos Pendientes</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{formatCOP(totalBalanceDue)}</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Contra entrega pactada</span>
            <span className="text-slate-400">Por cobrar</span>
          </div>
        </div>
      </div>

      {/* PIPELINE POR ETAPAS COMERCIALES */}
      <div className="glass-panel p-6 rounded-3xl border-white/5 bg-slate-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Kanban className="w-4 h-4 text-cyan-400" />
            Embudo de Ventas Oficial (7 Etapas)
          </h3>
          <Link href="/admin/oportunidades" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
            Ver Tablero Kanban
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { key: 'NUEVO', label: 'Nuevo', color: 'border-slate-700 bg-slate-900/60 text-slate-300' },
            { key: 'EN_DIAGNOSTICO', label: 'En Diagnóstico', color: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300' },
            { key: 'CALIFICADO', label: 'Calificado', color: 'border-indigo-500/30 bg-indigo-950/20 text-indigo-300' },
            { key: 'COTIZACION_EN_PREPARACION', label: 'Cotización', color: 'border-purple-500/30 bg-purple-950/20 text-purple-300' },
            { key: 'PENDIENTE_APROBACION', label: 'Por Aprobar', color: 'border-amber-500/30 bg-amber-950/20 text-amber-300' },
            { key: 'ENVIADA', label: 'Enviada', color: 'border-blue-500/30 bg-blue-950/20 text-blue-300' },
            { key: 'GANADA', label: 'Ganada', color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300' },
          ].map((st) => (
            <div key={st.key} className={`p-3.5 rounded-xl border text-center ${st.color}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">{st.label}</span>
              <span className="text-xl font-extrabold mt-1 block">{stageCounts[st.key] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN DOBLE: TAREAS DE SEGUIMIENTO + ÚLTIMAS COTIZACIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tareas que necesitan seguimiento */}
        <div className="glass-panel p-6 rounded-3xl border-white/5 bg-slate-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Prospectos que Requieren Seguimiento
            </h3>
            <span className="text-[11px] text-slate-400">{pendingTasks.length} Tareas</span>
          </div>

          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No hay tareas de seguimiento pendientes.</p>
            ) : (
              pendingTasks.map((t) => (
                <div key={t.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{t.title}</span>
                    <span className="text-[11px] text-slate-400">
                      Contacto: {t.opportunity.contact.fullName} ({t.opportunity.contact.phone || 'Sin tel.'})
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-cyan-500/10 text-cyan-400">
                    {formatDateCO(t.dueAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Últimas Cotizaciones */}
        <div className="glass-panel p-6 rounded-3xl border-white/5 bg-slate-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Últimas Cotizaciones Oficiales
            </h3>
            <Link href="/admin/cotizaciones" className="text-xs text-cyan-400 hover:underline">
              Ver Todas
            </Link>
          </div>

          <div className="space-y-3">
            {quotes.slice(0, 5).map((q) => (
              <div key={q.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{q.quoteNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        q.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : q.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {q.contact.fullName} • {formatDateCO(q.createdAt)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-cyan-400 block">{formatCOP(q.setupTotal)}</span>
                  <span className="text-[10px] text-slate-500">Saldo: {formatCOP(q.balanceDue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
