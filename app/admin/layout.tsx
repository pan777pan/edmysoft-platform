'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Kanban,
  FileText,
  Calculator,
  Layers,
  Puzzle,
  Repeat,
  BookOpen,
  Workflow,
  Radio,
  Activity,
  ShieldCheck,
  Settings,
  Bot,
  ExternalLink,
  Menu,
  QrCode,
  Sparkles,
  UserCheck,
  Bell,
  X,
  DollarSign,
  LogOut,
} from 'lucide-react';

const MENU_ITEMS = [
  { href: '/admin', label: '1. Resumen Comercial', icon: LayoutDashboard },
  { href: '/admin/ia', label: 'Cerebro IA (Gemini / GPT)', icon: Bot, badge: 'IA' },
  { href: '/admin/whatsapp', label: 'Conectar WhatsApp (QR)', icon: QrCode, badge: 'QR' },
  { href: '/admin/precios', label: 'Tarifas y Regateo IA', icon: DollarSign, badge: 'Precios' },
  { href: '/admin/cms', label: 'Editor CMS de la Web', icon: Sparkles, badge: 'CMS' },
  { href: '/admin/conversaciones', label: '2. Conversaciones', icon: MessageSquare, badge: 'Live' },
  { href: '/admin/contactos', label: '3. Contactos y CRM', icon: Users },
  { href: '/admin/oportunidades', label: '4. Oportunidades', icon: Kanban },
  { href: '/admin/cotizaciones', label: '5. Cotizaciones', icon: FileText },
  { href: '/admin/cotizaciones/nueva', label: '6. Calculadora Dinámica', icon: Calculator },
  { href: '/admin/catalogo/servicios', label: '7. Servicios y Planes', icon: Layers },
  { href: '/admin/catalogo/modulos', label: '8. Módulos Adicionales', icon: Puzzle },
  { href: '/admin/costes-recurrentes', label: '9. Costes Recurrentes', icon: Repeat },
  { href: '/admin/conocimiento', label: '10. Base de Conocimiento', icon: BookOpen },
  { href: '/admin/automatizaciones', label: '11. Automatizaciones n8n', icon: Workflow },
  { href: '/admin/integraciones', label: '12. Canales e Integraciones', icon: Radio },
  { href: '/admin/actividad', label: '13. Actividad y Métricas', icon: Activity },
  { href: '/admin/usuarios', label: '14. Equipo y Trabajadores (RBAC)', icon: ShieldCheck },
  { href: '/admin/ajustes', label: '15. Ajustes de EDMYSOFT', icon: Settings },
  { href: '/portal', label: 'Portal de Clientes', icon: UserCheck },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    router.push('/admin/login');
  };

  return (
    <div className="flex h-screen bg-[#070a0f] text-slate-100 overflow-hidden font-sans">
      {/* SIDEBAR ESCRITORIO */}
      <aside className="hidden lg:flex lg:flex-col w-72 bg-[#090d16] border-r border-white/5 shrink-0">
        {/* Cabecera del Sidebar */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/5">
          <Link href="/admin" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1">
                EDMY<span className="text-cyan-400">SOFT</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold block -mt-0.5">
                Atiende • Plataforma
              </span>
            </div>
          </Link>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            En línea
          </span>
        </div>

        {/* Lista de Navegación de los 15 Módulos */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Módulos del Sistema
          </div>
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-400 text-slate-950">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver Web Comercial</span>
          </Link>
          <div className="px-2 pt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>v1.0.0 — Fase 15</span>
            <span className="text-cyan-400">COP • Bogotá</span>
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barra Superior */}
        <header className="h-16 px-6 glass-panel border-b border-white/5 bg-[#090d16]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Base de Datos Oficial Sincronizada</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-400">WhatsApp Sandbox Activo</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/conversaciones"
              className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-cyan-400 border border-slate-800 relative transition-colors"
              title="Conversaciones activas"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                E
              </div>
              <div className="hidden sm:block text-left text-xs">
                <span className="font-bold text-white block">Edier</span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">Dirección EDMYSOFT</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/15 text-slate-300 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Cerrar Sesión y salir al Login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Menú Móvil Desplegable */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-[#090d16]/95 backdrop-blur-md flex flex-col p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="font-bold text-white">Menú Administrativo</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="space-y-1">
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Contenedor Principal con Scroll */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#070a0f]">
          {children}
        </main>
      </div>
    </div>
  );
}
