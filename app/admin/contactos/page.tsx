import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatCOP, formatDateCO } from '@/lib/formatters';
import { Users, Phone, Mail, Building, PlusCircle, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';


export default async function ContactsCRMPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      opportunities: {
        orderBy: { createdAt: 'desc' },
      },
      quotes: {
        orderBy: { createdAt: 'desc' },
      },
      conversations: {
        orderBy: { lastMessageAt: 'desc' },
        take: 1,
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">3. Contactos y CRM</h1>
          <p className="text-xs text-slate-400 mt-1">
            Expediente unificado de clientes, canales de procedencia, necesidades registradas y propuestas.
          </p>
        </div>

        <Link
          href="/admin/cotizaciones/nueva"
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva Cotización a Contacto
        </Link>
      </div>

      {/* TABLA DE CONTACTOS */}
      <div className="glass-panel rounded-3xl border-white/5 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Contacto / Empresa</th>
                <th className="py-3.5 px-6">Canal / Teléfono</th>
                <th className="py-3.5 px-6">Oportunidad Activa</th>
                <th className="py-3.5 px-6">Etapa CRM</th>
                <th className="py-3.5 px-6">Cotizaciones</th>
                <th className="py-3.5 px-6">Fecha Alta</th>
                <th className="py-3.5 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {contacts.map((contact) => {
                const latestOpp = contact.opportunities[0];
                const latestQuote = contact.quotes[0];

                return (
                  <tr key={contact.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white text-sm">{contact.fullName}</div>
                      {contact.companyName && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-500" />
                          <span>{contact.companyName}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{contact.phone || 'Sin número'}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-950 text-slate-400 border border-slate-800 inline-block">
                        {contact.preferredChannel}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      {latestOpp ? (
                        <div>
                          <span className="font-semibold text-slate-200 block">{latestOpp.title}</span>
                          <span className="text-[11px] text-slate-400">
                            Valor: {formatCOP(latestOpp.estimatedValue)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Sin oportunidad</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      {latestOpp ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {latestOpp.stage}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      {latestQuote ? (
                        <div>
                          <span className="font-bold text-white block">{latestQuote.quoteNumber}</span>
                          <span className="text-[11px] text-emerald-400 font-semibold">
                            {formatCOP(latestQuote.setupTotal)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Sin cotizar</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-slate-400 text-[11px]">
                      {formatDateCO(contact.createdAt)}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <Link
                        href="/admin/conversaciones"
                        className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 transition-colors inline-flex items-center gap-1"
                        title="Abrir chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
