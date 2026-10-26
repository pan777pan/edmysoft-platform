'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Power,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Info,
  Layers,
  Bot,
  Send,
  Calendar,
  Check,
  FlaskConical,
  Play,
  StopCircle,
  FileText,
  Sparkles,
  Building,
  Briefcase,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { formatDateTimeCO } from '@/lib/formatters';

interface BaileysData {
  status: 'DISCONNECTED' | 'CONNECTING_QR' | 'CONNECTED' | 'ERROR';
  phoneNumber: string | null;
  accountName: string | null;
  qrCode: string | null;
  lastConnectedAt: string | null;
  errorLog: string | null;
  autoReplyAI: boolean;
  autoCalendar: boolean;
}

interface DemoConfig {
  active: boolean;
  expiresAt: string | null;
  clientBusinessName: string;
  clientIndustry: string;
  businessDescription: string;
  servicesAndPrices: string;
  faqs: string;
  bookingUrl: string;
  specialInstructions: string;
}

const DEFAULT_DEMO: DemoConfig = {
  active: false,
  expiresAt: null,
  clientBusinessName: '',
  clientIndustry: '',
  businessDescription: '',
  servicesAndPrices: '',
  faqs: '',
  bookingUrl: '',
  specialInstructions: '',
};

const PRESETS = [
  {
    name: '🥩 Restaurante Campestre',
    businessName: 'Parrilla & Fuego Steakhouse',
    industry: 'Gastronomía y Cortes Madurados',
    description: 'Restaurante campestre especialista en cortes finos madurados al carbón, vinos importados y eventos familiares en Chía.',
    servicesAndPrices: '- Bife de Chorizo 400g: $68.000 COP\n- Tomahawk Steak 1kg: $145.000 COP\n- Costillas BBQ al barril: $52.000 COP\n- Menú infantil: $28.000 COP\n- Reserva de mesa VIP: Sin costo con consumo mínimo',
    faqs: 'Horario: Miércoles a Domingo de 12:00 PM a 10:00 PM. Ubicación: Km 2 Vía Chía-Cajicá. Contamos con parqueadero gratuito y zona pet friendly.',
    bookingUrl: 'https://wa.me/573234166354?text=Quiero%20reservar%20mesa%20en%20Parrilla%20y%20Fuego',
    instructions: 'Sé muy hospitalario y acogedor. Si el cliente pregunta por disponibilidad, ofrécele reservar para el fin de semana.',
  },
  {
    name: '🦷 Clínica Odontológica',
    businessName: 'Clínica Dental Sonrisas Bogotá',
    industry: 'Salud Oral y Odontología Estética',
    description: 'Centro odontológico de alta especialidad en diseño de sonrisa, implantes dentales y ortodoncia invisible en Chicó, Bogotá.',
    servicesAndPrices: '- Valoración odontológica inicial: $30.000 COP (Gratis al iniciar tratamiento)\n- Limpieza profunda con ultrasonido: $85.000 COP\n- Calzas estéticas en resina (caries): desde $90.000 COP por pieza\n- Ortodoncia invisible (mensualidad): $130.000 COP\n- Blanqueamiento LED profesional: $280.000 COP',
    faqs: 'Horario: Lunes a Sábado de 8:00 AM a 7:00 PM. Ubicación: Cra 15 # 93-40, Piso 3, Chicó, Bogotá. Recibimos todas las tarjetas de crédito, PSE y Nequi.',
    bookingUrl: 'https://wa.me/573234166354?text=Quiero%20agendar%20valoracion%20dental',
    instructions: 'Sé muy empático, tranquilizador y profesional. Destaca que la valoración es gratuita si inicia tratamiento.',
  },
  {
    name: '🏢 Inmobiliaria & Finca Raíz',
    businessName: 'Inmobiliaria El Poblado SAS',
    industry: 'Bienes Raíces y Finca Raíz',
    description: 'Agencia inmobiliaria premium especializada en venta y arriendo de apartamentos de lujo, casas campestres y locales comerciales.',
    servicesAndPrices: '- Venta de apartamentos en Medellín / Envigado: desde $450.000.000 COP\n- Arriendos amoblados por meses: desde $3.500.000 COP/mes\n- Avalúo certificado y gestión inmobiliaria: 3% de comisión',
    faqs: 'Oficina: Edificio Square, El Poblado, Medellín. Requisitos de arriendo: Cédula y extractos bancarios de los últimos 3 meses.',
    bookingUrl: 'https://wa.me/573234166354?text=Quiero%20conocer%20propiedades%20disponibles',
    instructions: 'Habla de forma muy ejecutiva y cordial. Pregunta qué zona y qué presupuesto busca el interesado.',
  },
  {
    name: '⚖️ Firma Legal & Abogados',
    businessName: 'Gómez & Asociados Abogados',
    industry: 'Servicios Jurídicos y Asesoría Legal',
    description: 'Firma jurídica especializada en derecho laboral, comercial, tributario y contratos para empresas y personas naturales.',
    servicesAndPrices: '- Consulta jurídica presencial o virtual (45 min): $150.000 COP\n- Elaboración de contratos comerciales: desde $400.000 COP\n- Representación legal en demandas: según cuantía',
    faqs: 'Horarios: Lunes a Viernes de 8:00 AM a 6:00 PM. Atención virtual por Google Meet para todo Colombia.',
    bookingUrl: 'https://wa.me/573234166354?text=Deseo%20agendar%20consulta%20juridica',
    instructions: 'Mantén un tono sobrio, respetuoso y formal. Explica que la primera consulta incluye diagnóstico preliminar.',
  },
];

