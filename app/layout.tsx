import type { Metadata } from 'next';
import './globals.css';
import AIChatWidget from '@/components/public/AIChatWidget';

export const metadata: Metadata = {
  title: 'EDMYSOFT | Inteligencia Artificial, Desarrollo Web y Automatización - Tecnología, Software & Automatización',
  description:
    'Plataforma comercial y tecnológica para empresas. Asistentes de IA para WhatsApp, flujos automatizados con n8n, software a medida y cotizador dinámico.',
  keywords: [
    'Inteligencia Artificial',
    'WhatsApp Business API',
    'Automatización de ventas',
    'n8n Colombia',
    'Desarrollo web',
    'Software a medida',
    'EDMYSOFT',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark h-full">
      <body className="min-h-screen bg-[#070b14] text-slate-100 antialiased flex flex-col">
        {children}
        <AIChatWidget />
      </body>
    </html>
  );
}
