'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Phone,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import ChatText from './ChatText';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatFullPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '¡Hola! 👋 Soy el Asesor Comercial y Consultor de IA de **EDMYSOFT**.\n\nTe ayudo a cotizar soluciones para tu empresa, ver cómo la IA y n8n automatizan tu atención en WhatsApp o agendar una videollamada diagnóstica gratuita con nuestro Director Técnico **Edier Mery Gallego**.\n\n¿Qué tipo de negocio tienes o qué proceso te gustaría automatizar hoy?',
    },
  ]);
  const [chips, setChips] = useState<string[]>([
    '💰 ¿Cuánto cuesta el Agente de IA?',
    '⚡ ¿Cómo conectar mi WhatsApp?',
    '📅 Agendar videollamada con Edier',
    '🏢 Tengo una inmobiliaria',
    '🏥 Tengo una clínica o consultorio',
    '🛍️ Tengo una tienda online',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          '¡Hola! 👋 Soy el Asesor Comercial y Consultor de IA de **EDMYSOFT**.\n\nTe ayudo a cotizar soluciones para tu empresa, ver cómo la IA y n8n automatizan tu atención en WhatsApp o agendar una videollamada diagnóstica gratuita con nuestro Director Técnico **Edier Mery Gallego**.\n\n¿Qué tipo de negocio tienes o qué proceso te gustaría automatizar hoy?',
      },
    ]);
    setChips([
      '💰 ¿Cuánto cuesta el Agente de IA?',
      '⚡ ¿Cómo conectar mi WhatsApp?',
      '📅 Agendar videollamada con Edier',
      '🏢 Tengo una inmobiliaria',
      '🏥 Tengo una clínica o consultorio',
      '🛍️ Tengo una tienda online',
    ]);
    setInput('');
    setLoading(false);
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setChips([]);

    let clientSessionId = '';
    let senderName = 'Visitante Web';
    try {
      clientSessionId = localStorage.getItem('edmysoft_client_uuid_v1') || '';
      if (!clientSessionId) {
        clientSessionId = 'cli_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('edmysoft_client_uuid_v1', clientSessionId);
      }
      const storedUser = localStorage.getItem('edmysoft_session_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u?.name) senderName = u.name;
      }
    } catch {}

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          clientSessionId: clientSessionId || undefined,
          senderName,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (data.success && data.reply) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
        setChips(Array.isArray(data.suggestions) ? data.suggestions : []);
      } else {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content:
              data.reply ||
              'No pude procesar tu mensaje en este instante. Comunícate por WhatsApp al **+57 323 416 6354** para atenderte de inmediato.',
          },
        ]);
      }
    } catch {
      clearTimeout(timeoutId);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            'Nuestros asesores están disponibles en este momento. Puedes contactar a Edier Gallego al **+57 323 416 6354**.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl border border-white/10 bg-[#0d1424] shadow-2xl overflow-hidden flex flex-col h-[650px]">
      {/* Barra de Estado Superior */}
      <div className="p-4 border-b border-white/10 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">EDMYSOFT Atiende</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Asesor comercial IA
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Respuestas fundamentadas en el catálogo oficial de EDMYSOFT
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleResetChat}
            title="Reiniciar chat"
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/5 border border-white/5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <a
            href="https://wa.me/573234166354"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-medium flex items-center gap-1.5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Hablar con Edier</span>
          </a>
        </div>
      </div>

      {/* Historial de Mensajes */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed">
        {messages.map((m, idx) => {
          const isAssistant = m.role === 'assistant';
          return (
            <div
              key={idx}
              className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 space-y-1.5 ${
                  isAssistant
                    ? 'bg-slate-900/90 border border-white/10 text-slate-200'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-medium'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  <ChatText text={m.content} />
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3 text-xs text-cyan-300 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Escribiendo...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sugerencias dinámicas propuestas por el agente */}
      {chips.length > 0 && !loading && (
        <div className="px-6 py-2.5 border-t border-white/5 bg-slate-950/70 flex gap-2 overflow-x-auto text-xs">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSend(chip)}
              className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/20 shrink-0 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 border-t border-white/10 bg-slate-900/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribe tu consulta sobre desarrollo, IA, cotizaciones o agenda..."
            className="flex-1 rounded-xl bg-slate-950 border border-white/15 px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-300 hover:scale-105 disabled:opacity-50 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            {loading ? (
              <>
                <span>Enviando...</span>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              </>
            ) : (
              <>
                <span>Enviar</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
