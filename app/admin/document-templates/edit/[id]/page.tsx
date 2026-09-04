"use client";

import React, { useEffect, useState, use } from "react";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/client";
import { DocumentFieldConfig, DocumentTemplate, FieldType } from "@/types/document";
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Download,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Link } from "next-view-transitions";
import PizZip from "pizzip";

export default function EditDocumentTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const templateId = resolvedParams.id;
  const router = useRouter();
  const supabase = createClient();

  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [currentFileUrl, setCurrentFileUrl] = useState("");
  const [currentFilePath, setCurrentFilePath] = useState("");

  // New master file if admin chooses to replace it
  const [newFile, setNewFile] = useState<File | null>(null);
  const [extractedInfo, setExtractedInfo] = useState<string | null>(null);

  const [fields, setFields] = useState<DocumentFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Fetch template data
  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/document-templates/${templateId}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal memuat data template");
      }
      const json = await res.json();
      const tpl: DocumentTemplate = json.data;

      setTemplate(tpl);
      setTitle(tpl.title || "");
      setDescription(tpl.description || "");
      setIsActive(tpl.is_active ?? true);
      setCurrentFileUrl(tpl.file_url || "");
      setCurrentFilePath((tpl as any).file_path || "");

      const loadedFields = Array.isArray(tpl.fields_config)
        ? tpl.fields_config.map((f: DocumentFieldConfig) => ({
            ...f,
            rawOptions: Array.isArray(f.options) ? f.options.join(", ") : "",
          }))
        : [];

      setFields(loadedFields);
    } catch (err: any) {
      console.error("Fetch template error:", err);
      setErrorMsg(err.message || "Gagal mengambil data template dari database.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Parse & scan tags if admin selects a replacement .docx file
  const handleFileSelect = async (selectedFile: File | null) => {
    setNewFile(selectedFile);
    setExtractedInfo(null);

    if (!selectedFile) return;

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      let fullText = "";

      Object.keys(zip.files).forEach((fileName) => {
        if (
          fileName.startsWith("word/") &&
          (fileName.endsWith(".xml") ||
            fileName.includes("document") ||
            fileName.includes("header") ||
            fileName.includes("footer"))
        ) {
          let fileXml = zip.files[fileName].asText();
          fileXml = fileXml.replace(/\{([a-zA-Z0-9_\-\s]+)\)[,\s]*/g, "{$1} ");
          const plainText = fileXml.replace(/<[^>]+>/g, "");
          fullText += " " + plainText;
        }
      });

      const matches = fullText.match(/\{([a-zA-Z0-9_\-\s]+)\}/g) || [];
      const tagsSet = new Set<string>();

      matches.forEach((m) => {
        const cleanTag = m.replace(/[{}]/g, "").trim();
        if (
          cleanTag &&
          !cleanTag.startsWith("#") &&
          !cleanTag.startsWith("/") &&
          !cleanTag.startsWith("^")
        ) {
          tagsSet.add(cleanTag);
        }
      });

      const extractedTags = Array.from(tagsSet);

      if (extractedTags.length > 0) {
        // Find newly discovered tags not in existing fields
        const existingTags = new Set(fields.map((f) => f.tag.toLowerCase().trim()));
        const newTags = extractedTags.filter((t) => !existingTags.has(t.toLowerCase().trim()));

        setExtractedInfo(
          `File baru terdeteksi: ${extractedTags.length} tag ditemukan di Word (${newTags.length} tag baru belum ada di konfigurasi).`
        );
      } else {
        setExtractedInfo(
          "Tidak ada tag {nama_tag} yang terdeteksi di file Word baru. Anda tetap dapat menggunakan tag manual."
        );
      }
    } catch (err: any) {
      console.error("Gagal membaca file .docx baru:", err);
      setErrorMsg("Gagal membaca file .docx baru. Pastikan format Word .docx valid.");
    }
  };

  // Merge newly discovered tags from uploaded docx into fields
  const handleSyncTagsFromNewFile = async () => {
    if (!newFile) return;

    try {
      const arrayBuffer = await newFile.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      let fullText = "";

      Object.keys(zip.files).forEach((fileName) => {
        if (
          fileName.startsWith("word/") &&
          (fileName.endsWith(".xml") || fileName.includes("document"))
        ) {
          const plainText = zip.files[fileName].asText().replace(/<[^>]+>/g, "");
          fullText += " " + plainText;
        }
      });

      const matches = fullText.match(/\{([a-zA-Z0-9_\-\s]+)\}/g) || [];
      const tagsSet = new Set<string>();
      matches.forEach((m) => {
        const cleanTag = m.replace(/[{}]/g, "").trim();
        if (cleanTag && !cleanTag.startsWith("#") && !cleanTag.startsWith("/")) {
          tagsSet.add(cleanTag);
        }
      });

      const extractedTags = Array.from(tagsSet);
      const existingMap = new Map(fields.map((f) => [f.tag.toLowerCase().trim(), f]));

      const updatedFields: DocumentFieldConfig[] = [];

      // Preserve existing fields that still exist in docx
      extractedTags.forEach((tag, idx) => {
        const lower = tag.toLowerCase().trim();
        if (existingMap.has(lower)) {
          updatedFields.push(existingMap.get(lower)!);
        } else {
          // Add newly discovered tag
          const label = tag.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
          let type: FieldType = "text";
          if (lower.includes("tanggal") || lower.includes("date") || lower.includes("tgl")) {
            type = "date";
          } else if (lower.includes("nomor") || lower.includes("tahun") || lower.includes("tlp")) {
            type = "number";
          } else if (lower.includes("alamat") || lower.includes("deskripsi")) {
            type = "textarea";
          }

          updatedFields.push({
            id: `${Date.now()}_${idx}`,
            tag,
            label,
            type,
            required: true,
          });
        }
      });

      // Also keep any manual fields user had added
      fields.forEach((f) => {
        if (!existingMap.has(f.tag.toLowerCase().trim())) {
          updatedFields.push(f);
        }
      });

      setFields(updatedFields);
      setSuccessMsg("Daftar tag berhasil disinkronkan dengan file Word baru!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg("Gagal menyinkronkan tag: " + e.message);
    }
  };

  const handleAddField = () => {
    const newField: DocumentFieldConfig = {
      id: Date.now().toString(),
      tag: "",
      label: "",
      type: "text",
      required: true,
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === fields.length - 1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const reordered = [...fields];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    setFields(reordered);
  };

  const handleFieldChange = (
    id: string,
    key: keyof DocumentFieldConfig,
    value: any
  ) => {
    setFields(
      fields.map((f) => {
        if (f.id === id) {
          return { ...f, [key]: value };
        }
        return f;
      })
    );
  };

  const handleOptionsChange = (id: string, text: string) => {
    const parsedOptions = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setFields(
      fields.map((f) => {
        if (f.id === id) {
          return {
            ...f,
            rawOptions: text,
            options: parsedOptions,
          };
        }
        return f;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Judul template wajib diisi");
      return;
    }
    if (fields.length === 0) {
      setErrorMsg("Minimal harus ada 1 konfigurasi field/tag");
      return;
    }

    const cleanFields = fields.map(({ rawOptions, ...rest }) => rest);

    for (const f of cleanFields) {
      if (!f.tag.trim()) {
        setErrorMsg("Setiap field harus memiliki nama Tag (misal: 'nama')");
        return;
      }
      if (!f.label.trim()) {
        setErrorMsg(`Label untuk tag '{${f.tag}}' wajib diisi`);
        return;
      }
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      let finalFileUrl = currentFileUrl;
      let finalFilePath = currentFilePath;

      // 1. If admin selected a new master .docx file, upload to storage
      if (newFile) {
        const fileExt = newFile.name.split(".").pop();
        const fileName = `doc_tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `document-templates/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("templates")
          .upload(filePath, newFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Gagal mengunggah file baru ke Storage: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("templates")
          .getPublicUrl(filePath);

        finalFileUrl = publicUrlData.publicUrl;
        finalFilePath = filePath;
      }

      // 2. Send PUT request to update template in DB
      const res = await fetch(`/api/admin/document-templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          file_url: finalFileUrl,
          file_path: finalFilePath,
          fields_config: cleanFields,
          is_active: isActive,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menyimpan perubahan template");
      }

      setSuccessMsg("Template dokumen berhasil diperbarui!");
      setTimeout(() => {
        router.push("/admin/document-templates");
      }, 1200);
    } catch (err: any) {
      console.error("Save template error:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan perubahan template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen z-0 bg-[#020510] text-foreground font-sans flex items-center justify-center">
        <StarfieldBackground />
        <div className="relative z-10 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
          <p className="font-mono text-sm">Memuat data template dokumen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col z-0 bg-[#020510] text-foreground font-sans pb-24">
      <StarfieldBackground />
      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/document-templates"
              className="p-2.5 rounded-2xl glass hover:bg-accent-cyan/10 text-accent-cyan transition flex items-center justify-center border border-white/10"
              title="Kembali ke Kelola Template"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[10px] font-mono text-accent-cyan uppercase tracking-widest font-bold block">
                Editor Auto-Form Template
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                Edit Template Dokumen
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              href={`/documents/${templateId}`}
              variant="outline"
              className="text-xs font-mono"
            >
              Uji Form Saat Ini
            </Button>
          </div>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl glass border-emerald-500/40 text-emerald-300 flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl glass border-rose-500/40 text-rose-300 flex items-center gap-3 shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Informasi Dokumen */}
          <Card glowColor="cyan" className="space-y-5">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-accent-cyan font-mono text-xs">
                <FileText className="w-4 h-4" /> 1. INFORMASI TEMPLATE
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-700 text-accent-cyan focus:ring-accent-cyan"
                />
                <span className={isActive ? "text-emerald-400 font-bold" : "text-slate-500"}>
                  {isActive ? "Status: Aktif" : "Status: Non-aktif"}
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Judul Dokumen Resmi <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: SURAT PERMOHONAN IZIN ORTU & KESEDIAAN MENGIKUTI KEGIATAN"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-slate-700 text-white text-sm focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Deskripsi / Petunjuk Pengisian
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Petunjuk atau deskripsi yang muncul di atas form untuk peserta..."
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-slate-700 text-white text-sm focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition"
              />
            </div>
          </Card>

          {/* Section 2: File Master .docx */}
          <Card glowColor="purple" className="space-y-4">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-accent-purple font-mono text-xs">
                <Upload className="w-4 h-4" /> 2. FILE MASTER (.DOCX)
              </div>
              {currentFileUrl && (
                <a
                  href={currentFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-accent-cyan hover:underline flex items-center gap-1.5"
                  title="Unduh file Word yang saat ini tersimpan"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Master Saat Ini
                </a>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-400">File Master Aktif:</span>
                <span className="font-mono text-accent-cyan break-all">
                  {currentFilePath || currentFileUrl.split("/").pop() || "Template Word Aktif"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Ganti File Master .docx Baru (Opsional):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/15 file:cursor-pointer cursor-pointer border border-dashed border-slate-700 rounded-xl p-2 bg-black/40"
                  />
                  {newFile && (
                    <button
                      type="button"
                      onClick={() => setNewFile(null)}
                      className="px-3 py-2 text-xs font-mono text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                    >
                      Batal Ganti
                    </button>
                  )}
                </div>
              </div>

              {extractedInfo && (
                <div className="mt-3 p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent-purple shrink-0" />
                    <span>{extractedInfo}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncTagsFromNewFile}
                    className="mt-1 px-3 py-1.5 text-xs font-mono font-bold bg-accent-purple text-slate-950 rounded-lg hover:bg-accent-purple/90 transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Sinkronkan & Tambahkan Tag Baru ke Tabel
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Section 3: Konfigurasi Tag Form Dinamis */}
          <Card glowColor="yellow" className="space-y-6">
            <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-accent-yellow font-mono text-xs mb-1">
                  <Sparkles className="w-4 h-4" /> 3. KONFIGURASI TAG & FIELD AUTOFORM
                </div>
                <h3 className="text-lg font-bold text-white">
                  Daftar Tag Dokumen ({fields.length} Field)
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAddField}
                className="px-3.5 py-2 rounded-xl bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Field Manual
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, idx) => (
                <div
                  key={field.id || idx}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-accent-cyan/30 transition space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                      <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-accent-cyan font-bold">
                        {idx + 1}
                      </span>
                      <span>Field Tag:</span>
                      <strong className="text-accent-cyan">&#123;{field.tag || "belum_ada_tag"}&#125;</strong>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveField(idx, "up")}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 disabled:opacity-30"
                        title="Geser ke Atas"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveField(idx, "down")}
                        disabled={idx === fields.length - 1}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 disabled:opacity-30"
                        title="Geser ke Bawah"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition ml-1"
                        title="Hapus Field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Tag Name */}
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Nama Tag di Word <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={field.tag}
                        onChange={(e) => handleFieldChange(field.id, "tag", e.target.value)}
                        placeholder="misal: nama, nim, date"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-accent-cyan"
                      />
                    </div>

                    {/* Label Input */}
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Label Form Peserta <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleFieldChange(field.id, "label", e.target.value)}
                        placeholder="misal: Nama Lengkap"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-slate-700 text-white text-xs focus:outline-none focus:border-accent-cyan"
                      />
                    </div>

                    {/* Field Type */}
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Tipe Input
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) =>
                          handleFieldChange(field.id, "type", e.target.value as FieldType)
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-slate-700 text-white text-xs focus:outline-none focus:border-accent-cyan cursor-pointer"
                      >
                        <option value="text">Teks Biasa (Text)</option>
                        <option value="number">Angka / Nomor (Manual Numeric)</option>
                        <option value="date">Tanggal (Date Picker)</option>
                        <option value="select">Pilihan Dropdown (Select)</option>
                        <option value="textarea">Teks Panjang (Textarea)</option>
                      </select>
                    </div>
                  </div>

                  {/* Options (if type === select) */}
                  {field.type === "select" && (
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Daftar Opsi (Pisahkan dengan koma)
                      </label>
                      <input
                        type="text"
                        value={field.rawOptions || ""}
                        onChange={(e) => handleOptionsChange(field.id, e.target.value)}
                        placeholder="Pilihan 1, Pilihan 2, Pilihan 3"
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-slate-700 text-white text-xs focus:outline-none focus:border-accent-cyan"
                      />
                    </div>
                  )}

                  {/* Placeholder & Required */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Placeholder Input
                      </label>
                      <input
                        type="text"
                        value={field.placeholder || ""}
                        onChange={(e) => handleFieldChange(field.id, "placeholder", e.target.value)}
                        placeholder="Contoh teks placeholder..."
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-slate-700 text-white text-xs focus:outline-none focus:border-accent-cyan"
                      />
                    </div>

                    <div className="pt-4 flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300">
                        <input
                          type="checkbox"
                          checked={field.required !== false}
                          onChange={(e) => handleFieldChange(field.id, "required", e.target.checked)}
                          className="rounded border-slate-700 text-accent-cyan focus:ring-accent-cyan"
                        />
                        <span>Wajib Diisi</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Submit Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
            <Button
              href="/admin/document-templates"
              variant="outline"
              type="button"
              className="w-full sm:w-auto font-mono text-xs"
            >
              Batal
            </Button>

            <Button
              variant="galaxy"
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3 text-sm font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Menyimpan Perubahan..." : "Simpan Perubahan Template"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
