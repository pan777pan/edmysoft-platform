import prisma from '@/lib/prisma';
import { formatCOP } from '@/lib/formatters';
import { Repeat, ShieldCheck, AlertCircle, Info, ExternalLink } from 'lucide-react';


export default async function AdminRecurringCostsPage() {
  const recurringCosts = await prisma.quoteRecurringCost.findMany({
    include: {
      quote: {
        include: { contact: true },
      },
    },
    orderBy: { quote: { createdAt: 'desc' } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">9. Gestión de Costes Recurrentes</h1>
          <p className="text-xs text-slate-400 mt-1">
            Control estricto de los 3 modos de operación recurrente por proyecto y concepto.
          </p>
        </div>
      </div>

      {/* TARJETAS EXPLICATIVAS DE LOS 3 MODOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-slate-900/40 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Modo 1: Incluido
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Forma parte del paquete o de la mensualidad ya contratada con EDMYSOFT. Se presenta al cliente como <strong>$0 COP adicionales</strong>.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-slate-900/40 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            Modo 2: Cobrado por Separado
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Partida mensual facturada y cobrada directamente por EDMYSOFT como servicio administrado recurrente.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-slate-900/40 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Modo 3: Tercero Directo
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Gasto asumido por el cliente con el proveedor (ej: tarjeta directa en Meta Cloud o hosting). <strong>Nunca se suma al total a pagar a EDMYSOFT</strong>.
          </p>
        </div>
      </div>

      {/* REGISTRO DE COSTES ASIGNADOS */}
      <div className="glass-panel rounded-3xl border-white/5 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/5 text-xs font-bold text-white flex items-center justify-between">
          <span>Costes Recurrentes Registrados en Cotizaciones Activas</span>
          <span className="text-slate-400 font-normal">{recurringCosts.length} Conceptos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-6">Cotización / Cliente</th>
                <th className="py-3 px-6">Proveedor / Concepto</th>
                <th className="py-3 px-6">Modo Oficial</th>
                <th className="py-3 px-6">Precio Cliente</th>
                <th className="py-3 px-6">Volumen Estimado</th>
                <th className="py-3 px-6">Notas y Supuestos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recurringCosts.map((rc) => (
                <tr key={rc.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-6">
                    <span className="font-bold text-white block">{rc.quote.quoteNumber}</span>
                    <span className="text-[11px] text-slate-400">{rc.quote.contact.fullName}</span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="font-semibold text-slate-200 block">{rc.conceptName}</span>
                    <span className="text-[10px] text-cyan-400">{rc.providerName}</span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rc.mode === 'INCLUDED'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : rc.mode === 'BILLED_SEPARATELY'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {rc.mode}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-extrabold text-white">
                    {rc.mode === 'INCLUDED' ? '$ 0 COP (Incluido)' : formatCOP(rc.clientPrice)}
                  </td>
                  <td className="py-3.5 px-6 text-slate-300 text-[11px]">
                    {rc.estimatedVolume || 'Consumo estándar'}
                  </td>
                  <td className="py-3.5 px-6 text-slate-400 text-[11px] max-w-xs">
                    {rc.notes || 'Facturado directamente por el proveedor.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
