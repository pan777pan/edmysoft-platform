'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Bot,
  UserCheck,
  Send,
  Phone,
  Building,
  Calendar,
  FileText,
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCheck,
  Power,
  ShieldAlert,
} from 'lucide-react';
import { formatCOP, formatDateTimeCO } from '@/lib/formatters';

interface ConversationData {
  id: string;
  channel: string;
  status: 'AI_HANDLING' | 'HUMAN_CONTROL' | 'CLOSED';
  lastMessageAt: string;
  contact: {
    id: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    companyName: string | null;
    opportunities: {
      id: string;
      title: string;
      stage: string;
      estimatedValue: number | null;
    }[];
    quotes: {
      id: string;
      quoteNumber: string;
      status: string;
      setupTotal: number;
    }[];
  };
  messages: {
    id: string;
    senderType: 'CLIENT' | 'AI' | 'HUMAN' | 'SYSTEM';
    senderName: string | null;
    content: string;
    createdAt: string;
  }[];
  aiLogs: {
    id: string;
    modelUsed: string;
    aiDecision: string | null;
    createdAt: string;
  }[];
}

export default function ConversationsInboxPage() {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [testClientText, setTestClientText] = useState('');

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
        if (!selectedId && data.conversations.length > 0) {
          setSelectedId(data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 8000);
    return () => clearInterval(interval);
  }, []);

  const selectedConv = conversations.find((c) => c.id === selectedId);

  // Toggle Human Takeover / Return to AI
  const handleToggleTakeover = async () => {
    if (!selectedConv) return;
    setActionLoading(true);
    const nextAction = selectedConv.status === 'AI_HANDLING' ? 'TAKE_CONTROL' : 'RETURN_TO_AI';

    try {
      await fetch(`/api/conversations/${selectedConv.id}/takeover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: nextAction,
          userId: 'admin_edier',
          userName: 'Edier (Dirección)',
        }),
      });
      await fetchConversations();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Enviar mensaje humano
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !replyText.trim()) return;

    try {
      await fetch(`/api/conversations/${selectedConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyText,
          senderType: 'HUMAN',
          senderName: 'Edier (Asesor)',
        }),
      });
      setReplyText('');
      await fetchConversations();
    } catch (e) {
      console.error(e);
    }
  };

  // Simular mensaje entrante del cliente para probar la IA
  const handleSimulateClientMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !testClientText.trim()) return;

    try {
      await fetch(`/api/conversations/${selectedConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: testClientText,
          senderType: 'CLIENT',
          senderName: selectedConv.contact.fullName,
        }),
      });
      setTestClientText('');
      await fetchConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = conversations.filter((c) => {
    const matchSearch =
      c.contact.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (c.contact.phone && c.contact.phone.includes(search));
    const matchChannel = channelFilter === 'ALL' || c.channel === channelFilter;
    return matchSearch && matchChannel;
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Título y filtro superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">2. Bandeja de Conversaciones</h1>
          <p className="text-xs text-slate-400">
            Control omnicanal en tiempo real con alternancia instantánea entre Asistente IA y Asesor Humano.
          </p>
        </div>

        <button
          onClick={fetchConversations}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar Bandeja
        </button>
      </div>

      {/* CONTENEDOR SPLIT: LISTA | CHAT | DETALLE CRM */}
      <div className="flex-1 glass-panel rounded-3xl border-white/5 bg-[#090d16]/90 overflow-hidden flex flex-col lg:flex-row min-h-0">
        {/* COLUMNA 1: LISTA DE CHATS */}
        <div className="w-full lg:w-80 border-r border-white/5 flex flex-col shrink-0">
          <div className="p-3.5 border-b border-white/5 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente o número..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              {['ALL', 'WHATSAPP', 'WEB_FORM'].map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    channelFilter === ch
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white bg-slate-900/50'
                  }`}
                >
                  {ch === 'ALL' ? 'Todos' : ch}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500">Cargando conversaciones...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">No hay conversaciones con ese filtro.</div>
            ) : (
              filtered.map((conv) => {
                const isSelected = conv.id === selectedId;
                const lastMsg = conv.messages[conv.messages.length - 1];
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-950/30 border-l-2 border-cyan-400' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate max-w-[140px]">
                        {conv.contact.fullName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatDateTimeCO(conv.lastMessageAt).split(',')[1] || ''}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate">
                      {lastMsg ? lastMsg.content : 'Sin mensajes'}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
                        {conv.channel}
                      </span>
                      {conv.status === 'HUMAN_CONTROL' ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Control Humano
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                          <Bot className="w-2.5 h-2.5" />
                          IA Activa
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA 2: CHAT ACTIVO Y BOTÓN TOMAR EL CONTROL */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#070a0f]/60">
          {selectedConv ? (
            <>
              {/* Barra superior de la conversación seleccionada */}
              <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 bg-[#090d16]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                    {selectedConv.contact.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {selectedConv.contact.fullName}
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({selectedConv.contact.phone || 'Sin número'})
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Canal: {selectedConv.channel}</span>
                      <span>•</span>
                      <span>
                        Estado:{' '}
                        <strong className={selectedConv.status === 'HUMAN_CONTROL' ? 'text-amber-400' : 'text-cyan-400'}>
                          {selectedConv.status === 'HUMAN_CONTROL' ? 'Asesor Humano' : 'EDMYSOFT Atiende (IA)'}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOTÓN VITAL: TOMAR EL CONTROL / DEVOLVER AL ASISTENTE */}
                <div>
                  {selectedConv.status === 'AI_HANDLING' ? (
                    <button
                      onClick={handleToggleTakeover}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                      Tomar el Control Manual
                    </button>
                  ) : (
                    <button
                      onClick={handleToggleTakeover}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                      Devolver al Asistente IA
                    </button>
                  )}
                </div>
              </div>

              {/* Mensajes del Chat */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
                {selectedConv.messages.map((m) => {
                  if (m.senderType === 'SYSTEM') {
                    return (
                      <div key={m.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 text-center max-w-md mx-auto">
                        {m.content}
                      </div>
                    );
                  }

                  const isMe = m.senderType === 'HUMAN' || m.senderType === 'AI';
                  const isAi = m.senderType === 'AI';

                  return (
                    <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500">
                        <span>{m.senderName || m.senderType}</span>
                        {isAi && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold">
                            IA
                          </span>
                        )}
                        <span>{formatDateTimeCO(m.createdAt).split(',')[1]}</span>
                      </div>

                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? isAi
                              ? 'bg-cyan-950/40 text-cyan-100 border border-cyan-500/25 rounded-tr-none'
                              : 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-900 text-slate-200 border border-white/5 rounded-tl-none'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* BARRA DE COMPOSICIÓN DE RESPUESTAS */}
              <div className="p-3 border-t border-white/5 bg-[#090d16] space-y-2">
                {/* Formulario de Respuesta Humana */}
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribir respuesta como Asesor Humano..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar
                  </button>
                </form>

                {/* Simulador rápido de mensaje entrante de prueba */}
                <form onSubmit={handleSimulateClientMessage} className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">Simular cliente:</span>
                  <input
                    type="text"
                    value={testClientText}
                    onChange={(e) => setTestClientText(e.target.value)}
                    placeholder="Ej: ¿Cuánto cuesta el plan Plus y cuándo podemos agendar?"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-700"
                  />
                  <button
                    type="submit"
                    disabled={!testClientText.trim()}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                  >
                    Probar Respuesta IA
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
              Selecciona una conversación de la lista.
            </div>
          )}
        </div>

        {/* COLUMNA 3: EXPEDIENTE CRM VINCULADO */}
        {selectedConv && (
          <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-white/5 p-4 space-y-5 overflow-y-auto bg-[#090d16] shrink-0 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Ficha del Contacto
              </span>
              <div className="space-y-1.5">
                <span className="font-bold text-white block text-sm">{selectedConv.contact.fullName}</span>
                {selectedConv.contact.companyName && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedConv.contact.companyName}</span>
                  </div>
                )}
                {selectedConv.contact.phone && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedConv.contact.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Oportunidad Relacionada */}
            <div className="pt-3 border-t border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Oportunidad Comercial
              </span>
              {selectedConv.contact.opportunities.length > 0 ? (
                selectedConv.contact.opportunities.map((opp) => (
                  <div key={opp.id} className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                    <span className="font-bold text-white block">{opp.title}</span>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-cyan-400 font-semibold">{opp.stage}</span>
                      <span className="text-slate-300 font-extrabold">{formatCOP(opp.estimatedValue)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-slate-500 text-[11px]">Sin oportunidad registrada.</span>
              )}
            </div>

            {/* Cotizaciones Vinculadas */}
            <div className="pt-3 border-t border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Cotizaciones Emitidas
              </span>
              {selectedConv.contact.quotes.length > 0 ? (
                selectedConv.contact.quotes.map((q) => (
                  <div key={q.id} className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{q.quoteNumber}</span>
                      <span className="text-[10px] font-bold text-emerald-400">{q.status}</span>
                    </div>
                    <span className="text-sm font-extrabold text-cyan-400 block">{formatCOP(q.setupTotal)}</span>
                  </div>
                ))
              ) : (
                <span className="text-slate-500 text-[11px]">No registra cotizaciones previas.</span>
              )}
            </div>

            {/* Log de decisiones de la IA */}
            <div className="pt-3 border-t border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Auditoría IA (Últimas Decisiones)
              </span>
              <div className="space-y-2">
                {selectedConv.aiLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-950 border border-white/5 text-[10px] text-slate-400 space-y-1">
                    <span className="text-cyan-400 font-semibold block">{log.modelUsed}</span>
                    <p>{log.aiDecision}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
