'use client';

import { useState, useEffect } from 'react';
import {
  Radio,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  Key,
} from 'lucide-react';

interface IntegrationItem {
  id: string;
  name: string;
  provider: string;
  category: string;
  status: 'CONNECTED' | 'CONFIGURED_TEST_MODE' | 'LOCAL_FALLBACK_ACTIVE' | 'DISCONNECTED';
  details: string;
  lastPing: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations/status');
      const data = await res.json();
      if (data.success) {
        setIntegrations(data.integrations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">12. Canales e Integraciones</h1>
          <p className="text-xs text-slate-400 mt-1">
            Estado de salud técnico real de APIs oficiales de Meta, pasarelas de pago, Google Calendar y OpenRouter.
          </p>
        </div>

        <button
          onClick={fetchIntegrations}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Verificar Estado de Conexiones
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => {
          let badgeColor = 'bg-slate-800 text-slate-400';
          let statusText = 'Desconectado';

          if (item.status === 'CONNECTED') {
            badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            statusText = 'Conectado Oficial';
          } else if (item.status === 'CONFIGURED_TEST_MODE') {
            badgeColor = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
            statusText = 'Modo Pruebas / Sandbox';
          } else if (item.status === 'LOCAL_FALLBACK_ACTIVE') {
            badgeColor = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
            statusText = 'Motor Local Activo';
          }

          return (
            <div key={item.id} className="glass-panel p-6 rounded-2xl border-white/5 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">{item.category}</span>
                  <h3 className="text-base font-bold text-white">{item.name}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeColor}`}>
                  {statusText}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{item.details}</p>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                <span>Proveedor: {item.provider}</span>
                <span className="text-cyan-400 font-mono text-[10px]">Variables en .env</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
