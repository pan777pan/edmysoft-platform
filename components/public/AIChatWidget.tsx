'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Calendar,
  Phone,
  ArrowRight,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import ChatText from './ChatText';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME: Message = {
  role: 'assistant',
  content:
    '¡Hola! 👋 Soy el Asesor Comercial y Consultor de IA de **EDMYSOFT**.\n\nTe ayudo a cotizar soluciones para tu negocio, ver cómo la IA y n8n automatizan tu atención en WhatsApp o agendar una videollamada diagnóstica gratuita con nuestro Director Técnico **Edier Mery Gallego**.\n\n¿Qué tipo de negocio tienes o qué proceso te gustaría automatizar?',
};
const STORAGE_KEY = 'edmysoft_chat_session_v4';
const CLIENT_ID_KEY = 'edmysoft_client_uuid_v1';
const DEFAULT_CHIPS = [
  '💰 ¿Cuánto cuesta el Agente de IA?',
  '⚡ ¿Cómo conectar mi WhatsApp?',
  '📅 Agendar videollamada con Edier',
  '🏢 Tengo una inmobiliaria',
  '🏥 Tengo una clínica o consultorio',
  '🛍️ Tengo una tienda online',
];

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [chips, setChips] = useState<string[]>(DEFAULT_CHIPS);
  const [clientId, setClientId] = useState<string>('');
  const isLoadedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Memoria del cliente persistente (localStorage para retención permanente entre visitas)
  useEffect(() => {
    try {
      let id = localStorage.getItem(CLIENT_ID_KEY);
      if (!id) {
        id = 'cli_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        localStorage.setItem(CLIENT_ID_KEY, id);
      }
      setClientId(id);

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.messages) && parsed.messages.length) {
          setMessages(parsed.messages);
        }
        if (Array.isArray(parsed.chips)) {
          setChips(parsed.chips);
        }
      }
    } catch {
      /* sin almacenamiento disponible */
    } finally {
      isLoadedRef.current = true;
    }
  }, []);

  // Guardar en localStorage solo después de la carga inicial
  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: messages.slice(-40), chips }));
    } catch {
      /* ignorar */
    }
  }, [messages, chips]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleResetChat = () => {
    setMessages([WELCOME]);
    setChips(DEFAULT_CHIPS);
    setInput('');
    setLoading(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setChips([]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    let senderName = 'Visitante Web';
    try {
      const storedUser = localStorage.getItem('edmysoft_session_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u?.name) senderName = u.name;
      }
    } catch {}

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          clientSessionId: clientId || undefined,
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
              'Disculpa, ocurrió una pequeña pausa de red. Puedes escribir directamente al WhatsApp oficial **+57 323 416 6354** o volver a preguntar.',
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
            'Nuestros asesores están disponibles en este momento. Puedes escribirnos directo al WhatsApp oficial **+57 323 416 6354** para atenderte de inmediato.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón Flotante en la esquina inferior derecha */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:scale-105 text-white font-bold text-xs shadow-2xl shadow-cyan-500/30 border border-white/20 transition-all"
          aria-label="Abrir Asistente IA"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="hidden sm:inline">Asistente IA • Preguntas & Cotizaciones</span>
        </button>
      </div>

      {/* Ventana de Chat Flotante */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-50 w-[92vw] sm:w-[420px] h-[550px] max-h-[80vh] rounded-3xl glass-panel bg-[#0d1424]/95 border border-cyan-500/30 shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200">
          {/* Header del Chat */}
          <div className="p-4 border-b border-white/10 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white">EDMYSOFT Atiende</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Gemini IA
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En línea
                  </p>
                  <span className="text-[10px] text-cyan-300 flex items-center gap-1 font-medium bg-cyan-950/50 px-2 py-0.2 rounded-full border border-cyan-500/30">
                    🧠 Memoria activa
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reiniciar conversación"
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed">
            {messages.map((m, idx) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={idx}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 space-y-1 ${
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
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Escribiendo...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias rápidas dinámicas (las propone el agente según el contexto) */}
          {chips.length > 0 && !loading && (
            <div className="px-3 py-2 border-t border-white/5 bg-slate-950/70 flex gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/20 shrink-0 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Formulario de Entrada */}
          <div className="p-3 border-t border-white/10 bg-slate-900/90">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
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
                placeholder="Pregunta sobre servicios, precios o citas..."
                className="flex-1 rounded-xl bg-slate-950 border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-300 hover:scale-105 disabled:opacity-50 text-slate-950 font-bold transition-all"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
