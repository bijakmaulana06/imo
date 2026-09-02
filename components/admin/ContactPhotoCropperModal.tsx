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
  Loader2,
  Image as ImageIcon,
  Move,
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
      aspectRatio: 1, // Strictly 1:1 circular ratio
      viewMode: 1,
      dragMode: "move", // Drag to pan the image seamlessly
      autoCropArea: 0.85,
      restore: false,
      guides: false, // Turn off rectangular dashed guides for clean circular appearance
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      background: false, // Remove checkerboard background
      responsive: true,
      preview: ".avatar-live-circle-preview", // Real-time circular avatar preview
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
      // 1. Client-side canvas crop & compress to 400x400 WebP blob (~30-80KB)
      // This prevents 413 Payload Too Large error when uploading high-res camera photos.
      let uploadBlob: Blob | File = file;
      let uploadFilename = file.name || "avatar.webp";

      try {
        const canvas = cropperRef.current.getCroppedCanvas({
          width: 400,
          height: 400,
          imageSmoothingEnabled: true,
          imageSmoothingQuality: "high",
        });

        if (canvas) {
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), "image/webp", 0.88);
          });
          if (blob) {
            uploadBlob = blob;
            uploadFilename = uploadFilename.replace(/\.[^/.]+$/, "") + ".webp";
          }
        }
      } catch (canvasErr) {
        console.warn("Client-side canvas cropping fallback to raw file:", canvasErr);
      }

      // Extract crop parameters as metadata for server
      const cropData = cropperRef.current.getData(true);

      const formData = new FormData();
      formData.append("file", uploadBlob, uploadFilename);
      formData.append("cropData", JSON.stringify(cropData));

      const res = await fetch("/api/admin/contact-photo", {
        method: "POST",
        body: formData,
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        if (res.status === 413 || responseText.includes("Request Entity Too Large")) {
          throw new Error("Ukuran foto terlalu besar untuk diunggah (Maksimal 4.5MB). Silakan gunakan foto yang lebih kecil.");
        }
        throw new Error(`Respon server tidak valid (${res.status}): ${responseText.slice(0, 100)}`);
      }

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
      {/* Scoped CSS for Genuine Circular Cropper without confusing static overlays */}
      <style jsx global>{`
        .circular-avatar-cropper .cropper-view-box,
        .circular-avatar-cropper .cropper-face {
          border-radius: 50% !important;
        }
        .circular-avatar-cropper .cropper-view-box {
          outline: 2.5px solid #7df9ff !important;
          box-shadow: 0 0 20px rgba(125, 249, 255, 0.45) !important;
        }
        .circular-avatar-cropper .cropper-modal {
          background-color: rgba(2, 5, 16, 0.8) !important;
          opacity: 0.85 !important;
        }
        .circular-avatar-cropper .cropper-dashed,
        .circular-avatar-cropper .cropper-line,
        .circular-avatar-cropper .cropper-point.point-e,
        .circular-avatar-cropper .cropper-point.point-w,
        .circular-avatar-cropper .cropper-point.point-s,
        .circular-avatar-cropper .cropper-point.point-n {
          display: none !important;
        }
        .circular-avatar-cropper .cropper-point.point-nw,
        .circular-avatar-cropper .cropper-point.point-ne,
        .circular-avatar-cropper .cropper-point.point-sw,
        .circular-avatar-cropper .cropper-point.point-se {
          width: 14px !important;
          height: 14px !important;
          border-radius: 50% !important;
          background-color: #7df9ff !important;
          border: 2.5px solid #020510 !important;
          opacity: 1 !important;
        }
        .avatar-live-circle-preview {
          overflow: hidden;
        }
        .avatar-live-circle-preview img {
          max-width: none !important;
        }
      `}</style>

      <div className="glass rounded-3xl p-6 border border-accent-cyan/40 max-w-2xl w-full flex flex-col shadow-[0_0_50px_rgba(125,249,255,0.2)]">
        {/* Header with Live Circle Preview */}
        <div className="flex items-center justify-between pb-4 border-b border-card-border/30 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan shadow-[0_0_12px_rgba(125,249,255,0.3)]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-slate-100">
                Pangkas & Sesuaikan Foto Profil
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Tarik sudut lingkaran atau geser foto untuk mengatur posisi wajah.
              </p>
            </div>
          </div>

          {/* Real-time Live Preview Thumbnail */}
          <div className="flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-2xl border border-card-border/60 flex-shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-accent-cyan shadow-[0_0_15px_rgba(125,249,255,0.35)] avatar-live-circle-preview bg-black flex-shrink-0" />
            <div className="hidden sm:block text-left">
              <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">Hasil Akhir</span>
              <span className="text-[11px] font-bold text-accent-cyan block">Pratinjau</span>
            </div>
            <button
              onClick={onClose}
              disabled={uploading}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Cropper Canvas */}
        <div className="relative w-full h-88 md:h-[400px] bg-[#020510] rounded-2xl overflow-hidden my-4 border border-card-border/60 flex items-center justify-center circular-avatar-cropper">
          <img
            ref={imgRef}
            src={previewSrc}
            alt="Pratinjau Foto Kontak"
            className="max-w-full max-h-full block"
          />
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/80 border border-card-border/40 text-slate-300">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleZoom(0.1)}
              className="p-2 rounded-xl hover:bg-slate-800 hover:text-accent-cyan transition cursor-pointer flex items-center gap-1 text-xs"
              title="Perbesar Foto"
            >
              <ZoomIn className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px] font-mono">Zoom In</span>
            </button>
            <button
              type="button"
              onClick={() => handleZoom(-0.1)}
              className="p-2 rounded-xl hover:bg-slate-800 hover:text-accent-cyan transition cursor-pointer flex items-center gap-1 text-xs"
              title="Perkecil Foto"
            >
              <ZoomOut className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px] font-mono">Zoom Out</span>
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer font-mono"
            title="Kembalikan posisi semula"
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
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-card-border/20">
          <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
            ⚡ Pemotongan & kompresi WebP otomatis diproses di server.
          </p>

          <div className="flex items-center gap-3 ml-auto">
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
                  <span>Terapkan & Simpan Foto</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
