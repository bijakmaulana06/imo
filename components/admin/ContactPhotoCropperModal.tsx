"use client";

import React, { useEffect, useRef, useState } from "react";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  FlipHorizontal,
  FlipVertical,
  RefreshCw,
  Check,
  X,
  Sparkles,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

interface ContactPhotoCropperModalProps {
  isOpen: boolean;
  file: File | null;
  onClose: () => void;
  onSuccess: (uploadedUrl: string) => void;
}

export default function ContactPhotoCropperModal({
  isOpen,
  file,
  onClose,
  onSuccess,
}: ContactPhotoCropperModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate object URL for preview when file is selected
  useEffect(() => {
    if (!file) {
      setPreviewSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewSrc(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Initialize CropperJS on preview image
  useEffect(() => {
    if (!isOpen || !previewSrc || !imgRef.current) return;

    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }

    const cropper = new Cropper(imgRef.current, {
      aspectRatio: 1, // 1:1 Square avatar matching /contact UI
      viewMode: 1,
      dragMode: "move",
      autoCropArea: 0.9,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      background: true,
      responsive: true,
    });

    cropperRef.current = cropper;

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [isOpen, previewSrc]);

  // Cropper Controls
  const handleZoom = (delta: number) => {
    cropperRef.current?.zoom(delta);
  };

  const handleRotate = (deg: number) => {
    cropperRef.current?.rotate(deg);
  };

  const handleFlipX = () => {
    if (!cropperRef.current) return;
    const next = scaleX === 1 ? -1 : 1;
    setScaleX(next);
    cropperRef.current.scaleX(next);
  };

  const handleFlipY = () => {
    if (!cropperRef.current) return;
    const next = scaleY === 1 ? -1 : 1;
    setScaleY(next);
    cropperRef.current.scaleY(next);
  };

  const handleReset = () => {
    if (!cropperRef.current) return;
    cropperRef.current.reset();
    setScaleX(1);
    setScaleY(1);
  };

  // Submit to server for processing & R2 storage
  const handleUploadServer = async () => {
    if (!cropperRef.current || !file) return;

    setUploading(true);
    setError(null);

    try {
      // Ambil parameter crop murni tanpa rendering canvas berat di client
      const cropData = cropperRef.current.getData(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("cropData", JSON.stringify(cropData));

      const res = await fetch("/api/admin/contact-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses foto di server.");
      }

      onSuccess(data.url);
      onClose();
    } catch (err: any) {
      console.error("Gagal upload foto kontak:", err);
      setError(err.message || "Terjadi kesalahan saat memproses foto.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen || !previewSrc) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass rounded-3xl p-6 border border-accent-cyan/40 max-w-xl w-full flex flex-col shadow-[0_0_50px_rgba(125,249,255,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-card-border/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan shadow-[0_0_10px_rgba(125,249,255,0.3)]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-slate-100">
                Atur & Pangkas Foto Profil
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Rasio 1:1 bundar. Pemrosesan crop & kompresi dilakukan di server side.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-80 bg-slate-950/90 rounded-2xl overflow-hidden my-4 border border-card-border/60 flex items-center justify-center">
          <img
            ref={imgRef}
            src={previewSrc}
            alt="Pratinjau Cropper Kontak"
            className="max-w-full max-h-full block"
          />

          {/* Circular mask guide */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-56 h-56 rounded-full border-2 border-dashed border-accent-cyan/60 shadow-[0_0_0_9999px_rgba(2,5,16,0.55)]" />
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-card-border/40 text-slate-300">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleZoom(0.1)}
              className="p-2 rounded-xl hover:bg-slate-800 hover:text-accent-cyan transition cursor-pointer"
              title="Perbesar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom(-0.1)}
              className="p-2 rounded-xl hover:bg-slate-800 hover:text-accent-cyan transition cursor-pointer"
              title="Perkecil"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-card-border/50 mx-1" />
            <button
              type="button"
              onClick={() => handleRotate(-90)}
              className="p-2 rounded-xl hover:bg-slate-800 hover:text-accent-purple transition cursor-pointer"
              title="Putar 90° Kiri"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleRotate(90)}
              className="p-2 rounded-xl hover:bg-slate-800 hover:text-accent-purple transition cursor-pointer"
              title="Putar 90° Kanan"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-card-border/50 mx-1" />
            <button
              type="button"
              onClick={handleFlipX}
              className="p-2 rounded-xl hover:bg-slate-800 hover:text-accent-yellow transition cursor-pointer"
              title="Balik Horizontal"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleFlipY}
              className="p-2 rounded-xl hover:bg-slate-800 hover:text-accent-yellow transition cursor-pointer"
              title="Balik Vertikal"
            >
              <FlipVertical className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer font-mono"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-card-border/20">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-card-border text-slate-300 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleUploadServer}
            disabled={uploading}
            className="px-5 py-2.5 rounded-xl bg-accent-cyan text-black font-extrabold text-xs shadow-[0_0_20px_rgba(125,249,255,0.4)] hover:shadow-[0_0_25px_rgba(125,249,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Memproses di Server R2...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-black" />
                <span>Simpan Foto (Server Side)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
