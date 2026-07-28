import React from "react";
import ImoLogo from "@/components/ImoLogo";
import RealisticBlackHole from "@/components/RealisticBlackHole";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#020510]/95 backdrop-blur-2xl transition-all duration-500 animate-in fade-in select-none">
      
      {/* Top White Laser Glow Line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#020510]">
        <div className="h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer shadow-[0_0_20px_#ffffff,0_0_40px_#ffffff]" />
      </div>

      {/* Futuristic Black Hole Loader Container */}
      <div className="relative flex flex-col items-center justify-center p-10 rounded-3xl glass border border-white/30 shadow-[0_0_80px_rgba(255,255,255,0.25)] max-w-sm w-full mx-4 text-center">
        
        {/* REALISTIC CANVAS BLACK HOLE */}
        <div className="mb-6">
          <RealisticBlackHole size={220} />
        </div>

        {/* Brand Logo & Singularity Text */}
        <div className="flex items-center space-x-2.5 mb-2">
          <ImoLogo height={36} className="h-8 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]" />
          <span className="font-display font-black text-white text-lg tracking-wider drop-shadow-[0_0_12px_#ffffff]">2026</span>
        </div>

        {/* Loading Text */}
        <p className="text-xs font-mono text-white font-black uppercase tracking-[0.25em] drop-shadow-[0_0_10px_#ffffff] animate-pulse mb-5">
          GRAVITATIONAL LENSING...
        </p>

        {/* Glowing White Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-white/30 p-0.5 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          <div className="h-full bg-gradient-to-r from-slate-400 via-white to-slate-400 rounded-full animate-pulse shadow-[0_0_15px_#ffffff] w-full" />
        </div>

      </div>
    </div>
  );
}
