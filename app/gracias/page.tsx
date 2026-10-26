import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FloatingWhatsApp from '@/components/public/FloatingWhatsApp';
import { CheckCircle2, ArrowRight, MessageSquare, Clock } from 'lucide-react';

export default function ThankYouPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#090d16] text-slate-100">
      <Navbar />

      <section className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="glass-panel max-w-xl w-full p-10 rounded-3xl border-white/10 bg-[#0f172a]/90 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white">¡Diagnóstico Recibido con Éxito!</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Hemos registrado tu solicitud en nuestra plataforma comercial de EDMYSOFT. Tus necesidades han sido analizadas por nuestro sistema.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 space-y-3 text-xs text-left">
            <div className="flex items-center gap-2.5 text-cyan-400 font-semibold">
              <Clock className="w-4 h-4" />
              <span>Próximos pasos en nuestro protocolo:</span>
            </div>
            <ul className="space-y-2 text-slate-300 pl-6 list-disc">
              <li>El asistente comercial o un asesor evaluará tu volumen y canales.</li>
              <li>Te enviaremos una propuesta preliminar formal por WhatsApp.</li>
              <li>Podrás agendar una sesión de demostración en vivo de 20 minutos sin costo.</li>
            </ul>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Volver al Inicio
            </Link>
            <a
              href="https://wa.me/573000000000?text=Hola%20EDMYSOFT,%20acabo%20de%20completar%20mi%20diagn%C3%B3stico%20comercial%20y%20quiero%20conversar%20de%20inmediato"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <MessageSquare className="w-4 h-4" />
              Hablar de inmediato por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
