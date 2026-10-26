'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Key,
  Mail,
  Phone,
  Briefcase,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  Lock,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface WorkerUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions?: string;
  parsedPermissions?: string[];
  phone?: string | null;
  jobTitle?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PermissionItem {
  id: string;
  label: string;
  desc: string;
}

const ROLES_OPTIONS = [
  { id: 'SUPERADMIN', label: 'Super Administrador', desc: 'Acceso total y sin restricciones a finanzas, credenciales e infraestructura' },
  { id: 'ADMIN', label: 'Administrador General', desc: 'Gestión de catálogo, clientes, equipo e integraciones' },
  { id: 'TRABAJADOR_VENTAS', label: 'Trabajador • Ventas & CRM', desc: 'Atención a prospectos, cotizaciones y seguimiento de embudo' },
  { id: 'TRABAJADOR_SOPORTE', label: 'Trabajador • Soporte Técnico', desc: 'Atención a tickets de clientes, chat en vivo y control humano' },
  { id: 'TECNICO', label: 'Desarrollador / Técnico', desc: 'Gestión de webhooks, n8n, catálogo y automatizaciones' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<WorkerUser[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<WorkerUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formJobTitle, setFormJobTitle] = useState('');
  const [formRole, setFormRole] = useState('TRABAJADOR_VENTAS');
  const [formPermissions, setFormPermissions] = useState<string[]>(['crm_leads', 'whatsapp_chat']);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        if (data.availablePermissions) setAvailablePermissions(data.availablePermissions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormPhone('');
    setFormJobTitle('');
    setFormRole('TRABAJADOR_VENTAS');
    setFormPermissions(['crm_leads', 'whatsapp_chat']);
    setModalOpen(true);
  };

  const openEditModal = (u: WorkerUser) => {
    setEditUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPassword('');
    setFormPhone(u.phone || '');
    setFormJobTitle(u.jobTitle || '');
    setFormRole(u.role);
    setFormPermissions(u.parsedPermissions || []);
    setModalOpen(true);
  };

  const togglePermission = (id: string) => {
    setFormPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      if (editUser) {
        // Actualizar usuario existente
        const res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editUser.id,
            name: formName,
            role: formRole,
            permissions: formPermissions,
            phone: formPhone,
            jobTitle: formJobTitle,
            password: formPassword || undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setStatusMsg({ type: 'success', text: `Usuario ${formName} actualizado con éxito.` });
          setModalOpen(false);
          fetchUsers();
        } else {
          setStatusMsg({ type: 'error', text: data.error || 'Error al actualizar.' });
        }
      } else {
        // Crear nuevo usuario
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            password: formPassword,
            role: formRole,
            permissions: formPermissions,
            phone: formPhone,
            jobTitle: formJobTitle,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setStatusMsg({ type: 'success', text: `Trabajador "${formName}" creado exitosamente.` });
          setModalOpen(false);
          fetchUsers();
        } else {
          setStatusMsg({ type: 'error', text: data.error || 'Error al crear usuario.' });
        }
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error en la petición.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar al colaborador "${name}" del equipo?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: `Usuario ${name} eliminado del equipo.` });
        fetchUsers();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'No se pudo eliminar.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message });
    }
  };

  const toggleStatus = async (user: WorkerUser) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          isActive: !user.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Control de Accesos RBAC
            </span>
            <span className="text-xs text-slate-400">• EDMYSOFT Technologies</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-cyan-400" />
            Equipo de Trabajo y Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Crea colaboradores, define sus cargos y asigna permisos específicos para el manejo de la plataforma.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-white/5 text-slate-300 transition-all text-xs flex items-center gap-2"
            title="Recargar usuarios"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Crear Nuevo Trabajador
          </button>
        </div>
      </div>

      {/* Alerta de estado */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-white/5 bg-slate-900/50">
          <span className="text-xs text-slate-400">Total Colaboradores</span>
          <p className="text-2xl font-black text-white mt-1">{users.length}</p>
          <span className="text-[11px] text-emerald-400">En plantilla oficial</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-white/5 bg-slate-900/50">
          <span className="text-xs text-slate-400">Administradores</span>
          <p className="text-2xl font-black text-cyan-400 mt-1">
            {users.filter((u) => u.role === 'SUPERADMIN' || u.role === 'ADMIN').length}
          </p>
          <span className="text-[11px] text-slate-400">Acceso a directrices y finanzas</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-white/5 bg-slate-900/50">
          <span className="text-xs text-slate-400">Trabajadores Operativos</span>
          <p className="text-2xl font-black text-indigo-400 mt-1">
            {users.filter((u) => u.role.startsWith('TRABAJADOR_') || u.role === 'TECNICO' || u.role === 'COMERCIAL').length}
          </p>
          <span className="text-[11px] text-slate-400">Ventas, Soporte y Desarrollo</span>
        </div>
      </div>

      {/* Listado de Trabajadores */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>Miembros del Equipo</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {users.length}
          </span>
        </h2>

        {loading ? (
          <div className="glass-panel p-12 rounded-2xl text-center border-white/5">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Cargando trabajadores...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center border-white/5">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">No hay colaboradores registrados</p>
            <p className="text-xs text-slate-500 mt-1">Crea el primer perfil de trabajador usando el botón superior.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {users.map((u) => {
              const isEdierOwner = u.email === 'ediergallego59@gmail.com';
              return (
                <div
                  key={u.id}
                  className={`glass-panel p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                    isEdierOwner
                      ? 'border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900/80 shadow-lg shadow-cyan-500/10'
                      : u.isActive
                      ? 'border-white/5 bg-slate-900/60 hover:border-white/10'
                      : 'border-rose-500/20 bg-rose-950/10 opacity-75'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Header de la tarjeta */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-md ${
                            isEdierOwner
                              ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white'
                              : u.role === 'ADMIN'
                              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                              : 'bg-slate-800 text-cyan-300'
                          }`}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                            {u.name}
                            {isEdierOwner && <ShieldCheck className="w-4 h-4 text-cyan-400" title="Director Técnico & Creador" />}
                          </h3>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-500" />
                            {u.jobTitle || (isEdierOwner ? 'Director General & AI Architect' : 'Colaborador')}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.role === 'SUPERADMIN'
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : u.role === 'ADMIN'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : u.role === 'TRABAJADOR_VENTAS'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>

                    {/* Datos de contacto */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5 text-[11px]">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Permisos asignados */}
                    <div className="space-y-1 pt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Permisos Activos:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {isEdierOwner || u.role === 'SUPERADMIN' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-semibold">
                            ⭐ Control Total (Superadmin)
                          </span>
                        ) : u.parsedPermissions && u.parsedPermissions.length > 0 ? (
                          u.parsedPermissions.map((pId) => {
                            const pObj = availablePermissions.find((ap) => ap.id === pId);
                            return (
                              <span
                                key={pId}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-300 border border-white/5"
                              >
                                {pObj ? pObj.label : pId}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Sin permisos asignados</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones de la tarjeta */}
                  <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between">
                    <button
                      onClick={() => toggleStatus(u)}
                      disabled={isEdierOwner}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-all ${
                        u.isActive
                          ? 'text-emerald-400 hover:text-rose-400'
                          : 'text-rose-400 hover:text-emerald-400'
                      }`}
                    >
                      {u.isActive ? '● Activo' : '○ Suspendido'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-all"
                        title="Editar permisos y datos"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!isEdierOwner && (
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Eliminar trabajador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Creación / Edición */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  {editUser ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editUser ? `Modificar Perfil: ${editUser.name}` : 'Crear Nuevo Trabajador'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editUser
                      ? 'Actualiza el cargo, contraseña o permisos de acceso.'
                      : 'Define las credenciales y accesos de tu colaborador.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Daniel Restrepo"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Cargo / Especialidad</label>
                  <input
                    type="text"
                    value={formJobTitle}
                    onChange={(e) => setFormJobTitle(e.target.value)}
                    placeholder="Ej: Asesor Comercial Senior"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    disabled={!!editUser}
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="trabajador@edmysoft.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white focus:border-cyan-400 outline-none ${
                      editUser ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">WhatsApp / Teléfono</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="573123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {editUser ? 'Cambiar Contraseña (dejar vacío para mantener actual)' : 'Contraseña de Acceso *'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required={!editUser}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editUser ? '••••••••' : 'Mínimo 6 caracteres'}
                    minLength={6}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white focus:border-cyan-400 outline-none"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Rol Principal en la Empresa</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white focus:border-cyan-400 outline-none"
                >
                  {ROLES_OPTIONS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                      {r.label} — ({r.desc})
                    </option>
                  ))}
                </select>
              </div>

              {/* Matriz de Permisos */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Permisos Granulares de Acceso:</span>
                  <span className="text-[10px] text-cyan-400">Selecciona las funciones permitidas</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availablePermissions.map((perm) => {
                    const isChecked = formPermissions.includes(perm.id) || formRole === 'SUPERADMIN';
                    return (
                      <label
                        key={perm.id}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          isChecked
                            ? 'border-cyan-500/40 bg-cyan-950/30'
                            : 'border-white/5 bg-slate-950/40 hover:border-white/10'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={formRole === 'SUPERADMIN'}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 accent-cyan-400 rounded"
                        />
                        <div>
                          <p className="font-bold text-white text-[11px]">{perm.label}</p>
                          <p className="text-[10px] text-slate-400 leading-tight">{perm.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{editUser ? 'Guardar Cambios' : 'Crear Colaborador'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
