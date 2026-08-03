"use client";

import React, { useEffect, useState, use } from "react";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/client";
import { DocumentFieldConfig, DocumentTemplate } from "@/types/document";
import {
  FileText,
  Download,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { Link } from "next-view-transitions";
import { useRouter } from "next/navigation";

export default function FillDocumentFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const templateId = resolvedParams.id;
  const router = useRouter();
  const supabase = createClient();

  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplateDetails();
  }, [templateId]);

  const fetchTemplateDetails = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (error || !data) {
        throw new Error("Template dokumen tidak ditemukan");
      }

      setTemplate(data);

      // Inisialisasi nilai awal formData berdasarkan fields_config
      const initialForm: Record<string, any> = {};
      if (Array.isArray(data.fields_config)) {
        data.fields_config.forEach((f: DocumentFieldConfig) => {
          if (f.type === "select" && f.options && f.options.length > 0) {
            initialForm[f.tag] = f.options[0];
          } else {
            initialForm[f.tag] = f.defaultValue || "";
          }
        });
      }
      setFormData(initialForm);
    } catch (err: any) {
      console.error("Fetch template error:", err);
      setErrorMsg(err.message || "Gagal memuat template dokumen");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (tag: string, value: any) => {
    setFormData((prev) => ({ ...prev, [tag]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          formData,
          outputFormat: "pdf",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal meng-generate dokumen PDF");
      }

      // Ambil file buffer sebagai blob
      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      let fileName = `${template?.title || "dokumen"}_terisi.pdf`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      // Trigger unduhan otomatis di browser
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMsg("Dokumen berhasil di-generate dan sedang diunduh!");
    } catch (err: any) {
      console.error("Submit form error:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat memproses dokumen");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen z-0 bg-[#020510] text-foreground font-sans flex items-center justify-center">
        <StarfieldBackground />
        <div className="relative z-10 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
          <p className="font-mono text-sm">Memuat formulir dokumen...</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !template) {
    return (
      <div className="relative min-h-screen z-0 bg-[#020510] text-foreground font-sans pt-28">
        <StarfieldBackground />
        <Navbar />
        <main className="relative z-10 max-w-xl mx-auto px-4">
          <Card glowColor="purple" className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto text-rose-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Terjadi Kesalahan</h2>
            <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
            <Button href="/documents" variant="primary">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Katalog
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col z-0 bg-[#020510] text-foreground font-sans pb-20">
      <StarfieldBackground />
      <Navbar />

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        {/* Navigation */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/documents"
            className="p-2 rounded-xl glass hover:bg-accent-cyan/10 text-accent-cyan transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            Pengisian Dokumen Otomatis
          </span>
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

        {/* Form Card */}
        <Card glowColor="cyan" className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 text-accent-cyan font-mono text-xs mb-1">
              <FileText className="w-4 h-4" /> FORMULARIS DOKUMEN
            </div>
            <h1 className="text-3xl font-extrabold text-white font-display">
              {template?.title}
            </h1>
            {template?.description && (
              <p className="mt-2 text-slate-300 text-sm">{template.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {Array.isArray(template?.fields_config) &&
              template.fields_config.map((field: DocumentFieldConfig) => (
                <div key={field.id} className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    {field.label}{" "}
                    {field.required !== false && (
                      <span className="text-rose-400">*</span>
                    )}
                    <span className="ml-2 text-xs font-mono text-slate-500 font-normal">
                      (&#123;{field.tag}&#125;)
                    </span>
                  </label>

                  {/* Input Type: Text */}
                  {field.type === "text" && (
                    <input
                      type="text"
                      placeholder={field.placeholder || `Masukkan ${field.label}...`}
                      value={formData[field.tag] || ""}
                      onChange={(e) => handleInputChange(field.tag, e.target.value)}
                      required={field.required !== false}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-card-border text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition"
                    />
                  )}

                  {/* Input Type: Number */}
                  {field.type === "number" && (
                    <input
                      type="number"
                      placeholder={field.placeholder || `Masukkan angka...`}
                      value={formData[field.tag] || ""}
                      onChange={(e) => handleInputChange(field.tag, e.target.value)}
                      required={field.required !== false}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-card-border text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition"
                    />
                  )}

                  {/* Input Type: Date Picker */}
                  {field.type === "date" && (
                    <div className="relative">
                      <input
                        type="date"
                        value={formData[field.tag] || ""}
                        onChange={(e) => handleInputChange(field.tag, e.target.value)}
                        required={field.required !== false}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-card-border text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Input Type: Select (Dropdown) */}
                  {field.type === "select" && (
                    <div className="relative">
                      <select
                        value={formData[field.tag] || ""}
                        onChange={(e) => handleInputChange(field.tag, e.target.value)}
                        required={field.required !== false}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-card-border text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition appearance-none cursor-pointer pr-10"
                      >
                        {Array.isArray(field.options) &&
                          field.options.map((opt, idx) => (
                            <option key={idx} value={opt} className="bg-slate-900 text-white">
                              {opt}
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="w-5 h-5 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  )}

                  {/* Input Type: Textarea */}
                  {field.type === "textarea" && (
                    <textarea
                      rows={3}
                      placeholder={field.placeholder || `Masukkan ${field.label}...`}
                      value={formData[field.tag] || ""}
                      onChange={(e) => handleInputChange(field.tag, e.target.value)}
                      required={field.required !== false}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-card-border text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition"
                    />
                  )}
                </div>
              ))}

            <div className="pt-4 border-t border-white/10">
              <Button
                variant="galaxy"
                type="submit"
                disabled={submitting}
                className="w-full py-4 text-base"
              >
                <Download className="w-5 h-5 mr-2" />
                {submitting ? "Mengolah PDF..." : "Unduh Dokumen PDF"}
              </Button>
              <p className="text-center text-xs text-slate-400 mt-3 font-mono">
                * Dokumen langsung di-generate & diunduh secara on-the-fly tanpa disimpan di server.
              </p>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
