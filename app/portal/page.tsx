'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  FileLock2,
  FileText,
  Calendar,
  LifeBuoy,
  UserCheck,
  ShieldCheck,
  LogOut,
  Globe,
  ArrowRight,
  Download,
  Send,
  Clock,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Lock,
  Mail,
  User,
  Building,
  Phone,
  Video,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import SecurityAuditModal from '@/components/public/SecurityAuditModal';
import { formatCOP } from '@/lib/formatters';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  ownerEmail: string;
  clientName: string;
  progress: number;
  stage: string;
  eta: string;
  leadEngineer: string;
}

interface Document {
  id: string;
  title: string;
  classification: string;
  sizeKb: number;
  contentSummary: string | null;
  ownerEmail: string;
}

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

interface Meeting {
  id: string;
  title: string;
  dueDate: string;
  description: string | null;
}

interface QuoteItem {
  id: string;
  quoteNumber: string;
  totalFirstYear: number;
  setupTotal: number;
  status: string;
  type: string;
  contact?: {
    fullName: string;
    email: string;
  };
}

const STAGES = ['Análisis', 'Prototipado', 'Desarrollo', 'Pruebas', 'Despliegue'];

export default function ClientPortalPage() {
  // Estado de autenticación oficial
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Tabs de acceso (si no está autenticado)
  const [authTab, setAuthTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);

  // Formulario Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Formulario Registro Oficial
  const [regName, setRegName] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Datos del portal
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientCompany, setClientCompany] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Formularios de acción dentro del portal
  const [meetTopic, setMeetTopic] = useState('');
  const [meetDate, setMeetDate] = useState('2026-11-05');
  const [meetTime, setMeetTime] = useState('10:00 AM');
  const [meetModality, setMeetModality] = useState<'VIRTUAL' | 'PRESENCIAL'>('VIRTUAL');

  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  // Modal de auditoría
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Verificar autenticación al cargar
  const checkSession = async () => {
    setCheckingAuth(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        loadPortalData(data.user.email);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // 2. Cargar datos aislados por email oficial
  const loadPortalData = async (email: string) => {
    setLoading(true);
    try {
      const [projRes, docRes, tickRes, meetRes, quoteRes] = await Promise.all([
        fetch(`/api/portal/projects?email=${encodeURIComponent(email)}`).then((r) => r.json()),
        fetch(`/api/portal/documents?email=${encodeURIComponent(email)}`).then((r) => r.json()),
        fetch(`/api/portal/tickets?email=${encodeURIComponent(email)}`).then((r) => r.json()),
        fetch(`/api/portal/meetings?email=${encodeURIComponent(email)}`).then((r) => r.json()),
        fetch(`/api/quotes?email=${encodeURIComponent(email)}`).then((r) => r.json()).catch(() => ({ quotes: [] })),
      ]);

      if (projRes.success) setProjects(projRes.projects || []);
      if (docRes.success) setDocuments(docRes.documents || []);
      if (tickRes.success) setTickets(tickRes.tickets || []);
      if (meetRes.success) setMeetings(meetRes.meetings || []);
      if (quoteRes.success) setQuotes(quoteRes.quotes || []);
    } catch (err) {
      console.error('Error cargando portal:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Manejo de Inicio de Sesión
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        showToast(`¡Bienvenido(a), ${data.user.name}!`);
        loadPortalData(data.user.email);
      } else {
        setAuthError(data.error || 'Credenciales inválidas.');
      }
    } catch {
      setAuthError('Error de red al conectar con el servidor.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // 4. Manejo de Registro Oficial de Cliente
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          companyName: regCompany || 'Persona Natural',
          phone: regPhone,
          email: regEmail,
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setClientCompany(regCompany);
        setClientPhone(regPhone);
        showToast(`Cuenta oficial creada con éxito. ¡Bienvenido, ${data.user.name}!`);
        loadPortalData(data.user.email);
      } else {
        setAuthError(data.error || 'Error al crear la cuenta oficial.');
      }
    } catch {
      setAuthError('Error de red al procesar el registro.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // 5. Cerrar Sesión
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setProjects([]);
    setDocuments([]);
    setTickets([]);
    setMeetings([]);
    setQuotes([]);
    showToast('Sesión finalizada de forma segura.');
  };

  // 6. Manejo de descarga con firma temporal
  const handleDownload = async (docId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/portal/documents/${docId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Descarga autorizada: "${data.title}" (Token temporal válido por ${data.expiresInSeconds}s).`);
        window.open(data.downloadUrl, '_blank');
      } else {
        showToast(data.error || 'Error de autorización al descargar');
      }
    } catch {
      showToast('Error de red al procesar descarga');
    }
  };

  // 7. Crear ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage || !currentUser) return;

    try {
      const res = await fetch('/api/portal/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmail: currentUser.email,
          clientName: currentUser.name,
          subject: ticketSubject,
          message: ticketMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets([data.ticket, ...tickets]);
        setTicketSubject('');
        setTicketMessage('');
        showToast(`Ticket "${data.ticket.subject}" registrado con éxito.`);
      }
    } catch {
      showToast('Error al registrar ticket');
    }
  };

  // 8. Agendar reunión (Virtual o Presencial)
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTopic || !meetDate || !currentUser) return;

    const topicWithModality = `[${meetModality}] ${meetTopic}`;

    try {
      const res = await fetch('/api/portal/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: currentUser.name,
          email: currentUser.email,
          topic: topicWithModality,
          date: meetDate,
          time: meetTime,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Reunión ${meetModality.toLowerCase()} solicitada para el ${meetDate} a las ${meetTime}.`);
        setMeetTopic('');
        loadPortalData(currentUser.email);
      }
    } catch {
      showToast('Error al solicitar reunión');
    }
  };

  // Vista de carga inicial
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Verificando credenciales oficiales...</p>
        </div>
      </div>
    );
  }

  // SI NO ESTÁ AUTENTICADO: Formulario Oficial de Login / Registro
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
        <header className="glass-panel border-b border-white/10 bg-[#090d16]/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-lg shadow-lg">
                E
              </div>
              <div>
                <span className="font-bold text-lg text-white">
                  EDMY<span className="text-cyan-400">SOFT</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Portal Oficial de Clientes & Proyectos
                </p>
              </div>
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-white/10 transition-all flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Volver a la Web</span>
            </Link>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full glass-panel bg-[#0d1424] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20">
                <Lock className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-extrabold text-white">Acceso al Portal</h1>
              <p className="text-xs text-slate-400">
                Ingresa a tu espacio privado o regístrate oficialmente como nuevo cliente o persona natural.
              </p>
            </div>

            {/* Selector de Pestañas: Login vs Registro */}
            <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => { setAuthTab('LOGIN'); setAuthError(null); }}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  authTab === 'LOGIN'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('REGISTER'); setAuthError(null); }}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  authTab === 'REGISTER'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Crear Cuenta Oficial
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* TAB 1: INICIAR SESIÓN */}
            {authTab === 'LOGIN' && (
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="tu@empresa.com o ediergallego59@gmail.com"
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {authSubmitting ? 'Verificando...' : 'Ingresar al Portal'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 text-center text-[11px] text-slate-400">
                  ¿Eres el Administrador? Puedes acceder directamente con tu cuenta{' '}
                  <strong className="text-cyan-300">ediergallego59@gmail.com</strong>.
                </div>
              </form>
            )}

            {/* TAB 2: REGISTRO OFICIAL DE CLIENTE */}
            {authTab === 'REGISTER' && (
              <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nombre Completo *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ej: Carlos Alberto Gómez"
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Empresa / Razón Social</label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={regCompany}
                        onChange={(e) => setRegCompany(e.target.value)}
                        placeholder="Persona Natural o SAS"
                        className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">WhatsApp / Celular *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+57 300 123 4567"
                        className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Correo Electrónico *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="carlos@miempresa.com"
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Contraseña Segura *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {authSubmitting ? 'Registrando en Base de Datos...' : 'Crear Cuenta Oficial & Acceder'}
                  <Sparkles className="w-4 h-4" />
                </button>

                <p className="text-[10px] text-slate-400 text-center">
                  Al registrarte se crea tu perfil oficial con base de datos encriptada y se asigna tu espacio de proyectos.
                </p>
              </form>
            )}
          </div>
        </main>
      </div>
    );
  }

  // SI ESTÁ AUTENTICADO: Portal Completo del Cliente
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl glass-panel bg-slate-900/95 border border-cyan-500/30 text-cyan-200 text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Barra Superior del Portal */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/10 bg-[#090d16]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-lg shadow-lg">
              E
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white">
                  EDMY<span className="text-cyan-400">SOFT</span>
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Portal Clientes
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Desarrollado por <strong className="text-cyan-400">EDMYSOFT</strong>
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-300 border border-emerald-500/25 transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Auditoría & Tests</span>
            </button>

            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-white/10 transition-all flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Sitio Comercial</span>
            </Link>

            {['ADMIN', 'SUPERADMIN'].includes(currentUser.role) && (
              <Link
                href="/admin"
                className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-xs font-medium text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Panel Admin</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-300 border border-red-500/25 transition-all flex items-center gap-1.5"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Banner de Bienvenida Oficial */}
        <div className="glass-panel p-6 rounded-2xl border-white/10 bg-[#0d1424] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {currentUser.role === 'SUPERADMIN' ? 'Propietario / Administrador Oficial' : 'Cuenta Oficial Verificada'}
                </span>
                <span className="text-xs text-slate-400 font-mono">{currentUser.email}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white mt-1">{currentUser.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-white/10 transition-all flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Salir</span>
            </button>
          </div>
        </div>

        {/* Layout en 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda: Proyectos, Bóveda y Cotizaciones */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Mis Proyectos Autorizados */}
            <div className="glass-panel p-6 rounded-2xl border-white/10 bg-[#0d1424] space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-cyan-400" />
                    1. Mis Proyectos Autorizados (Aislamiento RLS)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Proyectos asociados estrictamente a tu cuenta oficial ({currentUser.email}).
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {projects.length} Activo(s)
                </span>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Cargando proyectos autorizados...</div>
              ) : projects.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-900/50 border border-white/5 text-center text-xs text-slate-400">
                  No hay proyectos asignados a esta cuenta ({currentUser.email}). Se crearán automáticamente con tu primera orden.
                </div>
              ) : (
                <div className="space-y-6">
                  {projects.map((p) => {
                    const currentIdx = STAGES.indexOf(p.stage);
                    return (
                      <div
                        key={p.id}
                        className="p-5 rounded-xl bg-slate-900/80 border border-white/10 space-y-4 hover:border-cyan-500/30 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-mono text-cyan-400">
                              {p.id} • Propietario Verificado: {p.ownerEmail}
                            </span>
                            <h3 className="text-base font-bold text-white mt-0.5">{p.name}</h3>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            Avance: {p.progress}%
                          </span>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 transition-all duration-700"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>

                        {/* Cronograma de 5 etapas */}
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-2 font-semibold">
                            Cronograma de Etapas de Ingeniería:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                            {STAGES.map((st, idx) => {
                              const isCurrent = st === p.stage;
                              const isPast = idx < currentIdx;
                              let badgeStyle = 'bg-slate-950 text-slate-500 border-white/5';
                              if (isPast) badgeStyle = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
                              if (isCurrent)
                                badgeStyle = 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-lg';

                              return (
                                <span
                                  key={st}
                                  className={`px-2 py-1 rounded-lg border text-[11px] text-center font-medium ${badgeStyle}`}
                                >
                                  {st}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                          <span>
                            Líder Técnico: <strong className="text-slate-200">{p.leadEngineer}</strong>
                          </span>
                          <span>
                            Entrega Estimada: <strong className="text-cyan-400">{p.eta}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Bóveda Privada de Documentos y Entregables */}
            <div className="glass-panel p-6 rounded-2xl border-white/10 bg-[#0d1424] space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileLock2 className="w-5 h-5 text-indigo-400" />
                    2. Bóveda Privada de Documentos y Entregables
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Descarga protegida mediante token temporal firmado y verificación estricta de propiedad.
                  </p>
                </div>
              </div>

              {documents.length === 0 ? (
                <div className="p-5 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-slate-400 text-center">
                  No hay documentos confidenciales disponibles para tu cuenta.
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/30 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-indigo-400 text-[11px] font-bold">{doc.id}</span>
                          <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-[10px] font-semibold border border-indigo-500/20">
                            {doc.classification}
                          </span>
                        </div>
                        <h4 className="font-semibold text-white mt-1 text-sm">{doc.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {doc.contentSummary} ({doc.sizeKb} KB)
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(doc.id)}
                        className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar con Firma</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Cotizaciones Asociadas */}
            <div className="glass-panel p-6 rounded-2xl border-white/10 bg-[#0d1424] space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    3. Mis Cotizaciones Registradas
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Presupuestos calculados con fórmulas oficiales inmutables.
                  </p>
                </div>
                <Link
                  href="/#cotizador"
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  + Nueva Solicitud
                </Link>
              </div>

              {quotes.length === 0 ? (
                <div className="p-5 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-slate-400 text-center">
                  Aún no tienes cotizaciones registradas con tu correo ({currentUser.email}). Puedes generar una en el cotizador interactivo.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-semibold">
                        <th className="py-2.5 px-3">Código</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Setup COP</th>
                        <th className="py-2.5 px-3">Total Anual</th>
                        <th className="py-2.5 px-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {quotes.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-3 font-mono text-cyan-400 font-semibold">{q.quoteNumber}</td>
                          <td className="py-3 px-3 font-medium text-white">{q.type}</td>
                          <td className="py-3 px-3 font-bold text-white">{formatCOP(q.setupTotal || 0)}</td>
                          <td className="py-3 px-3 font-extrabold text-cyan-300">{formatCOP(q.totalFirstYear || 0)}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              {q.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Agendamiento, Perfil y Tickets */}
          <div className="lg:col-span-4 space-y-8">
            {/* Agendar Reunión Técnica */}
            <div className="glass-panel p-6 rounded-2xl border-white/10 bg-[#0d1424] space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  Agendar Reunión Técnica
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Directo con Edier Mery Gallego (CEO & Arquitecto IA).
                </p>
              </div>

              <form onSubmit={handleScheduleMeeting} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Modalidad de Reunión *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMeetModality('VIRTUAL')}
                      className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                        meetModality === 'VIRTUAL'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-white/10 text-slate-400'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Google Meet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeetModality('PRESENCIAL')}
                      className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                        meetModality === 'PRESENCIAL'
                          ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                          : 'bg-slate-900 border-white/10 text-slate-400'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Presencial</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Motivo de la sesión *</label>
                  <input
                    type="text"
                    required
                    value={meetTopic}
                    onChange={(e) => setMeetTopic(e.target.value)}
                    placeholder="Ej: Revisión de avance sprint 1"
                    className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">Fecha *</label>
                    <input
                      type="date"
                      required
                      value={meetDate}
                      onChange={(e) => setMeetDate(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">Hora (COL) *</label>
                    <select
                      value={meetTime}
                      onChange={(e) => setMeetTime(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="04:30 PM">04:30 PM</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/20"
                >
                  Solicitar Reunión {meetModality === 'VIRTUAL' ? 'Virtual' : 'Presencial'}
                </button>
              </form>

              {meetings.length > 0 && (
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                    Sesiones Programadas:
                  </span>
                  {meetings.map((m) => (
                    <div key={m.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs">
                      <p className="font-semibold text-white">{m.title}</p>
                      <p className="text-[11px] text-slate-400">{m.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Canal de Soporte & Tickets */}
            <div className="glass-panel p-6 rounded-2xl border-white/10 bg-[#0d1424] space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-indigo-400" />
                  Canal de Soporte & Tickets
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reporta solicitudes de ajuste directo a nuestro equipo.
                </p>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Asunto / Módulo *</label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Ej: Duda sobre webhook de WhatsApp"
                    className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Mensaje o requerimiento *</label>
                  <textarea
                    rows={3}
                    required
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Describe en detalle la observación..."
                    className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/20"
                >
                  Enviar Ticket Prioritario
                </button>
              </form>

              {tickets.length > 0 && (
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                    Mis Tickets Recientes:
                  </span>
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-lg bg-slate-900/60 border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <span className="text-slate-200 font-medium block truncate">
                          {t.id}: {t.subject}
                        </span>
                        <span className="text-[10px] text-slate-400">{t.message.slice(0, 40)}...</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20 shrink-0">
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Perfil Oficial del Cliente */}
            <div className="glass-panel p-6 rounded-2xl border-white/10 bg-[#0d1424] space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  Perfil Oficial en Base de Datos
                </h3>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Nombre Registrado:</span>
                  <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white font-semibold">
                    {currentUser.name}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Correo Oficial:</span>
                  <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-cyan-300 font-mono">
                    {currentUser.email}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Rol de Seguridad:</span>
                  <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-emerald-400 font-bold">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 font-semibold border border-red-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión Oficial</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Auditoría de Ciberseguridad */}
      <SecurityAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
