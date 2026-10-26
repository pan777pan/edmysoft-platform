'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  PlusCircle,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Eye,
  ShieldAlert,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { formatCOP, formatDateCO } from '@/lib/formatters';

interface QuoteRecord {
  id: string;
  quoteNumber: string;
  type: string;
  status: string;
  setupTotal: number;
  recurringTotal: number;
  clientDirectTotal: number;
  depositRequired: number;
  depositPaid: number;
  balanceDue: number;
  validUntil: string;
  createdAt: string;
  requiresApproval: boolean;
  approvalReason: string | null;
  contact: {
    fullName: string;
    companyName: string | null;
    phone: string | null;
  };
  items: {
    id: string;
    conceptName: string;
    setupPrice: number;
    recurringPrice: number;
    isIncludedInPlan: boolean;
  }[];
  recurringCosts: {
    id: string;
    providerName: string;
    conceptName: string;
    mode: string;
    clientPrice: number;
  }[];
}

export default function QuotesListPage() {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRecord | null>(null);

  const fetchQuotes = async () => {
    try {
      const res = await fetch('/api/quotes');
      const data = await res.json();
      if (data.success) {
        setQuotes(data.quotes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleApprove = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setApprovingId(id);
    try {
      await fetch(`/api/quotes/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          approvedById: 'admin_edier',
        }),
      });
      await fetchQuotes();
      if (selectedQuote && selectedQuote.id === id) {
        setSelectedQuote(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">5. Registro Oficial de Cotizaciones</h1>
          <p className="text-xs text-slate-400 mt-1">
            Propuestas emitidas con inmutabilidad de precios, flujo de aprobación humana y desglose de costes recurrentes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchQuotes}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
          <Link
            href="/admin/cotizaciones/nueva"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center gap-2 shadow-md shadow-cyan-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva Cotización
          </Link>
        </div>
      </div>

      {/* TABLA PRINCIPAL DE COTIZACIONES */}
      <div className="glass-panel rounded-3xl border-white/5 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Código / Fecha</th>
                <th className="py-3.5 px-6">Cliente / Empresa</th>
                <th className="py-3.5 px-6">Tipo / Estado</th>
                <th className="py-3.5 px-6">Inversión Setup</th>
                <th className="py-3.5 px-6">Recurrente Mensual</th>
                <th className="py-3.5 px-6">Anticipo / Saldo</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    Cargando cotizaciones...
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    No hay cotizaciones registradas aún.
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => {
                  return (
                    <tr key={quote.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-bold text-white text-sm block">{quote.quoteNumber}</span>
                        <span className="text-[11px] text-slate-500">{formatDateCO(quote.createdAt)}</span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-200">{quote.contact.fullName}</div>
                        {quote.contact.companyName && (
                          <div className="text-[11px] text-slate-400">{quote.contact.companyName}</div>
                        )}
                      </td>

                      <td className="py-4 px-6 space-y-1">
                        <div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              quote.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : quote.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : quote.status === 'SENT'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {quote.status}
                          </span>
                        </div>
                        {quote.requiresApproval && (
                          <span className="text-[9px] text-amber-400 block font-semibold">Requiere visto bueno</span>
                        )}
                      </td>

                      <td className="py-4 px-6 font-extrabold text-cyan-400 text-sm">
                        {formatCOP(quote.setupTotal)}
                      </td>

                      <td className="py-4 px-6 text-slate-300">
                        {quote.recurringTotal > 0 ? (
                          <div>
                            <span className="font-bold text-white block">{formatCOP(quote.recurringTotal)} / mes</span>
                            <span className="text-[10px] text-slate-500">EDMYSOFT</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">$0 / mes</span>
                        )}
                        {quote.clientDirectTotal > 0 && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            + {formatCOP(quote.clientDirectTotal)} (Terceros)
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">Abono:</span>
                          <span className="font-bold text-emerald-400">{formatCOP(quote.depositPaid)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400">Saldo:</span>
                          <span className="font-bold text-amber-400">{formatCOP(quote.balanceDue)}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        {quote.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleApprove(quote.id, 'APPROVE')}
                              disabled={approvingId === quote.id}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300"
                              title="Aprobar Cotización"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleApprove(quote.id, 'REJECT')}
                              disabled={approvingId === quote.id}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20"
                              title="Rechazar"
                            >
                              Rechazar
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 inline-block"
                          title="Ver detalle del snapshot"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL / VISOR DEL SNAPSHOT DE COTIZACIÓN */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl bg-[#090d16] border-white/10 rounded-3xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Cotización {selectedQuote.quoteNumber}
                </h3>
                <span className="text-xs text-slate-400">
                  Emitida para {selectedQuote.contact.fullName} • Válida hasta {formatDateCO(selectedQuote.validUntil)}
                </span>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="text-slate-400 hover:text-white text-xs px-3 py-1 rounded-lg bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            {/* Partidas de Implementación */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Partidas e Ítems de Implementación
              </h4>
              <div className="space-y-2">
                {selectedQuote.items.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{item.conceptName}</span>
                      {item.isIncludedInPlan && (
                        <span className="ml-2 text-[10px] text-cyan-400 font-semibold">[INCLUIDO EN PLAN]</span>
                      )}
                    </div>
                    <span className="font-extrabold text-cyan-400">{formatCOP(item.setupPrice)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Costes Recurrentes Clasificados */}
            {selectedQuote.recurringCosts.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Costes Recurrentes Asociados (Tratamiento Oficial)
                </h4>
                <div className="space-y-2">
                  {selectedQuote.recurringCosts.map((rc) => (
                    <div key={rc.id} className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{rc.conceptName}</span>
                        <span className="text-[10px] text-slate-400 block">{rc.providerName} • Modo: {rc.mode}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">
                          {rc.mode === 'INCLUDED' ? '$ 0 COP (Incluido)' : formatCOP(rc.clientPrice)}
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          {rc.mode === 'CLIENT_DIRECT' ? 'Pago directo a terceros' : 'Facturado por EDMYSOFT'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resumen Financiero de la Cotización */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/20 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Inversión Total de Implementación:</span>
                <span className="font-extrabold text-cyan-400 text-sm">{formatCOP(selectedQuote.setupTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Anticipo pactado / recibido:</span>
                <span className="font-bold text-emerald-400">{formatCOP(selectedQuote.depositPaid)}</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-white/5">
                <span className="font-semibold text-white">Saldo Pendiente contra entrega:</span>
                <span className="font-extrabold text-amber-400 text-sm">{formatCOP(selectedQuote.balanceDue)}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedQuote(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
