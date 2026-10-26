'use client';

import { useState, useEffect } from 'react';
import { Kanban, PlusCircle, ArrowRight, Phone, Building, RefreshCw, Loader2 } from 'lucide-react';
import { formatCOP } from '@/lib/formatters';

const STAGES = [
  { key: 'NUEVO', label: '1. Nuevo', color: 'border-slate-700 bg-slate-900/50' },
  { key: 'EN_DIAGNOSTICO', label: '2. En Diagnóstico', color: 'border-cyan-500/30 bg-cyan-950/20' },
  { key: 'CALIFICADO', label: '3. Calificado', color: 'border-indigo-500/30 bg-indigo-950/20' },
  { key: 'COTIZACION_EN_PREPARACION', label: '4. Cotización en Prep.', color: 'border-purple-500/30 bg-purple-950/20' },
  { key: 'PENDIENTE_APROBACION', label: '5. Pend. Aprobación', color: 'border-amber-500/30 bg-amber-950/20' },
  { key: 'ENVIADA', label: '6. Propuesta Enviada', color: 'border-blue-500/30 bg-blue-950/20' },
  { key: 'GANADA', label: '7. Ganada / Cerrada', color: 'border-emerald-500/30 bg-emerald-950/20' },
];

interface OpportunityItem {
  id: string;
  title: string;
  stage: string;
  serviceInterest: string | null;
  identifiedNeed: string | null;
  estimatedValue: number | null;
  contact: {
    fullName: string;
    phone: string | null;
    companyName: string | null;
  };
}

export default function OpportunitiesKanbanPage() {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOpportunities = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.success) {
        const list: OpportunityItem[] = [];
        data.conversations.forEach((conv: any) => {
          conv.contact.opportunities.forEach((opp: any) => {
            list.push({
              ...opp,
              contact: {
                fullName: conv.contact.fullName,
                phone: conv.contact.phone,
                companyName: conv.contact.companyName,
              },
            });
          });
        });
        setOpportunities(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">4. Oportunidades de Venta</h1>
          <p className="text-xs text-slate-400 mt-1">
            Tablero Kanban de seguimiento por etapas oficiales desde el diagnóstico inicial hasta el cierre comercial.
          </p>
        </div>

        <button
          onClick={fetchOpportunities}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar Tablero
        </button>
      </div>

      {/* TABLERO KANBAN DE 7 COLUMNAS */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {STAGES.map((stage) => {
          const items = opportunities.filter((o) => o.stage === stage.key);
          const stageTotal = items.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);

          return (
            <div
              key={stage.key}
              className={`w-72 shrink-0 rounded-2xl border p-4 flex flex-col justify-between ${stage.color}`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{stage.label}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900 text-cyan-400 border border-slate-800">
                    {items.length}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 mb-4">
                  Total etapa: <strong className="text-white">{formatCOP(stageTotal)}</strong>
                </div>

                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-600 border border-dashed border-white/5 rounded-xl">
                      Sin oportunidades
                    </div>
                  ) : (
                    items.map((opp) => (
                      <div
                        key={opp.id}
                        className="p-4 rounded-xl glass-panel bg-slate-950/80 border-white/10 hover:border-cyan-500/40 transition-colors shadow-md space-y-2.5"
                      >
                        <h4 className="text-xs font-bold text-white leading-snug">{opp.title}</h4>

                        <div className="text-[11px] text-slate-400 space-y-1">
                          <span className="font-semibold text-slate-300 block">{opp.contact.fullName}</span>
                          {opp.contact.companyName && (
                            <span className="block text-slate-500">{opp.contact.companyName}</span>
                          )}
                        </div>

                        {opp.serviceInterest && (
                          <span className="inline-block px-2 py-0.5 rounded text-[9px] font-semibold bg-slate-900 text-cyan-400 border border-slate-800">
                            {opp.serviceInterest}
                          </span>
                        )}

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                          <span className="text-[10px] text-slate-500">Valor estimado:</span>
                          <span className="font-extrabold text-cyan-400">{formatCOP(opp.estimatedValue)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
