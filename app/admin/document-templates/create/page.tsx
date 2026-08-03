"use client";

import React, { useState } from "react";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/client";
import { DocumentFieldConfig, FieldType } from "@/types/document";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import PizZip from "pizzip";

export default function CreateDocumentTemplatePage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [fields, setFields] = useState<DocumentFieldConfig[]>([]);
  const [extractedInfo, setExtractedInfo] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fungsi untuk membaca & mengekstrak tag {tag} secara otomatis dari file .docx
  const handleFileSelect = async (selectedFile: File | null) => {
    setFile(selectedFile);
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
        const newFields: DocumentFieldConfig[] = extractedTags.map(
          (tag, idx) => {
            const label = tag
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());

            const lowerTag = tag.toLowerCase();
            let type: FieldType = "text";
            let options: string[] | undefined = undefined;
            let rawOptions: string | undefined = undefined;

            if (
              lowerTag.includes("tanggal") ||
              lowerTag.includes("date") ||
              lowerTag.includes("tgl")
            ) {
              type = "date";
            } else if (
              lowerTag.includes("prodi") ||
              lowerTag.includes("jurusan") ||
              lowerTag.includes("pilihan") ||
              lowerTag.includes("gender") ||
              lowerTag.includes("agama")
            ) {
              type = "select";
              rawOptions = "Pilihan A, Pilihan B";
              options = ["Pilihan A", "Pilihan B"];
            } else if (
              lowerTag.includes("alamat") ||
              lowerTag.includes("deskripsi") ||
              lowerTag.includes("catatan")
            ) {
              type = "textarea";
            } else if (
              lowerTag.includes("nomor") ||
              lowerTag.includes("tahun") ||
              lowerTag.includes("jumlah") ||
              lowerTag.includes("gaji")
            ) {
              type = "number";
            }

            return {
              id: `${Date.now()}_${idx}`,
              tag,
              label,
              type,
              options,
              rawOptions,
              required: true,
            };
          }
        );

        setFields(newFields);
        setExtractedInfo(
          `Otomatis mendeteksi ${extractedTags.length} tag dari file Word!`
        );

        if (!title) {
          const autoTitle = selectedFile.name
            .replace(/\.docx$/i, "")
            .replace(/_/g, " ")
            .replace(/-/g, " ");
          setTitle(autoTitle);
        }
      } else {
        setExtractedInfo(
          "Tidak ada tag {nama_tag} yang terdeteksi di file Word. Anda dapat menambahkan tag secara manual di bawah."
        );
      }
    } catch (err: any) {
      console.error("Gagal mengekstrak tag dari file .docx:", err);
      setErrorMsg(
        "Gagal membaca isi file .docx. Pastikan file dalam format Word .docx yang valid."
      );
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

  // Mengatasi masalah pengetikan koma pada opsi dropdown
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
    if (!file) {
      setErrorMsg("File .docx master wajib diunggah");
      return;
    }
    if (fields.length === 0) {
      setErrorMsg("Minimal tambahkan 1 konfigurasi field/tag");
      return;
    }

    // Filter out rawOptions before saving to clean up DB payload
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

    setLoading(true);
    setErrorMsg(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `doc_tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `document-templates/${fileName}`;

      // 1. Upload file docx ke Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("templates")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Supabase Storage Upload Error:", uploadError);
        throw new Error(
          `Gagal mengunggah file ke Supabase Storage (Bucket 'templates'): ${uploadError.message}. Pastikan bucket bernama 'templates' telah dibuat di Supabase Dashboard (Storage -> New Bucket) dan di-set sebagai Public.`
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("templates")
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;

      // 2. Insert ke PostgreSQL / Supabase DB
      const { error: dbError } = await supabase.from("document_templates").insert({
        title,
        description,
        file_url: fileUrl,
        file_path: filePath || fileUrl,
        fields_config: cleanFields,
        is_active: true,
      });

      if (dbError) {
        console.error("Database Insert Error:", dbError.message, dbError.details, dbError);
        throw new Error(
          dbError.message ||
            dbError.details ||
            "Gagal menyimpan ke tabel document_templates. Silakan periksa kolom 'fields_config' di database Supabase Anda."
        );
      }

      router.push("/admin/document-templates");
    } catch (err: any) {
      console.error("Create template error details:", err);
      let message = "Gagal menyimpan template dokumen.";

      if (typeof err === "string") {
        message = err;
      } else if (err?.message) {
        message = err.message;
      } else if (err?.details) {
        message = err.details;
      } else {
        try {
          message = JSON.stringify(err);
        } catch {
          message = "Terjadi kesalahan sistem saat menyimpan template.";
        }
      }

      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col z-0 bg-[#020510] text-foreground font-sans pb-20">
      <StarfieldBackground />
      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        {/* Header Navigation */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl glass hover:bg-accent-cyan/10 text-accent-cyan transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-yellow font-display">
              Tambah Template Auto Form
            </h1>
            <p className="text-sm text-slate-400">
              Unggah file Word (.docx) dan sistem akan membaca tag dinamis secara otomatis.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl glass border-rose-500/40 text-rose-400 flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Upload File & Automatic Tag Detection */}
          <Card glowColor="cyan" className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <FileText className="w-5 h-5 text-accent-cyan" /> 1. Upload Master Dokumen (.docx)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-2">
                  File Word (.docx) <span className="text-rose-400">*</span>
                </label>
                <div className="relative border-2 border-dashed border-accent-cyan/30 rounded-2xl p-6 text-center hover:border-accent-cyan/60 transition bg-slate-900/40 cursor-pointer">
                  <input
                    type="file"
                    accept=".docx"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    required
                  />
                  <Upload className="w-10 h-10 mx-auto text-accent-cyan/60 mb-2" />
                  {file ? (
                    <div className="text-accent-cyan font-mono text-sm font-bold">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-200 font-semibold text-sm">
                        Klik atau seret file .docx di sini
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Sistem akan langsung mendeteksi semua tag seperti &#123;nama&#125;, &#123;nim&#125;, &#123;alamat&#125; di dalam dokumen!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {extractedInfo && (
                <div className="p-3.5 rounded-xl glass border-accent-cyan/40 bg-accent-cyan/5 text-accent-cyan text-xs font-mono flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{extractedInfo}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-2">
                  Judul Dokumen / Form <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Surat Pernyataan Mahasiswa Aktif"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-card-border text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-2">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan singkat mengenai tujuan dokumen ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-card-border text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition"
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Hasil Deteksi Tag & Pengaturan Tipe Input */}
          <Card glowColor="purple" className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent-purple" /> 2. Pengaturan Tag & Field Form
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tag terdeteksi secara otomatis. Anda cukup menyesuaikan Tipe Input (Teks, Date, Dropdown) & Opsinya.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddField}
                className="px-3 py-1.5 text-xs font-mono rounded-xl bg-accent-purple/20 border border-accent-purple/40 text-accent-purple hover:bg-accent-purple/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Manual
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm font-mono border border-dashed border-slate-800 rounded-xl">
                Belum ada tag terdeteksi. Unggah file `.docx` di atas untuk mengekstrak tag secara otomatis.
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-card-border hover:border-accent-purple/40 transition space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-accent-purple font-bold">
                        Tag #{idx + 1}: &#123;{field.tag}&#125;
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="text-rose-400 hover:text-rose-300 transition p-1"
                        title="Hapus field ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Tag Name */}
                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                          Nama Tag di .docx
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-accent-cyan font-mono text-xs">
                            &#123;
                          </span>
                          <input
                            type="text"
                            placeholder="nama"
                            value={field.tag}
                            onChange={(e) =>
                              handleFieldChange(
                                field.id,
                                "tag",
                                e.target.value.replace(/[{}]/g, "")
                              )
                            }
                            className="w-full pl-6 pr-6 py-2 text-sm rounded-lg bg-slate-900 border border-slate-800 text-accent-cyan font-mono focus:outline-none focus:border-accent-purple"
                          />
                          <span className="absolute right-3 top-2.5 text-accent-cyan font-mono text-xs">
                            &#125;
                          </span>
                        </div>
                      </div>

                      {/* Label Input */}
                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                          Label Form Pengguna
                        </label>
                        <input
                          type="text"
                          placeholder="Nama Lengkap"
                          value={field.label}
                          onChange={(e) =>
                            handleFieldChange(field.id, "label", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-accent-purple"
                        />
                      </div>

                      {/* Field Type */}
                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                          Tipe Input
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) =>
                            handleFieldChange(
                              field.id,
                              "type",
                              e.target.value as FieldType
                            )
                          }
                          className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-accent-purple cursor-pointer"
                        >
                          <option value="text">Teks Biasa</option>
                          <option value="date">Tanggal (Date Picker)</option>
                          <option value="select">Dropdown (Opsi Pilihan)</option>
                          <option value="textarea">Teks Panjang (Textarea)</option>
                          <option value="number">Angka</option>
                        </select>
                      </div>
                    </div>

                    {/* Dropdown Options Config */}
                    {field.type === "select" && (
                      <div className="pt-2">
                        <label className="block text-[11px] font-mono text-accent-yellow uppercase mb-1">
                          Opsi Dropdown (Pisahkan dengan koma)
                        </label>
                        <input
                          type="text"
                          placeholder="Pilihan A, Pilihan B, Pilihan C"
                          value={
                            field.rawOptions !== undefined
                              ? field.rawOptions
                              : field.options
                              ? field.options.join(", ")
                              : ""
                          }
                          onChange={(e) =>
                            handleOptionsChange(field.id, e.target.value)
                          }
                          className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-accent-yellow/40 text-accent-yellow focus:outline-none focus:border-accent-yellow"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-2xl glass text-slate-400 hover:text-white font-mono text-sm transition"
            >
              Batal
            </button>

            <Button variant="galaxy" type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Menyimpan..." : "Simpan Template"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
