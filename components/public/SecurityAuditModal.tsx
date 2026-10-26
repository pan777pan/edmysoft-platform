'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Play, X, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface TestResult {
  num: number;
  scenario: string;
  expected: string;
  actual: string;
  status: 'APROBADA' | 'FALLIDA';
}

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SecurityAuditModal({ isOpen, onClose }: SecurityAuditModalProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>('Lista para ejecutar');
  const [results, setResults] = useState<TestResult[]>([]);
  const [allPassed, setAllPassed] = useState<boolean>(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portal/security-tests', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setSummary(data.summary);
        setAllPassed(data.allPassed);
      } else {
        setSummary('Error al ejecutar las pruebas en servidor');
      }
    } catch (err: any) {
      setSummary('Error de conexión con el motor de pruebas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && results.length === 0) {
      runTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-emerald-500/30 shadow-2xl overflow-hidden bg-[#0c121e]">
        {/* Encabezado */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Suite Automatizada de Verificación de Seguridad (15 Escenarios OWASP)
              </h3>
              <p className="text-xs text-slate-400">
                Ejecuta pruebas reales contra autorización RBAC, aislamiento por propietario (BOLA/IDOR), sesiones y transacciones ACID.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Acciones y Estado */}
        <div className="p-5 overflow-y-auto space-y-4 flex-grow text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-white/10">
            <div>
              <span className="text-slate-400 block">Estado de la Suite de Integración:</span>
              <span
                className={`font-bold text-sm flex items-center gap-1.5 mt-0.5 ${
                  allPassed ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {allPassed && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {summary}
              </span>
            </div>
            <button
              onClick={runTests}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Ejecutar 15 Pruebas Ahora</span>
                </>
              )}
            </button>
          </div>

          {/* Tabla de Resultados */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-300 border-b border-white/10">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Escenario de Prueba (OWASP)</th>
                  <th className="py-2.5 px-3">Resultado Esperado</th>
                  <th className="py-2.5 px-3">Resultado Obtenido</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 bg-slate-950/60 font-sans">
                {results.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Haz clic en &quot;Ejecutar 15 Pruebas Ahora&quot; para iniciar la auditoría en tiempo real.
                    </td>
                  </tr>
                )}
                {results.map((r) => (
                  <tr key={r.num} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{r.num}</td>
                    <td className="py-2.5 px-3 font-medium text-white">{r.scenario}</td>
                    <td className="py-2.5 px-3 text-slate-400">{r.expected}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                      {r.actual}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          r.status === 'APROBADA'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="p-4 bg-slate-900/80 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>EDMYSOFT Security Shield • OWASP Top 10 Compliance</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Cerrar Consola
          </button>
        </div>
      </div>
    </div>
  );
}
