'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Shield, ShieldCheck, Lock, ExternalLink } from 'lucide-react';
import SecurityAuditModal from '@/components/public/SecurityAuditModal';

export default function Footer() {
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-white/10 bg-[#060910] text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">
            {/* Columna Marca */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-lg">
                  E
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-white block">
                    EDMY<span className="text-cyan-400">SOFT</span>
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-cyan-400">
                    Tecnología & IA
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingeniería de software a medida, agentes de Inteligencia Artificial y automatización de procesos empresariales. Liderado por <strong>Edier Mery Gallego</strong> con el respaldo de ingeniería y soporte de <strong>EDMYSOFT</strong> en Colombia.
              </p>
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <Shield className="w-4 h-4" />
                <span>Infraestructura Segura & APIs Oficiales de Meta</span>
              </div>
            </div>

            {/* Columna Navegación Directa */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Navegación Corporativa
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/#inicio" className="hover:text-cyan-400 transition-colors">
                    Pantalla Principal
                  </Link>
                </li>
                <li>
                  <Link href="/#respaldo" className="hover:text-cyan-400 transition-colors">
                    Liderazgo EDMYSOFT
                  </Link>
                </li>
                <li>
                  <Link href="/#soluciones" className="hover:text-cyan-400 transition-colors">
                    Catálogo de Soluciones
                  </Link>
                </li>
                <li>
                  <Link href="/#portafolio" className="hover:text-cyan-400 transition-colors">
                    Casos de Éxito
                  </Link>
                </li>
                <li>
                  <Link href="/#cotizador" className="hover:text-cyan-400 transition-colors">
                    Cotizador a Medida
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna Plataforma y Privacidad */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Plataforma Privada
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/portal" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Portal de Clientes (Bóveda & Proyectos)</span>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/login" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Acceso Administrativo Seguro</span>
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setIsAuditModalOpen(true)}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-left"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Consola de Auditoría (15 Pruebas OWASP)</span>
                  </button>
                </li>
                <li>
                  <Link href="/privacidad" className="hover:text-cyan-400 transition-colors">
                    Política de Privacidad y Habeas Data
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna Contacto Oficial */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Contacto Oficial
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-semibold">Líder Técnico:</span>
                  <span>Edier Mery Gallego</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                  <a href="mailto:ediergallego59@gmail.com" className="hover:text-cyan-400">
                    ediergallego59@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a
                    href="https://wa.me/573234166354"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400"
                  >
                    +57 323 416 6354 (WhatsApp)
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Colombia (Operación Global)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra inferior */}
          <div className="mt-8 pt-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 EDMYSOFT. Todos los derechos reservados. Sello Oficial: <strong className="text-slate-300">Tecnología & IA</strong>.</p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Auditoría OWASP (15 Pruebas)</span>
              </button>
              <span>•</span>
              <Link href="/portal" className="hover:text-slate-300">
                Portal Clientes
              </Link>
              <span>•</span>
              <Link href="/admin" className="hover:text-cyan-400">
                Consola Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Auditoría */}
      <SecurityAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </>
  );
}
