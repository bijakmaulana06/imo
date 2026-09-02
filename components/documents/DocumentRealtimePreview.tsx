"use client";

import React, { useState } from "react";
import {
  FileText,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  HelpCircle,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentRealtimePreviewProps {
  htmlContent: string;
  loading: boolean;
  totalFields: number;
  filledCount: number;
  missingRequired: string[];
  templateTitle?: string;
  highlightMode: boolean;
  onToggleHighlightMode: () => void;
  onFocusField?: (tagOrLabel: string) => void;
  onDownloadPdf?: () => void;
  submitting?: boolean;
}

export default function DocumentRealtimePreview({
  htmlContent,
  loading,
  totalFields,
  filledCount,
  missingRequired,
  templateTitle = "Dokumen",
  highlightMode,
  onToggleHighlightMode,
  onFocusField,
  onDownloadPdf,
  submitting = false,
}: DocumentRealtimePreviewProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showMissingList, setShowMissingList] = useState<boolean>(false);

  const percentComplete = totalFields > 0 ? Math.round((filledCount / totalFields) * 100) : 0;
  const isComplete = missingRequired.length === 0 && totalFields > 0;

  const handleZoomIn = () => setZoom((prev) => Math.min(160, prev + 15));
  const handleZoomOut = () => setZoom((prev) => Math.max(60, prev - 15));
  const handleResetZoom = () => setZoom(100);

  return (
    <>
      <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Top Control Bar */}
        <div className="px-4 py-3.5 border-b border-white/10 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2.5 z-10">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Live Preview Surat
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  Real-time
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans hidden sm:block">
                Tampilan persis sesuai berkas surat yang akan dicetak
              </p>
            </div>
          </div>

          {/* Action & View Toggles */}
          <div className="flex items-center space-x-1.5">
            {/* Highlight Mode Toggle */}
            <button
              type="button"
              onClick={onToggleHighlightMode}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                highlightMode
                  ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:text-white"
              }`}
              title={highlightMode ? "Mode Sorot Data Aktif (Klik untuk Mode Bersih)" : "Aktifkan Sorotan Tag Data"}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{highlightMode ? "Sorot Data" : "Mode Cetak"}</span>
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center bg-black/50 border border-white/10 rounded-xl p-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 60}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/10 transition cursor-pointer"
                title="Perkecil (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 text-[10px] font-mono font-bold text-slate-300 hover:text-white"
                title="Reset Zoom (100%)"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 160}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/10 transition cursor-pointer"
                title="Perbesar (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen Expand */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition cursor-pointer"
              title="Perbesar Layar Penuh"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Crosscheck Progress Bar */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-white/5 flex flex-col space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Crosscheck Data:</span>
              <span className={`font-bold ${isComplete ? "text-emerald-400" : "text-amber-400"}`}>
                {filledCount} / {totalFields} Terisi ({percentComplete}%)
              </span>
            </div>

            {isComplete ? (
              <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                <span>Semua Valid & Siap Cetak</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowMissingList(!showMissingList)}
                className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 transition cursor-pointer"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>{missingRequired.length} Belum Diisi</span>
              </button>
            )}
          </div>

          {/* Progress track */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentComplete}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`h-full rounded-full ${
                isComplete
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : "bg-gradient-to-r from-accent-cyan to-accent-purple"
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
                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 space-y-1.5">
                  <span className="font-bold block text-[11px] text-amber-300">
                    Kolom Wajib yang Perlu Dilengkapi:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingRequired.map((label, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (onFocusField) onFocusField(label);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[10px] text-amber-100 transition cursor-pointer"
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

        {/* Paper Container Body */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 flex items-start justify-center bg-[#070b19]/90 relative min-h-[420px]">
          {loading ? (
            <div className="my-auto flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
              <div className="w-10 h-10 border-3 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
              <p className="font-mono text-xs text-slate-300">Merender preview surat real-time...</p>
            </div>
          ) : (
            <div
              className="transition-transform duration-150 origin-top flex justify-center w-full"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              {/* Simulated Authentic A4 Sheet */}
              <div
                className="a4-paper-sheet relative w-full max-w-[760px] bg-white text-slate-900 rounded-lg sm:rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_2px_rgba(0,0,0,0.2)] p-6 sm:p-10 md:p-12 font-serif select-text text-sm sm:text-base leading-relaxed overflow-x-auto"
                style={{
                  minHeight: "850px",
                  fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
                }}
              >
                {/* Official Paper Top Header Border simulation */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-700 via-cyan-500 to-indigo-700 rounded-t-lg sm:rounded-t-xl opacity-90 pointer-events-none" />

                {/* Rendered HTML content from DOCX */}
                <div
                  className="docx-preview-content prose prose-slate max-w-none space-y-4"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Quick-Action Bar inside preview */}
        {onDownloadPdf && (
          <div className="px-4 py-3 bg-slate-950/80 border-t border-white/10 flex items-center justify-between z-10">
            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              {templateTitle}
            </span>
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-cyan to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition active:scale-95 disabled:opacity-60 flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>{submitting ? "Mengolah..." : "Unduh PDF Sekarang"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Modal View */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-2xl flex flex-col font-sans"
          >
            {/* Fullscreen Header */}
            <div className="px-6 py-4 border-b border-white/15 bg-slate-950/90 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-accent-cyan" />
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    {templateTitle} - Mode Pratinjau Layar Penuh
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    Status: {filledCount}/{totalFields} Data Terisi
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onToggleHighlightMode}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    highlightMode
                      ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40"
                      : "bg-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{highlightMode ? "Sorot Data: ON" : "Mode Cetak Asli"}</span>
                </button>

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

            {/* Fullscreen Sheet Scroll Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-10 flex justify-center items-start bg-[#050814]">
              <div
                className="a4-paper-sheet w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-8 sm:p-16 font-serif text-base sm:text-lg leading-relaxed my-auto"
                style={{
                  minHeight: "1000px",
                  fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
                }}
              >
                <div
                  className="docx-preview-content prose prose-slate max-w-none space-y-4"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Injected Paper & Highlight CSS Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .docx-preview-content table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .docx-preview-content th,
        .docx-preview-content td {
          padding: 0.25rem 0.5rem;
          vertical-align: top;
          text-align: left;
        }
        .docx-preview-content p {
          margin-top: 0.4rem;
          margin-bottom: 0.4rem;
          line-height: 1.6;
        }
        .docx-preview-content h1,
        .docx-preview-content h2,
        .docx-preview-content h3 {
          text-align: center;
          font-weight: bold;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .imo-doc-filled {
          background-color: rgba(6, 182, 212, 0.18);
          color: #083344;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
          border-bottom: 2px solid #0891b2;
          display: inline-block;
          margin: 0 1px;
          transition: all 0.2s ease;
        }
        .imo-doc-empty {
          background-color: rgba(245, 158, 11, 0.16);
          color: #92400e;
          font-style: italic;
          font-family: monospace;
          font-size: 0.9em;
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px dashed #d97706;
          display: inline-block;
          margin: 0 1px;
        }
      `}} />
    </>
  );
}
