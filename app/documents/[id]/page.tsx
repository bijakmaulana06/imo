"use client";

import React, { useEffect, useState, useRef, use } from "react";
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
  ChevronDown,
  Eye,
  Edit3,
  FileType,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Link } from "next-view-transitions";
import { useRouter } from "next/navigation";
import {
  generateFilledDocxBuffer,
  calculateFormProgress,
} from "@/lib/documentPreview";
import DocumentRealtimePreview from "@/components/documents/DocumentRealtimePreview";
import { motion, AnimatePresence } from "framer-motion";

function getFieldPlaceholder(field: DocumentFieldConfig): string {
  if (field.placeholder && field.placeholder.trim()) return field.placeholder;
  const labelLower = (field.label || "").toLowerCase();
  const tagLower = (field.tag || "").toLowerCase();
  if (labelLower.includes("nama") || tagLower.includes("nama")) {
    return "Xaviera Putri";
  }
  if (labelLower.includes("nim") || tagLower.includes("nim")) {
    return "260xxxxxxxx";
  }
  if (labelLower.includes("prodi") || tagLower.includes("jurusan")) {
    return "Teknik Informatika";
  }
  if (labelLower.includes("fakultas")) {
    return "Fakultas Ilmu Komputer";
  }
  if (labelLower.includes("phone") || labelLower.includes("telepon") || labelLower.includes("hp")) {
    return "08123456789";
  }
  if (labelLower.includes("alamat")) {
    return "Jl. Merdeka No. 12, Jakarta";
  }
  return `Masukkan ${field.label}...`;
}

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
  const [submittingDocx, setSubmittingDocx] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Raw docx template buffer & filled docx buffer for real preview
  const [rawDocxBuffer, setRawDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [filledDocxBuffer, setFilledDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(true);

  // Mobile View Tab: 'form' or 'preview'
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");

  // Input elements ref mapping for smooth auto-focus
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>({});

  // 1. Fetch template details & initial form state
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
            initialForm[f.tag] = f.defaultValue || f.options[0];
          } else {
            initialForm[f.tag] = f.defaultValue || "";
          }
        });
      }
      setFormData(initialForm);

      // 2. Fetch template .docx ArrayBuffer for Client-side realtime preview
      try {
        let buffer: ArrayBuffer | null = null;
        const targetUrl = data.file_url || "";

        // First attempt: API proxy for guaranteed CORS safety
        const proxyRes = await fetch(`/api/documents/template-file?id=${data.id}`);
        if (proxyRes.ok) {
          buffer = await proxyRes.arrayBuffer();
        } else if (targetUrl.startsWith("http")) {
          // Direct fallback
          const directRes = await fetch(targetUrl);
          if (directRes.ok) {
            buffer = await directRes.arrayBuffer();
          }
        }

        if (buffer) {
          setRawDocxBuffer(buffer);
          // Initial filled buffer render
          const initialFilled = generateFilledDocxBuffer(buffer, initialForm, data.fields_config || []);
          setFilledDocxBuffer(initialFilled);
        }
      } catch (bufErr) {
        console.warn("Could not prefetch docx buffer for preview:", bufErr);
      }
    } catch (err: any) {
      console.error("Fetch template error:", err);
      setErrorMsg(err.message || "Gagal memuat template dokumen");
    } finally {
      setLoading(false);
      setPreviewLoading(false);
    }
  };

  // 3. Realtime DOCX buffer updater with 100ms debounce
  useEffect(() => {
    if (!rawDocxBuffer || !template) return;

    let isMounted = true;
    setPreviewLoading(true);

    const timer = setTimeout(() => {
      try {
        const updatedBuffer = generateFilledDocxBuffer(
          rawDocxBuffer,
          formData,
          template.fields_config || []
        );

        if (isMounted) {
          setFilledDocxBuffer(updatedBuffer);
          setPreviewLoading(false);
        }
      } catch (err) {
        console.error("Realtime docx update error:", err);
        if (isMounted) {
          setPreviewLoading(false);
        }
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [formData, rawDocxBuffer, template]);

  const progressStats = calculateFormProgress(formData, template?.fields_config || []);
  const { totalFields, filledCount, missingRequired } = progressStats;
  const isFormComplete = missingRequired.length === 0 && totalFields > 0;

  const handleInputChange = (tag: string, value: any) => {
    setFormData((prev) => ({ ...prev, [tag]: value }));
  };

  const handleFocusField = (labelOrTag: string) => {
    // Switch back to form tab on mobile
    setMobileTab("form");

    // Match field by label or tag
    const targetField = template?.fields_config?.find(
      (f) =>
        f.label?.toLowerCase() === labelOrTag.toLowerCase() ||
        f.tag?.toLowerCase() === labelOrTag.toLowerCase()
    );

    const tagToFocus = targetField ? targetField.tag : labelOrTag;
    const el = inputRefs.current[tagToFocus];

    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }, 150);
    }
  };

  const handleDownload = async (format: "pdf" | "docx" = "pdf") => {
    if (format === "docx") {
      setSubmittingDocx(true);
    } else {
      setSubmitting(true);
    }
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          formData,
          outputFormat: format,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Gagal meng-generate dokumen ${format.toUpperCase()}`);
      }

      // Ambil file buffer sebagai blob
      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      let fileName = `${template?.title || "dokumen"}_terisi.${format}`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      // Trigger unduhan di browser
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMsg(`Dokumen ${format.toUpperCase()} resmi berhasil di-generate dan siap digunakan!`);
    } catch (err: any) {
      console.error("Submit form error:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat memproses dokumen");
    } finally {
      setSubmitting(false);
      setSubmittingDocx(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleDownload("pdf");
  };

  if (loading) {
    return (
      <div className="relative min-h-screen z-0 bg-[#020510] text-foreground font-sans flex items-center justify-center">
        <StarfieldBackground />
        <div className="relative z-10 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
          <p className="font-mono text-sm">Memuat formulir dokumen & pratinjau asli...</p>
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
    <div className="relative min-h-screen flex flex-col z-0 bg-[#020510] text-foreground font-sans pb-28 sm:pb-20">
      <StarfieldBackground />
      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 w-full">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/documents"
              className="p-2.5 rounded-2xl glass hover:bg-accent-cyan/10 text-accent-cyan transition flex items-center justify-center border border-white/10"
              title="Kembali ke Katalog Dokumen"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[10px] font-mono text-accent-cyan uppercase tracking-widest font-bold block">
                Auto-Form Document Generator
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-display line-clamp-1">
                {template?.title}
              </h1>
            </div>
          </div>

          {/* Quick Stats Badge */}
          <div className="flex items-center space-x-2 bg-slate-900/90 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md w-fit shadow-lg">
            <span className="text-xs font-mono text-slate-400">Data:</span>
            <span
              className={`text-xs font-mono font-bold ${
                isFormComplete ? "text-emerald-400" : "text-accent-cyan"
              }`}
            >
              {filledCount}/{totalFields} Terisi
            </span>
            {isFormComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            )}
          </div>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl glass border-emerald-500/40 text-emerald-300 flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-fade-in">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl glass border-rose-500/40 text-rose-300 flex items-center gap-3 shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Mobile Segmented Tab Switcher (Visible on < lg) */}
        <div className="lg:hidden mb-6 p-1 bg-slate-950/80 border border-white/10 rounded-2xl backdrop-blur-xl grid grid-cols-2 gap-1 sticky top-20 z-30 shadow-xl">
          <button
            type="button"
            onClick={() => setMobileTab("form")}
            className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              mobileTab === "form"
                ? "bg-gradient-to-r from-accent-cyan to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>1. Form Pengisian</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              mobileTab === "preview"
                ? "bg-gradient-to-r from-accent-cyan to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>2. Real Preview Asli</span>
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[9px] bg-slate-900 text-cyan-300 border border-cyan-400/30">
              Live
            </span>
          </button>
        </div>

        {/* Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Input Form */}
          <div
            className={`lg:col-span-5 space-y-6 ${
              mobileTab === "preview" ? "hidden lg:block" : "block"
            }`}
          >
            <Card glowColor="cyan" className="space-y-6">
              <div className="border-b border-white/10 pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-accent-cyan font-mono text-xs mb-1">
                    <FileText className="w-4 h-4" /> DATA FORMULIR
                  </div>
                  <h2 className="text-xl font-bold text-white font-display">
                    Lengkapi Data Diri
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {filledCount}/{totalFields} Selesai
                </span>
              </div>

              {template?.description && (
                <p className="text-slate-300 text-xs leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                  {template.description}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {Array.isArray(template?.fields_config) &&
                  template.fields_config.map((field: DocumentFieldConfig) => {
                    const isFieldFilled =
                      formData[field.tag] !== undefined &&
                      formData[field.tag] !== null &&
                      String(formData[field.tag]).trim() !== "";

                    return (
                      <div
                        key={field.id}
                        className={`space-y-1.5 p-3 rounded-2xl transition border ${
                          isFieldFilled
                            ? "bg-cyan-950/20 border-cyan-500/20"
                            : "bg-slate-900/40 border-white/5"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-slate-200">
                            {field.label}{" "}
                            {field.required !== false && (
                              <span className="text-rose-400">*</span>
                            )}
                          </label>
                          <span className="text-[10px] font-mono text-slate-500">
                            &#123;{field.tag}&#125;
                          </span>
                        </div>

                        {/* Input Type: Text */}
                        {field.type === "text" && (
                          <input
                            ref={(el) => {
                              inputRefs.current[field.tag] = el;
                            }}
                            type="text"
                            placeholder={getFieldPlaceholder(field)}
                            value={formData[field.tag] || ""}
                            onChange={(e) => handleInputChange(field.tag, e.target.value)}
                            required={field.required !== false}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition placeholder:text-slate-600"
                          />
                        )}

                        {/* Input Type: Number */}
                        {field.type === "number" && (
                          <input
                            ref={(el) => {
                              inputRefs.current[field.tag] = el;
                            }}
                            type="number"
                            placeholder={field.placeholder || `Masukkan angka...`}
                            value={formData[field.tag] || ""}
                            onChange={(e) => handleInputChange(field.tag, e.target.value)}
                            required={field.required !== false}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition placeholder:text-slate-600"
                          />
                        )}

                        {/* Input Type: Date Picker */}
                        {field.type === "date" && (
                          <input
                            ref={(el) => {
                              inputRefs.current[field.tag] = el;
                            }}
                            type="date"
                            value={formData[field.tag] || ""}
                            onChange={(e) => handleInputChange(field.tag, e.target.value)}
                            required={field.required !== false}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition cursor-pointer"
                          />
                        )}

                        {/* Input Type: Select (Dropdown) */}
                        {field.type === "select" && (
                          <div className="relative">
                            <select
                              ref={(el) => {
                                inputRefs.current[field.tag] = el;
                              }}
                              value={formData[field.tag] || ""}
                              onChange={(e) => handleInputChange(field.tag, e.target.value)}
                              required={field.required !== false}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition appearance-none cursor-pointer pr-10"
                            >
                              {Array.isArray(field.options) &&
                                field.options.map((opt, idx) => (
                                  <option key={idx} value={opt} className="bg-slate-900 text-white">
                                    {opt}
                                  </option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                          </div>
                        )}

                        {/* Input Type: Textarea */}
                        {field.type === "textarea" && (
                          <textarea
                            ref={(el) => {
                              inputRefs.current[field.tag] = el;
                            }}
                            rows={3}
                            placeholder={getFieldPlaceholder(field)}
                            value={formData[field.tag] || ""}
                            onChange={(e) => handleInputChange(field.tag, e.target.value)}
                            required={field.required !== false}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition placeholder:text-slate-600"
                          />
                        )}
                      </div>
                    );
                  })}

                {/* Submit / Download Actions */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <Button
                    variant="galaxy"
                    type="submit"
                    disabled={submitting || submittingDocx}
                    className="w-full py-3.5 text-sm font-bold shadow-[0_0_25px_rgba(6,182,212,0.3)]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {submitting ? "Mengolah Dokumen PDF..." : "Unduh Dokumen PDF"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => handleDownload("docx")}
                    disabled={submitting || submittingDocx}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-mono text-xs transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <FileType className="w-4 h-4 text-accent-purple" />
                    <span>{submittingDocx ? "Mengunduh Word..." : "Unduh Versi DOCX (Word)"}</span>
                  </button>

                  <p className="text-center text-[11px] text-slate-400 font-mono leading-relaxed">
                    * Dokumen di-generate on-the-fly dengan format resmi. Pastikan crosscheck data di panel preview sebelum dicetak.
                  </p>
                </div>
              </form>
            </Card>
          </div>

          {/* RIGHT COLUMN: Real Native File Preview */}
          <div
            className={`lg:col-span-7 sticky top-24 self-start ${
              mobileTab === "form" ? "hidden lg:block" : "block"
            }`}
          >
            <DocumentRealtimePreview
              filledDocxBuffer={filledDocxBuffer}
              loading={previewLoading}
              totalFields={totalFields}
              filledCount={filledCount}
              missingRequired={missingRequired}
              templateTitle={template?.title}
              onFocusField={handleFocusField}
              onDownloadPdf={() => handleDownload("pdf")}
              onDownloadDocx={() => handleDownload("docx")}
              submitting={submitting || submittingDocx}
            />
          </div>
        </div>
      </main>

      {/* Floating Quick Preview Action Bar for Mobile (When in Form tab) */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
        <div className="p-2 rounded-2xl bg-slate-950/90 border border-cyan-500/30 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.2)] flex items-center justify-between gap-2 font-mono">
          <button
            type="button"
            onClick={() => setMobileTab(mobileTab === "form" ? "preview" : "form")}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            {mobileTab === "form" ? (
              <>
                <Eye className="w-4 h-4 text-accent-cyan" />
                <span>Lihat Preview ({filledCount}/{totalFields})</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 text-accent-cyan" />
                <span>Kembali ke Form</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleDownload("pdf")}
            disabled={submitting || submittingDocx}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-accent-cyan to-blue-600 text-slate-950 text-xs font-bold transition shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span>{submitting ? "..." : "Unduh PDF"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
