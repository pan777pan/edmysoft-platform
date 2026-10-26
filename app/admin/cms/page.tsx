'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  Send,
  RotateCcw,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatDateTimeCO } from '@/lib/formatters';

interface SectionItem {
  id: string;
  sectionKey: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  order: number;
  isVisible: boolean;
}

interface PageData {
  id: string;
  slug: string;
  title: string;
  seoTitle: string | null;
  seoDesc: string | null;
  status: string;
  updatedAt: string;
  sections: SectionItem[];
  revisions: {
    id: string;
    version: number;
    publishedBy: string;
    createdAt: string;
  }[];
}

export default function VisualCMSPage() {
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const fetchPage = async () => {
    try {
      const res = await fetch('/api/cms/pages/home');
      const data = await res.json();
      if (data.success) {
        setPage(data.page);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage();
  }, []);

  // Guardar como Borrador
  const handleSaveDraft = async () => {
    if (!page) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cms/pages/${page.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: page.title,
          seoTitle: page.seoTitle,
          seoDesc: page.seoDesc,
          sections: page.sections,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchPage();
        alert('Borrador guardado correctamente. Los cambios están listos para ser publicados.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Publicar Cambios en Vivo
  const handlePublish = async () => {
    if (!page) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/cms/pages/${page.slug}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishedBy: 'Edier Mery Gallego' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchPage();
        alert(`¡Cambios publicados en vivo con éxito! Se ha creado la Versión ${data.version}.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPublishing(false);
    }
  };

  // Revertir a Versión Histórica Previa
  const handleRevert = async (revisionId: string, versionNum: number) => {
    if (!page || !confirm(`¿Deseas restaurar la Versión ${versionNum}? Se sobrescribirán los borradores no publicados.`)) return;
    setRevertingId(revisionId);
    try {
      const res = await fetch(`/api/cms/pages/${page.slug}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchPage();
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRevertingId(null);
    }
  };

  if (loading || !page) {
    return <div className="py-12 text-center text-xs text-slate-500">Cargando editor CMS...</div>;
  }

  // Secciones específicas
  const heroSection = page.sections.find((s) => s.sectionKey === 'hero');
  const respaldoSection = page.sections.find((s) => s.sectionKey === 'respaldo_tusoft');

  return (
    <div className="space-y-6">
      {/* CABECERA DEL CMS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                page.status === 'PUBLISHED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {page.status === 'PUBLISHED' ? 'Todo Publicado (Live)' : 'Borrador con Cambios Pendientes'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Editor Visual de la Web (CMS)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Administra los textos, botones, imágenes y secciones comerciales de EDMYSOFT sin tocar el código fuente.
          </p>
        </div>

        {/* BOTONES DE ACCIÓN: BORRADOR, PREVIEW, PUBLICAR */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              previewMode
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {previewMode ? 'Cerrar Previsualización' : 'Previsualizar'}
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Guardar Borrador
          </button>

          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-300 hover:scale-105 shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Publicar Cambios en Vivo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUMNA PRINCIPAL DE EDICIÓN (8 COLUMNAS) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. SECCIÓN HERO COMERCIAL */}
          {heroSection && (
            <div className="glass-panel p-6 rounded-3xl border-white/5 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  1. Sección Principal (Hero Section)
                </span>
                <span className="text-[10px] font-mono text-cyan-400">sectionKey: hero</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Titular Principal (H1 en Web Pública):
                  </label>
                  <input
                    type="text"
                    value={heroSection.title || ''}
                    onChange={(e) => {
                      const updated = { ...heroSection, title: e.target.value };
                      setPage({
                        ...page,
                        sections: page.sections.map((s) => (s.id === heroSection.id ? updated : s)),
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Subtítulo / Propuesta de Valor:
                  </label>
                  <textarea
                    rows={3}
                    value={heroSection.subtitle || ''}
                    onChange={(e) => {
                      const updated = { ...heroSection, subtitle: e.target.value };
                      setPage({
                        ...page,
                        sections: page.sections.map((s) => (s.id === heroSection.id ? updated : s)),
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {heroSection.content && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">Texto del Botón Primario:</label>
                      <input
                        type="text"
                        value={heroSection.content.primaryBtnText || ''}
                        onChange={(e) => {
                          const updatedContent = { ...heroSection.content, primaryBtnText: e.target.value };
                          const updated = { ...heroSection, content: updatedContent };
                          setPage({
                            ...page,
                            sections: page.sections.map((s) => (s.id === heroSection.id ? updated : s)),
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">Enlace del Botón Primario:</label>
                      <input
                        type="text"
                        value={heroSection.content.primaryBtnLink || ''}
                        onChange={(e) => {
                          const updatedContent = { ...heroSection.content, primaryBtnLink: e.target.value };
                          const updated = { ...heroSection, content: updatedContent };
                          setPage({
                            ...page,
                            sections: page.sections.map((s) => (s.id === heroSection.id ? updated : s)),
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. SECCIÓN RESPALDO TUSOFT & EDIER MERY GALLEGO */}
          {respaldoSection && (
            <div className="glass-panel p-6 rounded-3xl border-white/5 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  2. Liderazgo de Edier Mery Gallego & Respaldo TuSoft
                </span>
                <span className="text-[10px] font-mono text-emerald-400">sectionKey: respaldo_tusoft</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Título de la Sección:</label>
                  <input
                    type="text"
                    value={respaldoSection.title || ''}
                    onChange={(e) => {
                      const updated = { ...respaldoSection, title: e.target.value };
                      setPage({
                        ...page,
                        sections: page.sections.map((s) => (s.id === respaldoSection.id ? updated : s)),
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Descripción del Modelo:</label>
                  <textarea
                    rows={3}
                    value={respaldoSection.subtitle || ''}
                    onChange={(e) => {
                      const updated = { ...respaldoSection, subtitle: e.target.value };
                      setPage({
                        ...page,
                        sections: page.sections.map((s) => (s.id === respaldoSection.id ? updated : s)),
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                {respaldoSection.content && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-3">
                    <span className="text-[11px] font-bold text-emerald-400 block">Datos del Líder Técnico:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 text-[10px] block">Nombre Completo:</label>
                        <input
                          type="text"
                          value={respaldoSection.content.leadName || ''}
                          onChange={(e) => {
                            const updatedContent = { ...respaldoSection.content, leadName: e.target.value };
                            const updated = { ...respaldoSection, content: updatedContent };
                            setPage({
                              ...page,
                              sections: page.sections.map((s) => (s.id === respaldoSection.id ? updated : s)),
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px] block">Línea WhatsApp:</label>
                        <input
                          type="text"
                          value={respaldoSection.content.leadPhone || ''}
                          onChange={(e) => {
                            const updatedContent = { ...respaldoSection.content, leadPhone: e.target.value };
                            const updated = { ...respaldoSection, content: updatedContent };
                            setPage({
                              ...page,
                              sections: page.sections.map((s) => (s.id === respaldoSection.id ? updated : s)),
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA LATERAL: METADATOS SEO E HISTORIAL DE VERSIONES (4 COLUMNAS) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Metadatos SEO */}
          <div className="glass-panel p-6 rounded-3xl border-white/5 bg-slate-900/60 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Metadatos SEO de la Página
            </span>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Título de Pestaña (SEO Title):</label>
                <input
                  type="text"
                  value={page.seoTitle || ''}
                  onChange={(e) => setPage({ ...page, seoTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Meta Descripción:</label>
                <textarea
                  rows={3}
                  value={page.seoDesc || ''}
                  onChange={(e) => setPage({ ...page, seoDesc: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* HISTORIAL DE REVISIONES Y BOTÓN DE REVERSIÓN */}
          <div className="glass-panel p-6 rounded-3xl border-white/5 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Historial de Versiones
              </span>
              <span className="text-[10px] text-slate-500">{page.revisions.length} Guardadas</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {page.revisions.map((rev) => (
                <div key={rev.id} className="p-3.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">Versión {rev.version}</span>
                    <span className="text-[10px] text-slate-500">
                      {formatDateTimeCO(rev.createdAt)} • {rev.publishedBy}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRevert(rev.id, rev.version)}
                    disabled={revertingId === rev.id}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 flex items-center gap-1 transition-colors"
                  >
                    {revertingId === rev.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
