import { Workflow, Zap, CheckCircle2, AlertCircle, Clock, Send, ShieldCheck } from 'lucide-react';

export default function AutomationsPage() {
  const automations = [
    {
      name: 'Alerta Inmediata de Nuevo Prospecto',
      desc: 'Dispara notificación por WhatsApp/Telegram al comercial cuando entra un lead desde el formulario o web.',
      status: 'ACTIVA',
      trigger: 'Nuevo registro en tabla Contact / Opportunity',
      action: 'Webhook n8n -> Notificación Push comercial',
    },
    {
      name: 'Detección de Oportunidades Estancadas',
      desc: 'Cron diario de n8n que revisa prospectos sin actividad en más de 48 horas y crea una tarea de recordatorio.',
      status: 'ACTIVA',
      trigger: 'Cron diario (09:00 AM America/Bogota)',
      action: 'Generar TaskReminder en CRM',
    },
    {
      name: 'Recordatorio Previo a Reunión de Diagnóstico',
      desc: 'Envía un mensaje de confirmación 2 horas antes de la sesión agendada en Google Calendar.',
      status: 'ACTIVA',
      trigger: '2 horas antes del evento en Google Calendar',
      action: 'Mensaje WhatsApp vía Meta Cloud API',
    },
    {
      name: 'Notificación de Anticipo Conciliado',
      desc: 'Actualiza el saldo de la cotización y avisa al equipo de ingeniería cuando Wompi confirma una transacción.',
      status: 'ACTIVA',
      trigger: 'Webhook Wompi status: APPROVED',
      action: 'Actualizar saldo en Quote y crear log',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">11. Automatizaciones y Flujos con n8n</h1>
          <p className="text-xs text-slate-400 mt-1">
            Orquestación visual de eventos de CRM, seguimiento de prospectos inactivos y webhooks bidireccionales.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {automations.map((auto, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-2xl border-white/5 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Workflow className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {auto.status}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{auto.name}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{auto.desc}</p>
            </div>

            <div className="pt-3 border-t border-white/5 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Disparador:</span>
                <span className="font-semibold text-slate-200">{auto.trigger}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Acción:</span>
                <span className="font-semibold text-cyan-400">{auto.action}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
