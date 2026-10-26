import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FloatingWhatsApp from '@/components/public/FloatingWhatsApp';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#090d16] text-slate-100">
      <Navbar />

      <section className="pt-20 pb-12 border-b border-white/5 bg-[#0b101c]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex p-2 rounded-xl bg-cyan-500/10 text-cyan-400 mb-1">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Política de Privacidad y Tratamiento de Datos</h1>
          <p className="text-xs text-slate-400">Cumplimiento de la Ley 1581 de 2012 (Habeas Data) — República de Colombia</p>
        </div>
      </section>

      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-xs leading-relaxed text-slate-300">
        <div className="glass-panel p-8 rounded-3xl border-white/10 bg-slate-900/60 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white mb-2">1. Responsable del Tratamiento</h3>
            <p>
              EDMYSOFT, con domicilio en Colombia, es el responsable del tratamiento de los datos personales recolectados a través de este sitio web, sus asistentes de inteligencia artificial y canales de mensajería oficiales.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-2">2. Finalidad de la Recolección</h3>
            <p>
              Los datos recolectados (nombre, teléfono, correo electrónico, empresa y requerimientos técnicos) tienen como única finalidad:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Contactar al titular para responder consultas comerciales y presentar cotizaciones.</li>
              <li>Evaluar la viabilidad técnica y capacidad requerida para la prestación de servicios.</li>
              <li>Gestionar el seguimiento comercial y la relación contractual si el cliente contrata una solución.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-2">3. Uso de Canales de Mensajería (WhatsApp y Meta)</h3>
            <p>
              Al proporcionar su número de teléfono o iniciar una conversación en WhatsApp, el usuario autoriza la recepción de mensajes comerciales, presupuestos y respuestas automatizadas. En cualquier momento el usuario puede solicitar pausar el asistente o ser atendido exclusivamente por un agente humano.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-2">4. Derechos del Titular y Canales de Ejercicio</h3>
            <p>
              De conformidad con la Ley 1581 de 2012, usted tiene derecho a conocer, actualizar, rectificar y suprimir sus datos personales. Para ejercer estos derechos, puede comunicarse a través del correo electrónico <strong className="text-cyan-400">contacto@edmysoft.com</strong> o mediante nuestra línea oficial de atención.
            </p>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
