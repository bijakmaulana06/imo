"use client";

import React, { useEffect, useState } from "react";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/client";
import { DocumentTemplate } from "@/types/document";
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Settings2,
  Download,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function AdminDocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      console.error("Fetch templates error:", err);
      setErrorMsg("Gagal memuat template dokumen dari database.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("document_templates")
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: !currentStatus } : t))
      );
      setSuccessMsg("Status template berhasil diperbarui");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert("Gagal mengubah status template: " + err.message);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus template dokumen ini?")) return;
    try {
      const { error } = await supabase.from("document_templates").delete().eq("id", id);
      if (error) throw error;
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setSuccessMsg("Template berhasil dihapus");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert("Gagal menghapus template: " + err.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020510] text-foreground font-sans pb-20">
      <StarfieldBackground />
      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/dashboard"
                className="p-2 rounded-xl glass hover:bg-accent-cyan/10 text-accent-cyan transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-yellow font-display">
                Kelola Auto Form Template
              </h1>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Kelola template dokumen `.docx` dan konfigurasi tag form dinamis.
            </p>
          </div>

          <Button href="/admin/document-templates/create" variant="galaxy">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Template Baru
          </Button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl glass border-emerald-500/40 text-emerald-400 flex items-center gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl glass border-rose-500/40 text-rose-400 flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
            <p className="font-mono text-sm">Memuat data template...</p>
          </div>
        ) : templates.length === 0 ? (
          <Card glowColor="purple" className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto text-accent-purple/50 mb-4 animate-pulse" />
            <h3 className="text-xl font-bold text-slate-200">Belum Ada Template Dokumen</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
              Unggah file `.docx` pertama Anda yang berisi tag seperti &#123;nama&#125;, &#123;nim&#125;, untuk membuat form pengisian otomatis.
            </p>
            <div className="mt-6">
              <Button href="/admin/document-templates/create" variant="primary">
                <Plus className="w-4 h-4 mr-2" /> Buat Template
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => (
              <Card
                key={tpl.id}
                glowColor={tpl.is_active ? "cyan" : "purple"}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-accent-cyan/30 text-accent-cyan">
                      <FileText className="w-6 h-6" />
                    </div>

                    <button
                      onClick={() => toggleStatus(tpl.id, tpl.is_active)}
                      className={`px-3 py-1 text-xs font-mono rounded-full border transition flex items-center gap-1.5 cursor-pointer ${
                        tpl.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      {tpl.is_active ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" /> Aktif
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Non-aktif
                        </>
                      )}
                    </button>
                  </div>

                  <h2 className="text-xl font-bold text-white mb-2 line-clamp-1">
                    {tpl.title}
                  </h2>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                    {tpl.description || "Tidak ada deskripsi"}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
                      <span>Jumlah Tag/Field:</span>
                      <span className="text-accent-cyan font-bold">
                        {Array.isArray(tpl.fields_config) ? tpl.fields_config.length : 0} Field
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Array.isArray(tpl.fields_config) &&
                        tpl.fields_config.slice(0, 4).map((f: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[11px] font-mono bg-slate-900/90 text-accent-cyan border border-accent-cyan/20 rounded-md"
                          >
                            &#123;{f.tag}&#125;
                          </span>
                        ))}
                      {Array.isArray(tpl.fields_config) && tpl.fields_config.length > 4 && (
                        <span className="px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-900/50 rounded-md">
                          +{tpl.fields_config.length - 4} lagi
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10 gap-2">
                  <a
                    href={tpl.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-400 hover:text-accent-cyan transition rounded-lg hover:bg-slate-900"
                    title="Unduh Master Docx"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/documents/${tpl.id}`}
                      target="_blank"
                      className="px-3 py-1.5 text-xs font-mono rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/20 transition"
                    >
                      Uji Form
                    </Link>

                    <button
                      onClick={() => deleteTemplate(tpl.id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition"
                      title="Hapus Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
