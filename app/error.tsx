"use client";

import React, { useEffect } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console
    console.error("Global boundary error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,30,55,0.3),rgba(5,8,16,1))] z-0 pointer-events-none" />

      <Card glowColor="yellow" className="relative z-10 max-w-md w-full text-center p-8 border border-amber-900/30">
        {/* Warning Icon */}
        <div className="h-16 w-16 bg-accent-yellow/10 border border-accent-yellow/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(255,209,102,0.15)]">
          <AlertTriangle className="h-8 w-8 text-accent-yellow" />
        </div>

        {/* Heading */}
        <h2 className="font-display font-extrabold text-2xl tracking-wide text-slate-100 mb-2">
          Anomali Gravitasi Terdeteksi
        </h2>
        
        {/* Subtitle */}
        <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-6">
          System telemetry report: page crashed
        </p>

        {/* Error Info Box */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-card-border/50 text-left mb-8 max-h-36 overflow-y-auto">
          <p className="text-xs font-mono text-red-400/90 leading-relaxed break-words">
            {error.message || "An unknown error has decoupled the UI from its orbital path."}
          </p>
        </div>

        {/* Reset Action */}
        <Button
          variant="outline"
          size="md"
          onClick={() => reset()}
          className="w-full flex items-center justify-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Kalibrasi Ulang (Retry)</span>
        </Button>
      </Card>
    </div>
  );
}
