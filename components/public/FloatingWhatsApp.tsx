'use client';

import { MessageCircle } from 'lucide-react';

export default function FloatingWhatsApp() {
  const phoneNumber = '573234166354'; // WhatsApp oficial de EDMYSOFT / Edier Mery Gallego
  const message = encodeURIComponent(
    'Hola EDMYSOFT, me gustaría recibir asesoría para automatizar la atención y ventas de mi negocio.'
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <aside
      aria-label="Contacto por WhatsApp"
      className="fixed bottom-6 left-6 z-50 flex items-center group"
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp a EDMYSOFT"
        className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all duration-200 relative border-2 border-emerald-300/30"
      >
        <MessageCircle className="w-7 h-7 text-white fill-current" />
        <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-[#090d16] animate-pulse" />
      </a>

      {/* Tooltip flotante hacia la derecha */}
      <div className="hidden sm:block ml-3 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-emerald-500/40 text-xs font-semibold text-emerald-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        💬 WhatsApp Oficial (+57 323 416 6354)
      </div>
    </aside>
  );
}

