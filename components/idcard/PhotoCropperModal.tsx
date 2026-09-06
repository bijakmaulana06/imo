'use client';

import React, { useEffect, useRef, useState } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import {
  Crop,
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
} from 'lucide-react';

interface PhotoCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onCropComplete: (croppedDataUrl: string) => void;
  onClose: () => void;
  /** Aspect ratio default: 3 / 4 (0.75) */
  aspectRatio?: number;
}

export default function PhotoCropperModal({
  isOpen,
  imageSrc,
  onCropComplete,
  onClose,
  aspectRatio = 3 / 4,
}: PhotoCropperModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const [currentAspect, setCurrentAspect] = useState<number>(aspectRatio);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);

  // Initialize CropperJS on image element
  useEffect(() => {
    if (!isOpen || !imageSrc || !imgRef.current) return;

    // Destroy existing instance if any
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }

    const cropper = new Cropper(imgRef.current, {
      aspectRatio: currentAspect,
      viewMode: 1, // Restrict crop box within image container
      dragMode: 'move',
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
  }, [isOpen, imageSrc]);

  // Handle Aspect Ratio Change
  const handleAspectChange = (ratio: number) => {
    setCurrentAspect(ratio);
    if (cropperRef.current) {
      cropperRef.current.setAspectRatio(ratio);
    }
  };


  // Zoom controls
  const handleZoom = (delta: number) => {
    if (cropperRef.current) {
      cropperRef.current.zoom(delta);
    }
  };

  // Rotate controls
  const handleRotate = (degree: number) => {
    if (cropperRef.current) {
      cropperRef.current.rotate(degree);
    }
  };

  // Flip controls
  const handleFlipX = () => {
    if (cropperRef.current) {
      const newScaleX = scaleX === 1 ? -1 : 1;
      setScaleX(newScaleX);
      cropperRef.current.scaleX(newScaleX);
    }
  };

  const handleFlipY = () => {
    if (cropperRef.current) {
      const newScaleY = scaleY === 1 ? -1 : 1;
      setScaleY(newScaleY);
      cropperRef.current.scaleY(newScaleY);
    }
  };

  // Reset transform
  const handleReset = () => {
    if (cropperRef.current) {
      cropperRef.current.reset();
      setScaleX(1);
      setScaleY(1);
      setCurrentAspect(aspectRatio);
      cropperRef.current.setAspectRatio(aspectRatio);
    }
  };

  // Crop & Apply
  const handleApply = () => {
    if (!cropperRef.current) return;
    const canvas = cropperRef.current.getCroppedCanvas({
      maxWidth: 1200,
      maxHeight: 1600,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });
    if (canvas) {
      const croppedDataUrl = canvas.toDataURL('image/png', 0.95);
      onCropComplete(croppedDataUrl);
      onClose();
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(125,249,255,0.2)]">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                EDIT & PENYESUAIAN FOTO BEBAS
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Atur posisi, perbesar/perkecil, dan rotasi foto agar pas pada ID Card
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Cropper Canvas Area */}
        <div className="relative flex-1 p-4 bg-slate-950 flex items-center justify-center min-h-[320px] max-h-[500px] overflow-hidden">
          <div className="max-w-full max-h-full rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Source preview for cropper"
              className="block max-w-full max-h-[420px]"
            />
          </div>
        </div>

        {/* Modal Controls Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 flex flex-col gap-3">
          {/* Preset Aspect Ratios */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
            <span className="text-slate-400 font-semibold">Rasio Potongan:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAspectChange(3 / 4)}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  Math.abs(currentAspect - 3 / 4) < 0.01
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 font-bold shadow-[0_0_10px_rgba(125,249,255,0.2)]'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                3:4 (Portrait ID Card)
              </button>
              <button
                type="button"
                onClick={() => handleAspectChange(1)}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  currentAspect === 1
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 font-bold shadow-[0_0_10px_rgba(125,249,255,0.2)]'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                1:1 (Persegi)
              </button>
              <button
                type="button"
                onClick={() => handleAspectChange(NaN)}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  isNaN(currentAspect)
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 font-bold shadow-[0_0_10px_rgba(125,249,255,0.2)]'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Bebas (Free)
              </button>
            </div>
          </div>

          {/* Action Toolbar Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/60 flex-wrap">
            {/* Tool buttons (Zoom, Rotate, Flip) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                title="Zoom In"
                onClick={() => handleZoom(0.1)}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Zoom Out"
                onClick={() => handleZoom(-0.1)}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-slate-800 mx-1" />

              <button
                type="button"
                title="Rotate Left 90°"
                onClick={() => handleRotate(-90)}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Rotate Right 90°"
                onClick={() => handleRotate(90)}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-slate-800 mx-1" />

              <button
                type="button"
                title="Flip Horizontal"
                onClick={handleFlipX}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Flip Vertical"
                onClick={handleFlipY}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
              >
                <FlipVertical className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-slate-800 mx-1" />

              <button
                type="button"
                title="Reset Transform"
                onClick={handleReset}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Apply & Cancel Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(125,249,255,0.3)] active:scale-95"
              >
                <Check className="w-4 h-4" />
                Terapkan Foto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
