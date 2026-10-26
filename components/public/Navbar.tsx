'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bot, Menu, X, ArrowRight, ShieldCheck, Sparkles, Lock } from 'lucide-react';
import SecurityAuditModal from '@/components/public/SecurityAuditModal';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-40 glass-panel border-b border-white/10 bg-[#090d16]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo Brand con sello Backed by TuSoft */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
                <span className="font-extrabold text-xl text-white">E</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold tracking-tight text-white">
                    EDMY<span className="text-cyan-400">SOFT</span>
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Colombia
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  Tecnología & <strong className="text-cyan-400 font-semibold">Automatización IA</strong>
                </p>
              </div>
            </Link>

            {/* Enlaces de Escritorio */}
            <div className="hidden lg:flex items-center space-x-6 text-sm font-medium">
              <Link href="/#inicio" className="text-slate-300 hover:text-white transition-colors">
                Inicio
              </Link>
              <Link href="/#respaldo" className="text-slate-300 hover:text-white transition-colors">
                Liderazgo EDMYSOFT
              </Link>
              <Link href="/#soluciones" className="text-slate-300 hover:text-white transition-colors">
                Soluciones
              </Link>
              <Link href="/#portafolio" className="text-slate-300 hover:text-white transition-colors">
                Casos de Éxito
              </Link>
              <Link href="/asistente-ia" className="text-slate-300 hover:text-cyan-400 flex items-center gap-1 transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Asistente IA</span>
              </Link>
              <Link href="/#cotizador" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                Cotizador a Medida
              </Link>
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Auditoría & Tests</span>
              </button>
            </div>

            {/* Botones de Acción */}
            <div className="hidden sm:flex items-center space-x-3">
              <Link
                href="/portal"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 border border-white/10 transition-all flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Portal Clientes</span>
              </Link>

              <Link
                href="/#cotizador"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-300 hover:from-cyan-300 hover:to-indigo-200 shadow-md shadow-cyan-500/25 transition-all flex items-center gap-1.5"
              >
                <span>Cotizar Proyecto</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Menú Móvil Hamburger */}
            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400"
                title="Auditoría de Seguridad"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menú Móvil Desplegable */}
        {isOpen && (
          <div className="lg:hidden glass-panel border-b border-white/10 px-4 pt-2 pb-6 space-y-3 bg-[#0c121e]">
            <Link
              href="/#inicio"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Inicio
            </Link>
            <Link
              href="/#respaldo"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Liderazgo EDMYSOFT
            </Link>
            <Link
              href="/#soluciones"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Catálogo de Soluciones
            </Link>
            <Link
              href="/#portafolio"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Casos de Éxito
            </Link>
            <Link
              href="/#cotizador"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-semibold text-cyan-400 hover:bg-slate-800"
            >
              Cotizador a Medida
            </Link>
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/portal"
                onClick={() => setIsOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-900 border border-white/10 flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Portal Clientes</span>
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsAuditModalOpen(true);
                }}
                className="w-full text-center px-4 py-2.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ejecutar 15 Pruebas de Seguridad</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Modal de Auditoría */}
      <SecurityAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </>
  );
}
