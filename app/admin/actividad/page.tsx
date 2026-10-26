import prisma from '@/lib/prisma';
import { formatDateTimeCO } from '@/lib/formatters';
import { Activity, ShieldCheck, UserCheck, FileText, Bot } from 'lucide-react';


export default async function ActivityAuditPage() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">13. Actividad y Auditoría Oficial</h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro inmutable de acciones críticas: emisiones de cotizaciones, aprobaciones humanas y cambios en el sistema.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border-white/5 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-6">Fecha / Hora (Bogotá)</th>
                <th className="py-3 px-6">Acción Registrada</th>
                <th className="py-3 px-6">Entidad / ID</th>
                <th className="py-3 px-6">Responsable</th>
                <th className="py-3 px-6">Detalles Técnicos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-500">
                    No hay registros de auditoría aún.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-400">
                      {formatDateTimeCO(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-white text-[11px]">
                      {log.entityType} ({log.entityId.slice(0, 10)}...)
                    </td>
                    <td className="py-3.5 px-6 text-slate-300">
                      {log.user?.name || 'Sistema / API Webhook'}
                    </td>
                    <td className="py-3.5 px-6 text-slate-400 font-mono text-[10px] max-w-xs truncate">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
