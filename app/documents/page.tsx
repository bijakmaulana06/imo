"use client";

import React, { useEffect, useState } from "react";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/client";
import { DocumentTemplate } from "@/types/document";
import { FileText, ArrowRight, Sparkles, FileEdit, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function PublicDocumentsCatalogPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchActiveTemplates();
  }, []);

  const fetchActiveTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error("Gagal memuat daftar dokumen:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020510] text-foreground font-sans pb-20">
      <StarfieldBackground />
      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-accent-cyan/30 text-accent-cyan font-mono text-xs mb-4">
            <Sparkles className="w-3.5 h-3.5" /> AUTO-FORM DOCUMENT GENERATOR
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-yellow font-display">
            Layanan Pengisian Dokumen Otomatis
          </h1>
          <p className="mt-4 text-slate-300 text-base sm:text-lg">
            Pilih jenis dokumen di bawah ini, isi formulir dengan data Anda, dan unduh hasil cetak surat/dokumen dalam format PDF secara otomatis.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
            <p className="font-mono text-sm">Memuat daftar template...</p>
          </div>
        ) : templates.length === 0 ? (
          <Card glowColor="purple" className="text-center py-16 max-w-xl mx-auto">
            <FileText className="w-16 h-16 mx-auto text-accent-purple/50 mb-4 animate-pulse" />
            <h3 className="text-xl font-bold text-slate-200">Belum Ada Dokumen Tersedia</h3>
            <p className="text-slate-400 text-sm mt-2">
              Saat ini belum ada template dokumen aktif yang dipublikasikan oleh admin.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => (
              <Card
                key={tpl.id}
                glowColor="cyan"
                className="flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-300"
              >
                <div>
                  <div className="p-3 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan w-fit mb-4 group-hover:scale-110 transition-transform">
                    <FileEdit className="w-6 h-6" />
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2 line-clamp-2 font-display">
                    {tpl.title}
                  </h2>

                  <p className="text-slate-300 text-sm line-clamp-3 mb-6">
                    {tpl.description || "Dokumen pengisian otomatis."}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-cyan" /> Ready PDF Output
                  </span>

                  <Button href={`/documents/${tpl.id}`} variant="primary" size="sm">
                    Isi Dokumen <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
