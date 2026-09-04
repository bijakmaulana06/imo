"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  FileType,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper to dynamically load pdf.js from CDN without Turbopack bundle issues
async function getPdfJs(): Promise<any> {
  if (typeof window === "undefined") return null;
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("pdfjs-cdn-script");
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).pdfjsLib));
      return;
    }

    const script = document.createElement("script");
    script.id = "pdfjs-cdn-script";
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      if ((window as any).pdfjsLib) {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve((window as any).pdfjsLib);
      } else {
        reject(new Error("pdfjsLib not available on window"));
      }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

interface DocumentRealtimePreviewProps {
  pdfDataBuffer: ArrayBuffer | null;
  loading: boolean;
  isSyncing: boolean;
  hasUnsyncedChanges: boolean;
  totalFields: number;
  filledCount: number;
  missingRequired: string[];
  templateTitle?: string;
  onRefreshPreview?: () => void;
  onFocusField?: (tagOrLabel: string) => void;
  onDownloadPdf?: () => void;
  onDownloadDocx?: () => void;
  submitting?: boolean;
}

export default function DocumentRealtimePreview({
  pdfDataBuffer,
  loading,
  isSyncing,
  hasUnsyncedChanges,
  totalFields,
  filledCount,
  missingRequired,
  templateTitle = "Dokumen",
  onRefreshPreview,
  onFocusField,
  onDownloadPdf,
  onDownloadDocx,
  submitting = false,
}: DocumentRealtimePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showMissingList, setShowMissingList] = useState<boolean>(false);

  const pdfDocRef = useRef<any>(null);
  const currentRenderTask = useRef<any>(null);

  const percentComplete = totalFields > 0 ? Math.round((filledCount / totalFields) * 100) : 0;
  const isComplete = missingRequired.length === 0 && totalFields > 0;

  // 1. Load PDF document when buffer arrives
  useEffect(() => {
    if (!pdfDataBuffer) return;

    let isMounted = true;

    async function loadPdf() {
      try {
        const pdfjs = await getPdfJs();
        if (!pdfjs || !isMounted) return;

        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(pdfDataBuffer as ArrayBuffer),
          cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);
        renderPage(doc, currentPage, canvasRef.current, zoom);
      } catch (err) {
        console.warn("PDF load error:", err);
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfDataBuffer]);

  // 2. Render specific page to canvas
  const renderPage = async (
    doc: any,
    pageNumber: number,
    canvas: HTMLCanvasElement | null,
    zoomPercent: number
  ) => {
    if (!doc || !canvas) return;

    try {
      if (currentRenderTask.current) {
        try {
          currentRenderTask.current.cancel();
        } catch (_) {}
      }

      const page = await doc.getPage(pageNumber);

      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const renderScale = Math.max(dpr, 2);
      const viewport = page.getViewport({ scale: renderScale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
      canvas.style.width = "100%";
      canvas.style.height = "auto";

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      const task = page.render(renderContext);
      currentRenderTask.current = task;
      await task.promise;
    } catch (err: any) {
      if (err?.name !== "RenderingCancelledException") {
        console.warn("Page render note:", err);
      }
    }
  };

  // Re-render when page, zoom, or fullscreen changes
  useEffect(() => {
    if (pdfDocRef.current) {
      renderPage(pdfDocRef.current, currentPage, canvasRef.current, zoom);
      if (isFullscreen) {
        renderPage(pdfDocRef.current, currentPage, fullscreenCanvasRef.current, zoom);
      }
    }
  }, [currentPage, zoom, isFullscreen]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-xl border border-white/15 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Top Control Bar */}
        <div className="px-4 py-3 border-b border-white/10 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2.5 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Real Document (LibreOffice)
                </span>

                {isSyncing ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin mr-1 text-accent-cyan" />
                    Menyelaraskan...
                  </span>
                ) : hasUnsyncedChanges ? (
                  <button
                    type="button"
                    onClick={onRefreshPreview}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse hover:bg-amber-500/30 transition cursor-pointer"
                    title="Klik untuk menyelaraskan perubahan"
                  >
                    <RefreshCw className="w-2.5 h-2.5 mr-1" />
                    Perbarui Berkas ↻
                  </button>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
                    Tersinkronisasi
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-sans hidden sm:block">
                Render berkas asli dengan Kop Surat resmi (UNESA & HMP), tabel, dan format cetak resmi
              </p>
            </div>
          </div>

          {/* Action & Pagination Controls */}
          <div className="flex items-center space-x-1.5">
            {/* Page Navigation */}
            {totalPages > 1 && (
              <div className="flex items-center bg-black/60 border border-white/10 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 text-[10px] font-mono font-bold text-slate-300">
                  {currentPage}/{totalPages}
                </span>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center bg-black/60 border border-white/10 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(60, z - 10))}
                disabled={zoom <= 60}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
                title="Perkecil Zoom (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="px-1.5 text-[10px] font-mono font-bold text-slate-300 hover:text-white"
                title="Reset Zoom"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(140, z + 10))}
                disabled={zoom >= 140}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
                title="Perbesar Zoom (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Manual Sync / Refresh Button */}
            {onRefreshPreview && (
              <button
                type="button"
                onClick={onRefreshPreview}
                disabled={loading || isSyncing}
                className={`p-2 text-slate-300 hover:text-white border border-white/10 rounded-xl transition cursor-pointer disabled:opacity-40 ${
                  hasUnsyncedChanges ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse" : "bg-white/5 hover:bg-white/10"
                }`}
                title="Perbarui Pratinjau Berkas Sekarang"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-accent-cyan" : ""}`} />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition cursor-pointer shadow-sm"
              title="Layar Penuh (Fullscreen)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Crosscheck Progress Tracker */}
        <div className="px-4 py-2.5 bg-slate-950/50 border-b border-white/5 flex flex-col space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Status Isian:</span>
              <span className={`font-bold ${isComplete ? "text-emerald-400" : "text-accent-cyan"}`}>
                {filledCount} / {totalFields} Kolom Terisi ({percentComplete}%)
              </span>
            </div>

            {isComplete ? (
              <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Dokumen Siap Dicetak</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowMissingList(!showMissingList)}
                className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{missingRequired.length} Belum Diisi</span>
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentComplete}%` }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`h-full rounded-full ${
                isComplete
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  : "bg-gradient-to-r from-accent-cyan via-blue-500 to-accent-purple"
              }`}
            />
          </div>

          {/* Collapsible missing fields checklist */}
          <AnimatePresence>
            {showMissingList && missingRequired.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 text-xs font-mono"
              >
                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 space-y-2 shadow-inner">
                  <span className="font-bold block text-[11px] text-amber-300">
                    Klik nama kolom untuk langsung melengkapi:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingRequired.map((label, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (onFocusField) onFocusField(label);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] text-amber-100 transition cursor-pointer font-sans font-medium active:scale-95"
                      >
                        • {label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Real Native Document Canvas Viewport */}
        <div className="flex-1 p-3 sm:p-5 bg-[#070b16] relative min-h-[520px] max-h-[720px] overflow-auto flex justify-center items-start select-text">
          {loading && !pdfDataBuffer ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
              <div className="w-10 h-10 border-3 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
              <p className="font-mono text-xs text-slate-300">Merender berkas asli Word & PDF resmi...</p>
            </div>
          ) : (
            <div className="relative flex flex-col items-center">
              {/* Subtle Sync Indicator overlay bar without blocking view */}
              {isSyncing && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-slate-950/90 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono shadow-xl backdrop-blur-md flex items-center space-x-1.5 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin text-accent-cyan" />
                  <span>Menyelaraskan perubahan...</span>
                </div>
              )}

              {/* The Real Canvas Render of the LibreOffice Document */}
              <div
                className="bg-white rounded-sm shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_1px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-150 ease-out"
                style={{
                  width: `${Math.round(620 * (zoom / 100))}px`,
                  maxWidth: "100%",
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="block w-full h-auto"
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Quick-Action Bar */}
        <div className="px-4 py-3 bg-slate-950/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 z-10">
          <span className="text-[11px] font-mono text-slate-400 truncate max-w-[180px] sm:max-w-xs">
            {templateTitle}
          </span>

          <div className="flex items-center space-x-2">
            {onDownloadDocx && (
              <button
                type="button"
                onClick={onDownloadDocx}
                disabled={submitting}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-mono text-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Unduh file Word .DOCX"
              >
                <FileType className="w-3.5 h-3.5 text-accent-purple" />
                <span className="hidden sm:inline">DOCX</span>
              </button>
            )}

            {onDownloadPdf && (
              <button
                type="button"
                onClick={onDownloadPdf}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-cyan to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs shadow-[0_0_20px_rgba(6,182,212,0.3)] transition active:scale-95 disabled:opacity-60 flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>{submitting ? "Memproses..." : "Unduh PDF Resmi"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-2xl flex flex-col font-sans"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/15 bg-slate-950/90 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-accent-cyan" />
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    {templateTitle} - Pratinjau Berkas Asli Layar Penuh
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    Halaman {currentPage} dari {totalPages} • {filledCount}/{totalFields} Data Terisi
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Tutup Layar Penuh"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Fullscreen Canvas Body */}
            <div className="flex-1 p-4 sm:p-8 bg-[#050814] overflow-auto flex justify-center items-start">
              <div
                className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-150 ease-out"
                style={{
                  width: `${Math.round(820 * (zoom / 100))}px`,
                  maxWidth: "100%",
                }}
              >
                <canvas
                  ref={fullscreenCanvasRef}
                  className="block w-full h-auto"
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
