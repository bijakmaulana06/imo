'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { parseTemplate, type ParsedTemplate } from '@/lib/idcard/psdTemplate';
import { checkFonts, loadGoogleFont, type FontStatus } from '@/lib/idcard/fontManager';
import FontPicker from '@/components/idcard/FontPicker';
import PhotoCropperModal from '@/components/idcard/PhotoCropperModal';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { jsPDF } from 'jspdf';

import { renderIdCard } from '@/lib/idcard/renderIdCard';
import {
  Upload,
  Download,
  Sparkles,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crop,
  Sliders,
} from 'lucide-react';


interface IdCardGeneratorProps {
  /** URL template .psd opsional dari public/ atau Storage. */
  templateUrl?: string;
  /** Nama template untuk display & status verifikasi */
  templateName?: string;
  /** Apakah user diizinkan mengunggah file .psd sendiri. Default: false */
  allowUserUpload?: boolean;
}

function getTagPlaceholder(tag: string): string {
  const lower = tag.toLowerCase().trim();
  if (lower === 'nama' || lower === 'name' || lower.includes('nama')) {
    return 'Xaviera Putri';
  }
  if (lower === 'nim' || lower === 'nrp' || lower.includes('nim')) {
    return '260xxxxxxxx';
  }
  if (lower === 'kelompok' || lower === 'group') {
    return 'Kelompok 01';
  }
  if (lower === 'jurusan' || lower === 'prodi') {
    return 'Teknologi Pendidikan';
  }
  if (lower === 'peran' || lower === 'role') {
    return 'Peserta';
  }
  if (lower === 'quote' || lower === 'motto') {
    return 'Chasing Glories';
  }
  return `Masukkan ${tag}...`;
}

