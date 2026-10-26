import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FloatingWhatsApp from '@/components/public/FloatingWhatsApp';
import AIChatFullPage from '@/components/public/AIChatFullPage';

export const metadata = {
  title: 'Asistente Virtual IA | EDMYSOFT Inteligencia Artificial',
  description:
    'Conversa con nuestro agente de Inteligencia Artificial entrenado con toda la información de EDMYSOFT. Consulta precios oficiales, cotiza tu software y agenda reuniones.',
};

export default function AsistenteIAPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#070b14] text-slate-100 font-sans">
      <Navbar />
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 inline-block">
            Asistente Oficial con IA & RAG
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            EDMYSOFT Atiende — Consulta en Tiempo Real
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Resuelve cualquier duda sobre nuestras soluciones, tarifas en COP, nuestras soluciones en Colombia o solicita agendamiento con Edier Mery Gallego.
          </p>
        </div>

        <AIChatFullPage />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