export default function WhatsAppConnectionPage() {
  const [data, setData] = useState<BaileysData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [activeTab, setActiveTab] = useState<'QR' | 'DEMO' | 'CLOUD'>('QR');

  // Ajustes de IA y Calendario
  const [autoReplyAI, setAutoReplyAI] = useState(true);
  const [autoCalendar, setAutoCalendar] = useState(true);

  // Modo Demo Temporal para Clientes (Inicializado con valores por defecto garantizados)
  const [demo, setDemo] = useState<DemoConfig>(DEFAULT_DEMO);
  const [demoDurationHours, setDemoDurationHours] = useState<number>(2);
  const [demoSaving, setDemoSaving] = useState(false);

  // Informe Diario
  const [reportSending, setReportSending] = useState(false);

  // Mensaje de prueba
  const [testPhone, setTestPhone] = useState('+57');
  const [testMessage, setTestMessage] = useState('¡Hola! Este es un mensaje de prueba desde EDMYSOFT Atiende.');
  const [testSending, setTestSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Simulador interactivo en tiempo real de WhatsApp Demo
  const [simMessages, setSimMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; time: string }>>([
    {
      role: 'assistant',
      content: '¡Hola! 👋 Te damos la bienvenida a *Clínica Dental Sonrisas Bogotá*.\n\nCentro odontológico de alta especialidad en diseño de sonrisa, implantes dentales, ortodoncia invisible y urgencias en Chicó, Bogotá.\n\n¿En qué te podemos ayudar hoy? (Puedes consultarnos por tratamientos, tarifas o agendamiento de citas).',
      time: '11:28 a.m.',
    },
  ]);
  const [simInput, setSimInput] = useState('');
  const [simLoading, setSimLoading] = useState(false);

  const handleSendSim = async (customText?: string) => {
    const textToSend = (customText ?? simInput).trim();
    if (!textToSend || simLoading) return;

    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'p.m.' : 'a.m.'}`;
    const userMsg = { role: 'user' as const, content: textToSend, time: timeStr };

    const updatedHistory = [...simMessages, userMsg];
    setSimMessages(updatedHistory);
    setSimInput('');
    setSimLoading(true);

    try {
      const res = await fetch('/api/admin/whatsapp/demo-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
          previewConfig: demo,
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setSimMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply, time: timeStr },
        ]);
      }
    } catch (e) {
      console.error('Error en simulador:', e);
    } finally {
      setSimLoading(false);
    }
  };

  const handleResetSim = () => {
    setSimMessages([
      {
        role: 'assistant',
        content: `¡Hola! 👋 Te damos la bienvenida a *${demo.clientBusinessName || 'nuestra empresa'}*.\n\n${demo.businessDescription || 'Atención personalizada y tratamientos especializados.'}\n\n¿En qué te podemos ayudar hoy?`,
        time: '11:28 a.m.',
      },
    ]);
  };

  const fetchDemo = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp-demo');
      const json = await res.json();
      if (json.success && json.config) {
        setDemo({
          ...DEFAULT_DEMO,
          ...json.config,
          active: Boolean(json.isCurrentlyActive),
        });
      }
    } catch (e) {
      console.warn('Error leyendo config demo:', e);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/baileys');
      const json = await res.json();
      if (json.success) {
        setData(json);
        setAutoReplyAI(json.autoReplyAI ?? true);
        setAutoCalendar(json.autoCalendar ?? true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial y sondeo periódico de estado de conexión (Baileys QR)
  useEffect(() => {
    fetchStatus();
    fetchDemo();
    // Únicamente sondeamos el estado de conexión del socket QR, NO la demo para evitar sobreescribir ediciones
    const interval = setInterval(() => {
      fetchStatus();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Temporizador de expiración visual del código QR
  useEffect(() => {
    if (data?.status === 'CONNECTING_QR' && data.qrCode) {
      setTimeLeft(60);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleStartSocket();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [data?.qrCode]);

  // Iniciar socket real de Baileys
  const handleStartSocket = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/whatsapp/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data || json);
        showToast('Conectando a WhatsApp... El código QR aparecerá en unos segundos.');
        // Sondeo rápido inmediato para cargar el QR apenas se emita
        setTimeout(fetchStatus, 1500);
        setTimeout(fetchStatus, 3000);
        setTimeout(fetchStatus, 5000);
      } else {
        showToast(json.error || 'Error al iniciar conexión');
      }
    } catch {
      showToast('Error de red al conectar con el servidor.');
    } finally {
      setActionLoading(false);
    }
  };

  // Desconectar sesión
  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de desconectar esta sesión de WhatsApp?')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/whatsapp/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data || json);
        showToast('Sesión de WhatsApp desconectada.');
      } else {
        showToast(json.error || 'Error al desconectar');
      }
    } catch {
      showToast('Error de red al procesar la desconexión');
    } finally {
      setActionLoading(false);
    }
  };

  // Guardar ajustes de IA y Google Calendar
  const handleSaveSettings = async (newAutoReply: boolean, newAutoCalendar: boolean) => {
    try {
      const res = await fetch('/api/whatsapp/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settings',
          autoReplyAI: newAutoReply,
          autoCalendar: newAutoCalendar,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAutoReplyAI(newAutoReply);
        setAutoCalendar(newAutoCalendar);
        showToast('Preferencias actualizadas correctamente.');
      }
    } catch {
      showToast('Error al actualizar preferencias.');
    }
  };

  // Enviar mensaje de prueba directo
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMessage) return;
    setTestSending(true);
    try {
      const res = await fetch('/api/whatsapp/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_test',
          to: testPhone,
          message: testMessage,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Mensaje enviado con éxito a ${testPhone}`);
      } else {
        showToast(json.error || 'Error al enviar mensaje');
      }
    } catch {
      showToast('Error de red al enviar mensaje');
    } finally {
      setTestSending(false);
    }
  };

  // Guardar y activar/desactivar Modo Demo Temporal
  const handleToggleDemo = async (makeActive: boolean) => {
    setDemoSaving(true);
    let expiresAt: string | null = null;
    if (makeActive && demoDurationHours > 0) {
      expiresAt = new Date(Date.now() + demoDurationHours * 3600 * 1000).toISOString();
    }
    try {
      const res = await fetch('/api/admin/whatsapp-demo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...demo,
          active: makeActive,
          expiresAt,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDemo({
          ...demo,
          active: makeActive,
          expiresAt,
        });
        showToast(json.message);
      }
    } catch {
      showToast('Error al actualizar el modo demo.');
    } finally {
      setDemoSaving(false);
    }
  };

  // Cargar plantilla rápida con guardado automático inmediato en backend
  const applyPreset = async (preset: typeof PRESETS[0]) => {
    const updatedDemo = {
      ...demo,
      clientBusinessName: preset.businessName,
      clientIndustry: preset.industry,
      businessDescription: preset.description,
      servicesAndPrices: preset.servicesAndPrices,
      faqs: preset.faqs,
      bookingUrl: preset.bookingUrl,
      specialInstructions: preset.instructions,
    };
    setDemo(updatedDemo);

    // Reiniciar simulador en pantalla con el negocio seleccionado
    setSimMessages([
      {
        role: 'assistant',
        content: `¡Hola! 👋 Te damos la bienvenida a *${preset.businessName}*.\n\n${preset.description}\n\n¿En qué te podemos ayudar hoy?`,
        time: '11:28 a.m.',
      },
    ]);

    // Guardar inmediatamente en la base de datos y archivo de backend
    try {
      await fetch('/api/admin/whatsapp-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active: demo.active,
          expiresAt: demo.expiresAt,
          ...updatedDemo,
        }),
      });
      showToast(`Plantilla "${preset.name}" guardada y lista.`);
    } catch {
      showToast(`Plantilla "${preset.name}" cargada en pantalla.`);
    }
  };

  // Guardar cambios manuales del formulario de demo sin cambiar el estado activo
  const handleSaveDemoDraft = async () => {
    setDemoSaving(true);
    try {
      const res = await fetch('/api/admin/whatsapp-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demo),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Configuración de la demostración guardada con éxito.');
      } else {
        showToast(json.error || 'Error al guardar.');
      }
    } catch {
      showToast('Error de conexión al guardar la demo.');
    } finally {
      setDemoSaving(false);
    }
  };

  // Enviar Informe Diario a WhatsApp
  const handleSendDailyReport = async () => {
    setReportSending(true);
    try {
      const res = await fetch('/api/admin/daily-report', { method: 'POST' });
      const json = await res.json();
      showToast(json.message || (json.success ? 'Informe diario enviado con éxito a tu WhatsApp.' : 'Error al enviar'));
    } catch {
      showToast('No se pudo enviar el informe.');
    } finally {
      setReportSending(false);
    }
  };

  // Componente del formulario de Demostración para reusar en pestaña dedicada y en QR
  const renderDemoCard = () => (
    <div
      className={`glass-panel p-6 rounded-3xl border transition shadow-2xl ${
        demo.active
          ? 'border-amber-500/60 bg-amber-500/10 shadow-amber-500/10 ring-2 ring-amber-500/40'
          : 'border-white/10 bg-[#0d1424]'
      } space-y-5 text-xs`}
    >
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <FlaskConical className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Modo Demostración Temporal para Clientes
              </h3>
              <p className="text-[11px] text-slate-400">
                Pausa la identidad de EDMYSOFT en WhatsApp y responde 100% como el negocio de tu cliente.
              </p>
            </div>
          </div>
        </div>
        <div>
          {demo.active ? (
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40 flex items-center gap-2 shadow-lg animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                DEMO EN VIVO ACTIVA
              </span>
              <button
                type="button"
                onClick={() => handleToggleDemo(false)}
                disabled={demoSaving}
                className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold transition flex items-center gap-1.5"
              >
                <StopCircle className="w-4 h-4" />
                <span>Detener Demo</span>
              </button>
            </div>
          ) : (
            <span className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 font-semibold text-xs border border-white/10">
              Modo Normal (EDMYSOFT)
            </span>
          )}
        </div>
      </div>

      {/* Botones de Carga Rápida de Plantillas */}
      <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/5 space-y-2">
        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Cargar plantilla predefinida en 1 clic (para demostraciones inmediatas):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 font-medium text-[11px] transition text-left truncate hover:border-amber-400/50"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario de Configuración del Cliente */}
      <div className="space-y-4 pt-1">
        <div className="grid sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-slate-200 block mb-1 font-semibold flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-amber-400" />
              Nombre de la Empresa del Cliente *
            </label>
            <input
              type="text"
              value={demo.clientBusinessName}
              onChange={(e) => setDemo({ ...demo, clientBusinessName: e.target.value })}
              className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2.5 text-white text-xs outline-none focus:border-amber-400 transition"
              placeholder="Ej. Clínica Dental Sonrisas SAS"
            />
          </div>
          <div>
            <label className="text-slate-200 block mb-1 font-semibold flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              Sector / Industria
            </label>
            <input
              type="text"
              value={demo.clientIndustry}
              onChange={(e) => setDemo({ ...demo, clientIndustry: e.target.value })}
              className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2.5 text-white text-xs outline-none focus:border-amber-400 transition"
              placeholder="Ej. Odontología / Gastronomía / Inmobiliaria"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-200 block mb-1 font-semibold">Descripción del Negocio & Ubicación *</label>
          <textarea
            rows={2}
            value={demo.businessDescription}
            onChange={(e) => setDemo({ ...demo, businessDescription: e.target.value })}
            className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white text-xs outline-none focus:border-amber-400 transition"
            placeholder="A qué se dedica la empresa, qué experiencia tiene, en qué ciudad u oficinas atienden..."
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-slate-200 block mb-1 font-semibold">Servicios / Productos & Precios Oficiales *</label>
            <textarea
              rows={4}
              value={demo.servicesAndPrices}
              onChange={(e) => setDemo({ ...demo, servicesAndPrices: e.target.value })}
              className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white text-xs font-mono outline-none focus:border-amber-400 transition"
              placeholder="• Servicio A: $50.000 COP&#10;• Servicio B: $120.000 COP&#10;• Paquete Premium: $350.000 COP"
            />
          </div>
          <div>
            <label className="text-slate-200 block mb-1 font-semibold flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              Preguntas Frecuentes (Horarios, Medios de Pago, Políticas)
            </label>
            <textarea
              rows={4}
              value={demo.faqs}
              onChange={(e) => setDemo({ ...demo, faqs: e.target.value })}
              className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white text-xs outline-none focus:border-amber-400 transition"
              placeholder="Horario: Lunes a Sábado de 8:00 AM a 7:00 PM. Ubicación: Calle 100 # 15-20. Recibimos tarjetas y transferencias..."
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-slate-200 block mb-1 font-semibold">Enlace de Agendamiento o Menú (Opcional)</label>
            <input
              type="text"
              value={demo.bookingUrl}
              onChange={(e) => setDemo({ ...demo, bookingUrl: e.target.value })}
              className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white text-xs outline-none focus:border-amber-400 transition"
              placeholder="https://wa.me/573234166354?text=Quiero%20agendar"
            />
          </div>
          <div>
            <label className="text-slate-200 block mb-1 font-semibold">Instrucciones Especiales de Tono de Voz</label>
            <input
              type="text"
              value={demo.specialInstructions}
              onChange={(e) => setDemo({ ...demo, specialInstructions: e.target.value })}
              className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white text-xs outline-none focus:border-amber-400 transition"
              placeholder="Ej. Sé muy amable, tutea al cliente y ofrece agendar valoración"
            />
          </div>
        </div>

        {/* Barra de Activación con Temporizador */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300 font-semibold">Duración de la Demostración:</span>
            <select
              value={demoDurationHours}
              onChange={(e) => setDemoDurationHours(Number(e.target.value))}
              disabled={demo.active}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-amber-400"
            >
              <option value={0.5}>30 minutos</option>
              <option value={1}>1 hora</option>
              <option value={2}>2 horas (Recomendado reunión)</option>
              <option value={4}>4 horas</option>
              <option value={8}>8 horas (Jornada completa)</option>
              <option value={0}>Sin límite (Manual)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDemoDraft}
              disabled={demoSaving}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <span>{demoSaving ? 'Guardando...' : '💾 Guardar Datos'}</span>
            </button>

            {demo.active ? (
              <button
                type="button"
                onClick={() => handleToggleDemo(false)}
                disabled={demoSaving}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition"
              >
                <StopCircle className="w-4 h-4" />
                <span>Desactivar Demo & Volver a EDMYSOFT</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!demo.clientBusinessName.trim()) {
                    showToast('Por favor escribe el nombre de la empresa del cliente o selecciona una plantilla.');
                    return;
                  }
                  handleToggleDemo(true);
                }}
                disabled={demoSaving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition"
              >
                <Play className="w-4 h-4" />
                <span>{demoSaving ? 'Activando...' : 'Activar Modo Demostración en WhatsApp'}</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 italic">
          * Nota: Al activar la demo, WhatsApp responderá 100% como {demo.clientBusinessName || 'el cliente'}. Tu sitio web continuará operando 100% como EDMYSOFT sin ninguna modificación.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl glass-panel bg-slate-900/95 border border-cyan-500/30 text-cyan-200 text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Conexión WhatsApp & Modo Demostración
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Baileys Engine + Meta Cloud
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Conecta tu cuenta de WhatsApp Business escaneando el código QR y activa demostraciones personalizadas para tus clientes.
          </p>
        </div>

        {/* Estado en vivo de la conexión */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-sm ${
              data?.status === 'CONNECTED'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : data?.status === 'CONNECTING_QR'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-slate-900 border-white/10 text-slate-400'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                data?.status === 'CONNECTED'
                  ? 'bg-emerald-400 animate-pulse'
                  : data?.status === 'CONNECTING_QR'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-slate-600'
              }`}
            />
            <span>
              {data?.status === 'CONNECTED'
                ? `Conectado: +${data.phoneNumber || ''}`
                : data?.status === 'CONNECTING_QR'
                ? 'Esperando Escaneo de QR'
                : 'Desconectado'}
            </span>
          </div>

          <button
            onClick={() => { fetchStatus(); fetchDemo(); }}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 transition-colors"
            title="Refrescar estado"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Selector de Pestañas con 3 Opciones Claras */}
      <div className="flex flex-wrap border-b border-white/10 text-xs font-semibold gap-1">
        <button
          onClick={() => setActiveTab('QR')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'QR'
              ? 'border-cyan-400 text-cyan-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>1. Conexión QR WhatsApp</span>
        </button>

        <button
          onClick={() => setActiveTab('DEMO')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'DEMO'
              ? 'border-amber-400 text-amber-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-amber-400" />
          <span>2. Modo Demostración para Clientes (¡Nuevo!)</span>
          {demo.active && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
              ACTIVA
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('CLOUD')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'CLOUD'
              ? 'border-cyan-400 text-cyan-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>3. API Oficial Meta Cloud</span>
        </button>
      </div>

      {/* CONTENIDO PESTAÑA 2: DEDICADA A MODO DEMOSTRACIÓN */}
      {activeTab === 'DEMO' && (
        <div className="space-y-6">
          {renderDemoCard()}

          {/* SIMULADOR EN VIVO DE WHATSAPP PARA LA DEMO */}
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-[#070b14] shadow-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    Simulador Interactivo de WhatsApp en Tiempo Real
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Motor Contextual Multi-Turno
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Prueba la respuesta exacta que recibirán tus clientes sin necesidad de escribir desde tu celular.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetSim}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reiniciar Chat</span>
              </button>
            </div>

            {/* Píldoras de Prueba Rápida con 1 Clic */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400">
                Píldoras de prueba en 1 clic (reproducen el caso de atención real paso a paso):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSendSim('Hola')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] border border-cyan-500/20 transition"
                >
                  👋 1. Saludo: "Hola"
                </button>
                <button
                  type="button"
                  onClick={() => handleSendSim('Para un cita')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] border border-cyan-500/20 transition"
                >
                  🗓️ 2. Solicitud: "Para un cita"
                </button>
                <button
                  type="button"
                  onClick={() => handleSendSim('Edier mery gallego  para úna revisión odontológica y sacar un acarie')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] border border-amber-500/30 transition shadow-sm"
                >
                  🦷 3. Caso Real: "Edier mery gallego para una revisión odontológica y sacar un acarie"
                </button>
                <button
                  type="button"
                  onClick={() => handleSendSim('Mañana a las 10am')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] border border-emerald-500/20 transition"
                >
                  ⏰ 4. Horario: "Mañana a las 10am"
                </button>
                <button
                  type="button"
                  onClick={() => handleSendSim('Sí, perfecto muchas gracias')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] border border-emerald-500/20 transition"
                >
                  ✅ 5. Cierre: "Sí, perfecto muchas gracias"
                </button>
                <button
                  type="button"
                  onClick={() => handleSendSim('¿Cuánto cuesta la limpieza profunda y las calzas?')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-white/10 transition"
                >
                  💰 Tarifas: "¿Cuánto cuesta la limpieza?"
                </button>
                <button
                  type="button"
                  onClick={() => handleSendSim('¿Dónde están ubicados y cuál es el horario?')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-white/10 transition"
                >
                  📍 Ubicación: "¿Dónde están ubicados?"
                </button>
              </div>
            </div>

            {/* Ventana de WhatsApp Mockup */}
            <div className="rounded-2xl border border-white/10 bg-[#0b141a] overflow-hidden shadow-inner flex flex-col h-[420px]">
              {/* WhatsApp Header */}
              <div className="px-4 py-3 bg-[#202c33] flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shadow-md">
                    {(demo.clientBusinessName || 'E').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {demo.clientBusinessName || 'Clínica Dental Sonrisas Bogotá'}
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    </h4>
                    <p className="text-[10px] text-emerald-400 font-medium">
                      {simLoading ? 'escribiendo...' : 'en línea (WhatsApp Business)'}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 px-2 py-1 rounded bg-black/30">
                  Simulador Demo
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b141a] text-xs">
                {simMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-md ${
                        msg.role === 'user'
                          ? 'bg-[#005c4b] text-white rounded-tr-none'
                          : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-white/5'
                      }`}
                    >
                      <p className="whitespace-pre-line text-[12px] leading-relaxed">
                        {msg.content}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                        <span>{msg.time}</span>
                        {msg.role === 'user' && (
                          <span className="text-cyan-400 font-bold">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {simLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#202c33] text-slate-400 rounded-2xl p-2.5 flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-100"></span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-200"></span>
                      <span className="text-[11px] text-slate-300 font-medium">Escribiendo respuesta...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendSim();
                }}
                className="p-2.5 bg-[#202c33] border-t border-white/5 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  placeholder={`Escribe un mensaje como cliente de ${demo.clientBusinessName || 'la empresa'}...`}
                  className="flex-1 bg-[#2a3942] border border-white/5 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-emerald-500 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!simInput.trim() || simLoading}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold transition flex items-center justify-center shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 1: CÓDIGO QR REAL DE BAILEYS + DEMO EMBEBIDA */}
      {activeTab === 'QR' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Columna Izquierda: Visor del Código QR */}
            <div className="lg:col-span-5 space-y-4">
              <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-[#0d1424] text-center space-y-5 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Lector de Código QR
                    </span>
                  </div>
                  {data?.status === 'CONNECTING_QR' && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Expira en {timeLeft}s</span>
                    </div>
                  )}
                </div>

                {/* Renderizado de Pantalla de QR */}
                <div className="w-full aspect-square max-w-[280px] mx-auto rounded-2xl bg-white p-4 flex flex-col items-center justify-center shadow-inner relative group">
                  {data?.status === 'CONNECTED' ? (
                    <div className="text-center space-y-3 p-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <div>
                        <h4 className="text-slate-900 font-extrabold text-base">WhatsApp Vinculado</h4>
                        <p className="text-xs text-slate-600 mt-1 font-mono">
                          +{data.phoneNumber || ''}
                        </p>
                        {data.accountName && (
                          <p className="text-[11px] text-slate-500 font-medium">({data.accountName})</p>
                        )}
                      </div>
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Atención IA Activa
                      </span>
                    </div>
                  ) : data?.status === 'CONNECTING_QR' && data.qrCode ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <img
                        src={data.qrCode}
                        alt="Código QR de WhatsApp"
                        className="w-full h-full object-contain"
                      />
                      <p className="text-[11px] text-slate-500 font-semibold animate-pulse">
                        Abre WhatsApp y escanea este código
                      </p>
                    </div>
                  ) : data?.status === 'CONNECTING_QR' || actionLoading ? (
                    <div className="text-center space-y-3 p-4 text-cyan-600">
                      <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto shadow-inner">
                        <RefreshCw className="w-7 h-7 text-cyan-500 animate-spin" />
                      </div>
                      <div>
                        <h4 className="text-slate-900 font-bold text-sm">Generando Código QR...</h4>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Conectando a los servidores seguros de WhatsApp. Aparecerá en segundos...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3 p-4 text-slate-500">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                        <MessageSquare className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-xs font-medium">Sin sesión activa en este momento</p>
                      <button
                        type="button"
                        onClick={handleStartSocket}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-md"
                      >
                        {actionLoading ? 'Generando...' : 'Generar Código QR'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Acciones principales de Conexión */}
                <div className="pt-2 flex flex-col gap-2">
                  {data?.status === 'CONNECTED' ? (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      <Power className="w-4 h-4" />
                      <span>Desconectar Sesión de WhatsApp</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartSocket}
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
                      <span>{actionLoading ? 'Conectando...' : 'Reconectar / Generar Nuevo QR'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Preferencias de Automatización */}
              <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-[#0d1424] space-y-3 text-xs">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  Reglas de Atención Automática
                </h4>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/5">
                  <div>
                    <p className="font-semibold text-white">Respuesta Automática con IA</p>
                    <p className="text-[11px] text-slate-400">El modelo autónomo atiende consultas 24/7</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoReplyAI}
                    onChange={(e) => handleSaveSettings(e.target.checked, autoCalendar)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/5">
                  <div>
                    <p className="font-semibold text-white">Agendamiento en Google Calendar</p>
                    <p className="text-[11px] text-slate-400">Permite a los prospectos reservar reuniones</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoCalendar}
                    onChange={(e) => handleSaveSettings(autoReplyAI, e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Guía Paso a Paso, Informe Diario y Mensaje de Prueba */}
            <div className="lg:col-span-7 space-y-6">
              {/* Guía Paso a Paso */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0d1424] space-y-4 text-xs">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-cyan-400" />
                  ¿Cómo conectar tu WhatsApp en 3 pasos?
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <p className="font-semibold text-white">Abre WhatsApp</p>
                    <p className="text-[11px] text-slate-400">
                      En tu celular, abre WhatsApp Business o personal y ve a <strong>Ajustes</strong> o menú de 3 puntos.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <p className="font-semibold text-white">Dispositivos Vinculados</p>
                    <p className="text-[11px] text-slate-400">
                      Toca en <strong>Dispositivos vinculados</strong> y luego en <strong>Vincular un dispositivo</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                      3
                    </span>
                    <p className="font-semibold text-white">Escanea la Pantalla</p>
                    <p className="text-[11px] text-slate-400">
                      Apunta la cámara de tu celular hacia el código QR de la izquierda. La vinculación se completará al instante.
                    </p>
                  </div>
                </div>
              </div>

              {/* INFORME DIARIO A TU WHATSAPP (6:00 PM) */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0d1424] space-y-3 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      Informe Diario de Ventas a tu WhatsApp (06:00 PM)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      El bot compila automáticamente todos los prospectos interesados, citas agendadas y métricas del día y te los envía a tu WhatsApp (+57 323 416 6354).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendDailyReport}
                    disabled={reportSending || data?.status !== 'CONNECTED'}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{reportSending ? 'Generando...' : 'Enviar Informe a mi WhatsApp Ahora'}</span>
                  </button>
                </div>
              </div>

              {/* Formulario de Mensaje de Prueba */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0d1424] space-y-4 text-xs">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-400" />
                  Probar Envío de Mensaje desde la Conexión Activa
                </h3>

                <form onSubmit={handleSendTestMessage} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1 font-medium">Número con código de país *</label>
                      <input
                        type="text"
                        required
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="+57 300 000 0000"
                        className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">Mensaje de prueba *</label>
                    <textarea
                      rows={2}
                      required
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={testSending || data?.status !== 'CONNECTED'}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:scale-[1.02] disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testSending ? 'Enviando...' : 'Enviar Mensaje de Prueba'}</span>
                  </button>
                  {data?.status !== 'CONNECTED' && (
                    <p className="text-[11px] text-amber-400">
                      * Debes escanear y conectar WhatsApp primero para poder enviar mensajes de prueba.
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* TARJETA VISIBLE DE MODO DEMOSTRACIÓN AL PIE DE PÁGINA TAMBIÉN */}
          <div className="pt-4 border-t border-white/10">
            {renderDemoCard()}
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 3: META CLOUD API OFICIAL */}
      {activeTab === 'CLOUD' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0d1424] space-y-6 text-xs">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Configuración de Meta Cloud API (Oficial para WhatsApp)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Para empresas que cuentan con verificación comercial en Meta Business Manager y requieren número oficial con palomita verde.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Phone Number ID</label>
              <input
                type="text"
                placeholder="Ej. 109283746592817"
                className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white text-xs outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-medium">WhatsApp Business Account ID (WABA)</label>
              <input
                type="text"
                placeholder="Ej. 982736451928374"
                className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white text-xs outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-medium">System User Permanent Access Token</label>
            <input
              type="password"
              placeholder="EAAG..."
              className="w-full rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2 text-white text-xs outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
            <span className="font-semibold text-white block">Webhook Callback URL de EDMYSOFT:</span>
            <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-300 bg-slate-950 p-2.5 rounded-lg border border-white/5">
              <span>https://edmysoft.com/api/webhooks/whatsapp</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