export default function IdCardGenerator({
  templateUrl,
  templateName,
  allowUserUpload = false,
}: IdCardGeneratorProps) {
  const [parsed, setParsed] = useState<ParsedTemplate | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [rawPhotoSrc, setRawPhotoSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);
  const [photoFileName, setPhotoFileName] = useState<string>('');

  const [fontStatuses, setFontStatuses] = useState<FontStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState<string>('Menyiapkan kanvas...');
  const [refreshCycle, setRefreshCycle] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [scale, setScale] = useState(1);
  const [templateFileName, setTemplateFileName] = useState<string>('');
  const [globalFont, setGlobalFont] = useState<string>('Griffy');
  const [fontOverrides, setFontOverrides] = useState<Record<string, string>>({});
  const [fontLoading, setFontLoading] = useState<Record<string, boolean>>({});
  // bold/italic: 'global' key for all, or per-tag key
  const [boldOverrides, setBoldOverrides] = useState<Record<string, boolean>>({ global: true });
  const [italicOverrides, setItalicOverrides] = useState<Record<string, boolean>>({});
  const [openFontTag, setOpenFontTag] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [pdfOrientation, setPdfOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');

  // Load default Griffy font on mount
  useEffect(() => {
    loadGoogleFont('Griffy').catch(err => console.warn('Default Griffy font load error:', err));
  }, []);


  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const loadTemplateBuffer = useCallback(async (source: ArrayBuffer, fileName?: string) => {
    setLoading(true);
    setError(null);
    setLoadStep('Membaca & memverifikasi struktur layer PSD...');
    try {
      // Delay terukur (300ms) untuk memastikan transisi bersih dan verifikasi file
      await new Promise((r) => setTimeout(r, 300));

      const result = parseTemplate(source);
      setParsed(result);

      // Inisialisasi value form dari tag yang terdeteksi (kosong, tanpa dummy placeholder content)
      const initialValues: Record<string, string> = {};
      result.textTags.forEach((tag) => {
        initialValues[tag] = '';
      });
      setValues(initialValues);

      // Cek ketersediaan font
      setFontStatuses(checkFonts(result.fontsUsed));
      if (fileName) setTemplateFileName(fileName);

      setLoadStep('Sinkronisasi grafis & font...');

      // "Refresh terus" - Multi-pass rendering dengan delay bertahap untuk memastikan font & layer stabil
      setRefreshCycle(1);
      setTimeout(() => setRefreshCycle(2), 150);
      setTimeout(() => setRefreshCycle(3), 400);
      setTimeout(() => setRefreshCycle(4), 750);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error
          ? e.message
          : 'Gagal membaca file .psd. Pastikan file tidak rusak dan menggunakan format Photoshop PSD standar.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load template jika templateUrl diberikan
  useEffect(() => {
    if (!templateUrl) return;
    const activeUrl = templateUrl;

    // Bersihkan template lama dan canvas secara instan agar tidak menampilkan template sebelumnya
    setParsed(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setLoading(true);
    setError(null);
    setLoadStep('Mengunduh file templat PSD terbaru...');

    const controller = new AbortController();

    async function fetchTemplate() {
      try {
        // Cache buster timestamp & no-cache headers agar browser tidak mengambil cache template sebelumnya
        const sep = activeUrl.includes('?') ? '&' : '?';
        const fetchUrl = `${activeUrl}${sep}_t=${Date.now()}`;

        const r = await fetch(fetchUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          signal: controller.signal,
        });

        if (!r.ok) throw new Error(`HTTP ${r.status}: Gagal mengunduh templat`);

        const buffer = await r.arrayBuffer();
        if (controller.signal.aborted) return;

        const parts = activeUrl.split('/');
        await loadTemplateBuffer(buffer, parts[parts.length - 1]);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Gagal memuat template URL:', err);
        setError(`Gagal memuat templat: ${err.message || 'Koneksi terputus'}`);
        setLoading(false);
      }
    }

    fetchTemplate();

    return () => {
      controller.abort();
    };
  }, [templateUrl, loadTemplateBuffer]);

  const handleTemplateUpload = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.psd')) {
      setError('File harus berformat .psd (Photoshop Document).');
      return;
    }
    file.arrayBuffer().then((buf) => loadTemplateBuffer(buf, file.name));
  };

  const handlePhotoUpload = (file: File) => {
    setPhotoFileName(file.name);
    const url = URL.createObjectURL(file);
    setRawPhotoSrc(url);

    // Buka cropper modal otomatis agar user bisa mengatur posisi/crop
    setIsCropperOpen(true);
  };

  const handleCropComplete = useCallback((croppedDataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      setPhotoImg(img);
    };
    img.src = croppedDataUrl;
  }, []);


  // onFontLoaded: refresh font status and trigger re-render
  const handleFontLoaded = useCallback((_alias: string) => {
    if (parsed) setFontStatuses(checkFonts(parsed.fontsUsed));
    // Force re-render by bumping values state
    setValues(prev => ({ ...prev }));
  }, [parsed]);

  // Gambar ulang canvas tiap kali template, isian form, foto, font, atau siklus refresh berubah
  useEffect(() => {
    if (!parsed || !canvasRef.current) return;
    renderIdCard(canvasRef.current, parsed, {
      values,
      photo: photoImg,
      showPlaceholder: true,
      globalFont: globalFont || undefined,
      fontOverrides,
      boldOverrides,
      italicOverrides,
    });
  }, [parsed, values, photoImg, fontStatuses, globalFont, fontOverrides, boldOverrides, italicOverrides, refreshCycle]);

  const handleDownloadPdfA4 = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setDownloadingPdf(true);
    try {
      let orientation: 'portrait' | 'landscape';
      if (pdfOrientation === 'portrait') {
        orientation = 'portrait';
      } else if (pdfOrientation === 'landscape') {
        orientation = 'landscape';
      } else {
        orientation = canvas.width >= canvas.height ? 'landscape' : 'portrait';
      }

      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const imgRatio = canvas.width / canvas.height;
      const pageRatio = pageWidth / pageHeight;

      let destWidth = pageWidth;
      let destHeight = pageHeight;
      let destX = 0;
      let destY = 0;

      if (imgRatio > pageRatio) {
        destWidth = pageWidth;
        destHeight = pageWidth / imgRatio;
        destY = (pageHeight - destHeight) / 2;
      } else {
        destHeight = pageHeight;
        destWidth = pageHeight * imgRatio;
        destX = (pageWidth - destWidth) / 2;
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      doc.addImage(imgData, 'PNG', destX, destY, destWidth, destHeight, undefined, 'FAST');

      const name = values['nama']?.trim().replace(/\s+/g, '_') || 'id_card';
      doc.save(`IDCard_A4_${name}.pdf`);
    } catch (err: any) {
      console.error('Gagal membuat PDF A4:', err);
      alert('Gagal membuat PDF A4: ' + (err.message || err));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const name = values['nama']?.trim().replace(/\s+/g, '_') || 'id_card';
      link.download = `IDCard_${name}.png`;
      link.click();
    }, 'image/png');
  };

  const missingFonts = fontStatuses.filter((f) => !f.available);

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleTemplateUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
      {/* Upload Zone / Header Info jika belum ada PSD yang dimuat */}
      {!parsed && (
        allowUserUpload ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed p-10 transition-all text-center flex flex-col items-center justify-center min-h-[320px] ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/30 backdrop-blur-md shadow-[0_0_30px_rgba(125,249,255,0.2)]'
                : 'border-slate-700/80 bg-slate-900/60 backdrop-blur-xl hover:border-slate-500'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".psd"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleTemplateUpload(e.target.files[0])}
            />

            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(125,249,255,0.15)]">
              {loading ? <RefreshCw className="w-8 h-8 animate-spin" /> : <Layers className="w-8 h-8" />}
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              {loading ? 'Membaca & Parsing Template PSD...' : 'Unggah Template ID Card (.PSD)'}
            </h3>

            <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
              Pilih atau drop file Photoshop <code className="text-cyan-300 font-mono">.psd</code>. Sistem akan otomatis mendeteksi tag seperti <code className="text-cyan-300 font-mono font-semibold">{'{nama}'}</code>, <code className="text-cyan-300 font-mono font-semibold">{'{nim}'}</code>, dan slot <code className="text-cyan-300 font-mono font-semibold">{'{foto}'}</code>.
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(125,249,255,0.3)] disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              {loading ? 'Proses PSD...' : 'Pilih File .PSD'}
            </button>

            {error && (
              <div className="mt-6 flex items-center gap-2 text-rose-400 bg-rose-950/50 border border-rose-800/60 px-4 py-2 rounded-lg text-sm">
                <span className="shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          <Card glowColor="cyan" className="p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan mb-4 shadow-[0_0_20px_rgba(125,249,255,0.2)]">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-lg font-display font-extrabold text-white mb-2 tracking-wide">
              {loading ? (loadStep || 'MEMBACA & MENYIAPKAN TEMPLAT ID CARD...') : 'Pilih templat ID Card di atas untuk memulai'}
            </h3>
            {templateName && (
              <span className="text-xs font-mono text-accent-cyan bg-accent-cyan/10 px-3 py-1 rounded-full border border-accent-cyan/30 mb-2 font-bold">
                {templateName}
              </span>
            )}
            <p className="text-xs text-slate-400 font-mono max-w-sm">
              Memverifikasi keselarasan layer templat & membersihkan cache sebelumnya...
            </p>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-rose-400 bg-rose-950/50 border border-rose-800/60 px-4 py-2 rounded-lg text-xs font-mono">
                <span>⚠ {error}</span>
              </div>
            )}
          </Card>
        )
      )}

      {/* Main Workspace (Preview + Form) bila PSD sudah dimuat */}
      {parsed && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Kolom Kiri / Preview Canvas */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <Card glowColor="cyan" className="p-5 flex flex-col">
              {/* Header Canvas Control */}
              <div className="flex items-center justify-between border-b border-card-border/30 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan shadow-[0_0_12px_rgba(125,249,255,0.25)]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-display font-bold text-white flex items-center gap-2 tracking-wide">
                      PRATINJAU LIVE ID CARD
                    </h2>
                    <p className="text-xs text-slate-400 font-mono truncate max-w-[200px] sm:max-w-[300px]">
                      {templateName || templateFileName || 'Template Active'} • {parsed.width}x{parsed.height}px
                    </p>
                  </div>
                </div>

                {/* Canvas Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Segarkan & Verifikasi Ulang Kanvas"
                    onClick={() => {
                      setRefreshCycle((c) => c + 1);
                      setTimeout(() => setRefreshCycle((c) => c + 1), 150);
                      setTimeout(() => setRefreshCycle((c) => c + 1), 400);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-card-border/60 text-slate-300 hover:text-accent-cyan transition-colors flex items-center gap-1.5 text-xs font-mono"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-accent-cyan" />
                    <span className="text-[11px] hidden sm:inline">Refresh</span>
                  </button>

                  <button
                    type="button"
                    title="Zoom Out"
                    onClick={() => setScale((s) => Math.max(0.4, s - 0.1))}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-card-border/60 text-slate-300 hover:text-accent-cyan transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-accent-cyan min-w-[35px] text-center font-bold">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    type="button"
                    title="Zoom In"
                    onClick={() => setScale((s) => Math.min(2, s + 0.1))}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-card-border/60 text-slate-300 hover:text-accent-cyan transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Reset Zoom"
                    onClick={() => setScale(1)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-card-border/60 text-slate-300 hover:text-accent-cyan transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Viewport Canvas */}
              <div className="relative w-full min-h-[350px] sm:min-h-[480px] bg-slate-950/90 rounded-xl border border-card-border/60 flex items-center justify-center p-4 overflow-auto shadow-inner">
                <div
                  style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
                  className="transition-transform duration-150 flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-lg overflow-hidden"
                >
                  <canvas ref={canvasRef} className="max-w-full rounded-md shadow-2xl block" />
                </div>
              </div>

              {/* Bottom Action bar under Preview */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-card-border/30 text-xs text-slate-400 font-mono">
                {allowUserUpload && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-accent-cyan hover:underline transition-colors font-bold"
                    >
                      <Upload className="w-3.5 h-3.5" /> Ganti Template PSD
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".psd"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleTemplateUpload(e.target.files[0])}
                    />
                  </>
                )}
                <span className="text-slate-500 font-mono text-[11px]">⚡ Client-Side Canvas Engine</span>
              </div>
            </Card>
          </div>

          {/* Kolom Kanan / Form Isian & Controls */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <Card glowColor="purple" className="p-6 flex flex-col gap-5">
              <div className="border-b border-card-border/30 pb-4">
                <h3 className="text-lg font-display font-extrabold text-white flex items-center gap-2 tracking-wide">
                  <FileText className="w-5 h-5 text-accent-purple" />
                  ISI INFORMASI KARTU
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  Isi kolom di bawah ini untuk melengkapi data ID Card Anda.
                </p>
              </div>

              {/* Slot Unggah Foto */}
              {parsed.hasPhotoSlot && (
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-slate-950/60 border border-cyan-500/20">
                  <label className="text-sm font-semibold text-cyan-300 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-cyan-400" />
                      Foto Bebas ID Card ({'{foto}'})
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Foto Bebas</span>
                  </label>
                  
                  <div className="flex flex-wrap items-center gap-2.5 mt-1">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Upload className="w-4 h-4 text-cyan-400" />
                      {photoImg ? 'Ganti Foto' : 'Unggah Foto'}
                    </button>

                    {rawPhotoSrc && (
                      <button
                        type="button"
                        onClick={() => setIsCropperOpen(true)}
                        className="px-3.5 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(125,249,255,0.15)]"
                      >
                        <Crop className="w-4 h-4 text-cyan-400" />
                        Atur & Crop Foto
                      </button>
                    )}

                    <span className="text-xs text-slate-400 truncate max-w-[150px]">
                      {photoFileName || 'Belum ada foto'}
                    </span>
                  </div>

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                  />
                </div>
              )}

              {/* Form Teks Otomatis dari Tag PSD */}
              <div className="flex flex-col gap-4 max-h-[520px] overflow-y-auto pr-1">
                {parsed.textTags.length === 0 && !parsed.hasPhotoSlot && (
                  <p className="text-sm text-slate-400 italic">
                    Tidak ada tag bertanda {'{nama}'}, {'{nim}'}, atau {'{foto}'} yang ditemukan pada layer teks template ini.
                  </p>
                )}

                {/* Global Font + Bold/Italic */}
                {parsed.textTags.length > 0 && (
                  <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 flex flex-col gap-2">
                    <label className="text-xs font-semibold text-violet-400 flex items-center gap-1.5">
                      <span>🔤</span> Font Global (semua teks)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <FontPicker
                          value={globalFont}
                          onChange={setGlobalFont}
                          loading={!!fontLoading['__global__']}
                          setLoading={(v) => setFontLoading(p => ({ ...p, '__global__': v }))}
                          placeholder="Default (dari PSD)"
                        />
                      </div>
                      {/* Global bold/italic */}
                      <button
                        type="button"
                        title="Bold semua teks"
                        onClick={() => setBoldOverrides(p => ({ ...p, global: !p.global }))}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          boldOverrides.global
                            ? 'bg-violet-500/30 border-violet-500/50 text-violet-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >B</button>
                      <button
                        type="button"
                        title="Italic semua teks"
                        onClick={() => setItalicOverrides(p => ({ ...p, global: !p.global }))}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs italic transition-all ${
                          italicOverrides.global
                            ? 'bg-violet-500/30 border-violet-500/50 text-violet-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >I</button>
                    </div>
                  </div>
                )}

                {parsed.textTags.map((tag) => (
                  <div key={tag} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold capitalize text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {tag}
                      <span className="text-[10px] text-slate-500 font-mono lower">({`{${tag}}`})</span>
                    </label>
                    <input
                      type="text"
                      value={values[tag] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [tag]: e.target.value }))}
                      placeholder={getTagPlaceholder(tag)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all"
                    />
                    {/* Collapsible Per-tag font + bold/italic */}
                    <div className="flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => setOpenFontTag(p => p === tag ? null : tag)}
                        className="text-[10px] font-mono text-slate-500 hover:text-accent-cyan flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Atur Font & Gaya ({tag})</span>
                        <span>{openFontTag === tag ? '▲' : '▼'}</span>
                      </button>
                    </div>

                    {openFontTag === tag && (
                      <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-200">
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">Font:</span>
                        <FontPicker
                          value={fontOverrides[tag] ?? ''}
                          onChange={(v) => setFontOverrides(p => ({ ...p, [tag]: v }))}
                          loading={!!fontLoading[tag]}
                          setLoading={(v) => setFontLoading(p => ({ ...p, [tag]: v }))}
                          placeholder={globalFont || `(ikut global)`}
                          compact
                        />
                        <button
                          type="button"
                          title="Bold"
                          onClick={() => setBoldOverrides(p => ({ ...p, [tag]: !p[tag] }))}
                          className={`shrink-0 px-2 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                            boldOverrides[tag]
                              ? 'bg-violet-500/30 border-violet-500/50 text-violet-300'
                              : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'
                          }`}
                        >B</button>
                        <button
                          type="button"
                          title="Italic"
                          onClick={() => setItalicOverrides(p => ({ ...p, [tag]: !p[tag] }))}
                          className={`shrink-0 px-2 py-1 rounded-lg border text-[11px] italic transition-all ${
                            italicOverrides[tag]
                              ? 'bg-violet-500/30 border-violet-500/50 text-violet-300'
                              : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'
                          }`}
                        >I</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Box Unduh ID Card A4 */}
              <div className="flex flex-col gap-2.5 pt-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <span className="text-slate-400 font-mono flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ukuran:</span>
                    <strong className="text-cyan-300 font-bold">A4 (210 × 297 mm)</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPdfOrientation('portrait')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                        pdfOrientation === 'portrait'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Portrait
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfOrientation('landscape')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                        pdfOrientation === 'landscape'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Landscape
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfOrientation('auto')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                        pdfOrientation === 'auto'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Auto
                    </button>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleDownloadPdfA4}
                  disabled={downloadingPdf}
                  className="w-full shadow-[0_0_30px_rgba(125,249,255,0.4)] flex items-center justify-center gap-2"
                >
                  {downloadingPdf ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Membuat PDF A4 Hi-Res...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 text-slate-950" />
                      <span className="font-bold">Unduh ID Card (PDF A4 Hi-Res)</span>
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Unduh Format Gambar (PNG)</span>
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal Editing & Crop Foto */}
      <PhotoCropperModal
        isOpen={isCropperOpen}
        imageSrc={rawPhotoSrc}
        onCropComplete={handleCropComplete}
        onClose={() => setIsCropperOpen(false)}
        aspectRatio={3 / 4}
      />
    </div>
  );
}




