"use client";

import React from "react";

export default function RealisticBlackHole({ size = 220 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* 1. Deep Space Gravitational Lensing Ambient Glow */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.6)_0%,rgba(125,249,255,0.3)_35%,rgba(180,140,255,0.15)_60%,transparent_80%)] blur-2xl animate-pulse" />

      {/* 2. Top & Bottom Warped Gravitational Light Halo */}
      <div className="absolute inset-2 rounded-full border-t-[4px] border-b-[4px] border-white blur-[2px] shadow-[0_0_35px_#ffffff,0_0_65px_#ffffff]" />

      {/* 3. Smooth Accretion Ring (Continuous Flow - Scaled & Blended) */}
      <div className="absolute inset-1 rounded-full flex items-center justify-center scale-y-[0.32]">
        <div className="w-full h-full rounded-full animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,#ffffff_0%,rgba(255,255,255,0.95)_30%,rgba(125,249,255,0.75)_55%,rgba(255,209,102,0.4)_80%,#ffffff_100%)] blur-[3px] shadow-[0_0_50px_#ffffff,0_0_90px_#7df9ff]" />
      </div>

      {/* 4. Single Pitch-Black Event Horizon Void Sphere (No inner circles/eyeball artifact) */}
      <div className="relative w-24 h-24 rounded-full bg-black border-2 border-white shadow-[0_0_30px_#ffffff,0_0_60px_#ffffff] z-10" />

      {/* 5. Front Equator Accretion Light Stream (Passes IN FRONT of black sphere to eliminate stacked layer look) */}
      <div className="absolute w-[88%] h-5 rounded-full bg-gradient-to-r from-white via-white/90 to-transparent blur-[2px] shadow-[0_0_25px_#ffffff] z-20 pointer-events-none translate-y-1.5 opacity-85" />
    </div>
  );
}
