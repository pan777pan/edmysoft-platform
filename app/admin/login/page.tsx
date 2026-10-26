'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('ediergallego59@gmail.com');
  const [password, setPassword] = useState('edsoft1013341239');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setSuccess(true);
        const targetUrl = data.redirectTo || '/admin';
        setRedirectUrl(targetUrl);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('edmysoft_session_user', JSON.stringify(data.user));
          } catch {
            /* ignore */
          }
          // Redirección directa y garantizada al panel administrativo
          window.location.href = targetUrl;
        }
        return;
      } else {
        setError(data.error || 'Credenciales inválidas. Revisa tu usuario y contraseña.');
        setLoading(false);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setError(
        err.name === 'AbortError'
          ? 'Tiempo de espera agotado al conectar con el servidor. Por favor, reintenta.'
          : 'Error de conexión con el servidor de autenticación'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Glow de fondo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Logo Brand */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-extrabold text-2xl text-white shadow-xl shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              E
            </div>
            <div className="text-left">
              <span className="font-extrabold text-xl text-white tracking-tight">
                EDMY<span className="text-cyan-400">SOFT</span>
              </span>
              <span className="text-[10px] text-slate-400 block font-semibold">
                Plataforma Oficial <strong className="text-cyan-400">EDMYSOFT</strong>
              </span>
            </div>
          </Link>
          <h1 className="text-xl font-bold text-white pt-2">Acceso a la Plataforma Administrativa</h1>
          <p className="text-xs text-slate-400">
            Control de Inteligencia Artificial, Conexión WhatsApp y Cotizaciones
          </p>
        </div>

        {/* Tarjeta de Login */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-[#0d1424] shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Correo Electrónico *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ediergallego59@gmail.com"
                  className="w-full rounded-xl bg-slate-900 border border-white/15 pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">Contraseña de Administrador *</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl bg-slate-900 border border-white/15 pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading && !success}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-300 hover:scale-105 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all mt-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {success
                  ? '✅ ¡Credenciales verificadas! Entrando al panel...'
                  : loading
                  ? 'Verificando credenciales...'
                  : 'Iniciar Sesión en EDMYSOFT Atiende'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {success && redirectUrl && (
              <div className="text-center pt-2">
                <a
                  href={redirectUrl}
                  className="text-cyan-400 underline hover:text-cyan-300 text-xs font-semibold inline-flex items-center gap-1"
                >
                  <span>¿No redirige automáticamente? Haz clic aquí para entrar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </form>

          {/* Credenciales Oficiales Pre-configuradas */}
          <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Credenciales Oficiales de Administración:</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('ediergallego59@gmail.com');
                  setPassword('edsoft1013341239');
                }}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline"
              >
                Autocompletar
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Usuario:</span>
                <span className="text-cyan-300 font-semibold">ediergallego59@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Clave:</span>
                <span className="text-cyan-300 font-semibold">edsoft1013341239</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic text-center pt-1">
              * Punto de acceso exclusivo para la dirección técnica y administración de EDMYSOFT.
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-4">
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            ← Volver al Sitio Comercial
          </Link>
          <span>•</span>
          <Link href="/portal" className="hover:text-cyan-400 transition-colors">
            Portal de Clientes
          </Link>
        </div>
      </div>
    </div>
  );
}
