"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  FileType,
  Sparkles,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentRealtimePreviewProps {
  filledDocxBuffer: ArrayBuffer | null;
  loading: boolean;
  totalFields: number;
  filledCount: number;
  missingRequired: string[];
  templateTitle?: string;
  onFocusField?: (tagOrLabel: string) => void;
  onDownloadPdf?: () => void;
  onDownloadDocx?: () => void;
  submitting?: boolean;
}

export default function DocumentRealtimePreview({
  filledDocxBuffer,
  loading,
  totalFields,
  filledCount,
  missingRequired,
  templateTitle = "Dokumen",
  onFocusField,
  onDownloadPdf,
  onDownloadDocx,
  submitting = false,
}: DocumentRealtimePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showMissingList, setShowMissingList] = useState<boolean>(false);
  const [renderingDoc, setRenderingDoc] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const percentComplete = totalFields > 0 ? Math.round((filledCount / totalFields) * 100) : 0;
  const isComplete = missingRequired.length === 0 && totalFields > 0;

  // Render Real DOCX Layout using docx-preview
  const renderDocx = async (buffer: ArrayBuffer, targetEl: HTMLElement) => {
    if (!targetEl || !buffer) return;
    try {
      setRenderingDoc(true);
      setRenderError(null);
      targetEl.innerHTML = "";

      const docx = await import("docx-preview");
      await docx.renderAsync(buffer, targetEl, undefined, {
        className: "imo-real-docx",
        inWrapper: true,
        breakPages: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
      });
    } catch (err: any) {
      console.error("docx-preview render error:", err);
      setRenderError(err.message || "Gagal merender tata letak dokumen");
    } finally {
      setRenderingDoc(false);
    }
  };

  // Main container render
  useEffect(() => {
    if (!filledDocxBuffer || !containerRef.current) return;
    renderDocx(filledDocxBuffer, containerRef.current);
  }, [filledDocxBuffer]);

  // Fullscreen container render
  useEffect(() => {
    if (isFullscreen && filledDocxBuffer && fullscreenContainerRef.current) {
      renderDocx(filledDocxBuffer, fullscreenContainerRef.current);
    }
  }, [isFullscreen, filledDocxBuffer]);

  const handleZoomIn = () => setZoom((prev) => Math.min(150, prev + 15));
  const handleZoomOut = () => setZoom((prev) => Math.max(50, prev - 15));
  const handleResetZoom = () => setZoom(100);

  return (
    <>
      <div className="flex flex-col h-full bg-slate-900/80 backdrop-blur-xl border border-white/15 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Top Control Bar */}
        <div className="px-4 py-3.5 border-b border-white/10 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2.5 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Real File Preview (DOCX & PDF)
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                  Live Sync
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans hidden sm:block">
                Pratinjau visual asli dokumen Word/PDF dengan kop surat, tabel, dan tata letak resmi
              </p>
            </div>
          </div>

          {/* Action & Zoom Controls */}
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-black/60 border border-white/10 rounded-xl p-0.5 shadow-inner">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/10 transition cursor-pointer"
                title="Perkecil Zoom (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 text-[10px] font-mono font-bold text-slate-300 hover:text-white"
                title="Reset Zoom (100%)"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 150}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/10 transition cursor-pointer"
                title="Perbesar Zoom (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen Modal Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition cursor-pointer shadow-sm"
              title="Pratinjau Layar Penuh (Fullscreen)"
            >
              <Maximize2 className="w-4 h-4" />
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
                <span>{missingRequired.length} Kolom Belum Terisi</span>
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentComplete}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
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
                    Klik nama kolom untuk langsung mengisi:
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

        {/* Real Document Viewport Canvas */}
        <div className="flex-1 overflow-auto p-2 sm:p-5 flex items-start justify-center bg-[#070b16] relative min-h-[460px] max-h-[720px] select-text">
          {loading || renderingDoc ? (
            <div className="my-auto flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
              <div className="w-10 h-10 border-3 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
              <p className="font-mono text-xs text-slate-300">Merender pratinjau asli berkas dokumen...</p>
            </div>
          ) : renderError ? (
            <div className="my-auto p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center max-w-sm text-rose-300 text-xs font-mono">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <p>{renderError}</p>
            </div>
          ) : null}

          {/* docx-preview target container */}
          <div
            className="w-full flex justify-center origin-top transition-transform duration-150"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <div
              ref={containerRef}
              className="docx-preview-host w-full max-w-[820px] flex flex-col items-center"
            />
          </div>
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

      {/* Fullscreen Real Preview Modal */}
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
                    {templateTitle} - Mode Pratinjau Layar Penuh Asli
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    Status: {filledCount}/{totalFields} Data Terisi
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

            {/* Fullscreen Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-10 flex justify-center items-start bg-[#050814]">
              <div
                ref={fullscreenContainerRef}
                className="docx-preview-host w-full max-w-4xl flex flex-col items-center"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scoped CSS for authentic Microsoft Word paper appearance */}
      <style dangerouslySetInnerHTML={{__html: `
        .docx-preview-host .docx-wrapper {
          background: transparent !important;
          padding: 10px 0 !important;
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        .docx-preview-host section.docx {
          background: #ffffff !important;
          color: #0f172a !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 1px rgba(0, 0, 0, 0.3) !important;
          border-radius: 8px !important;
          margin: 0 auto 24px auto !important;
          box-sizing: border-box !important;
          max-width: 100% !important;
          overflow-x: auto !important;
        }
        @media (max-width: 640px) {
          .docx-preview-host section.docx {
            padding: 24px 18px !important;
            min-height: auto !important;
            font-size: 12px !important;
          }
        }
      `}} />
    </>
  );
}
