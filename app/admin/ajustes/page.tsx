import prisma from '@/lib/prisma';
import { Settings, Save, Shield, Bot, DollarSign, Clock, Phone } from 'lucide-react';


export default async function AdminSettingsPage() {
  const settings = await prisma.systemSetting.findMany({
    orderBy: { group: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">15. Ajustes y Configuración de EDMYSOFT</h1>
          <p className="text-xs text-slate-400 mt-1">
            Personaliza los nombres comerciales, monedas, umbrales de autonomía y parámetros del sistema sin tocar código.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ajustes Generales y de Marca */}
        <div className="glass-panel p-6 rounded-3xl border-white/5 bg-slate-900/60 space-y-5">
          <div className="flex items-center gap-2.5 text-cyan-400">
            <Settings className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Identidad y Marca</h3>
          </div>

          <div className="space-y-4 text-xs">
            {settings
              .filter((s) => s.group === 'GENERAL')
              .map((s) => (
                <div key={s.id} className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">{s.description || s.key}</label>
                  <input
                    type="text"
                    defaultValue={s.value}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">Clave en DB: {s.key}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Ajustes de IA y Límites de Autonomía */}
        <div className="glass-panel p-6 rounded-3xl border-white/5 bg-slate-900/60 space-y-5">
          <div className="flex items-center gap-2.5 text-indigo-400">
            <Bot className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Inteligencia Artificial & Facturación</h3>
          </div>

          <div className="space-y-4 text-xs">
            {settings
              .filter((s) => s.group === 'AI' || s.group === 'BILLING' || s.group === 'INTEGRATIONS')
              .map((s) => (
                <div key={s.id} className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">{s.description || s.key}</label>
                  <input
                    type="text"
                    defaultValue={s.value}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">Clave en DB: {s.key}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
