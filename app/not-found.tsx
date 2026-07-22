"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, ShieldAlert, Compass, Home, ArrowLeft } from "lucide-react";

export default function DeepSpaceNotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [oxygen, setOxygen] = useState(4.04);

  // Oxygen depletion simulation for eerie immersion
  useEffect(() => {
    const timer = setInterval(() => {
      setOxygen((prev) => (prev > 0.5 ? prev - 0.01 : 0.404));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Canvas for realistic eerie black hole & cosmic dust
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Eerie dust particles
    const numParticles = 180;
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      angle: number;
      dist: number;
      speed: number;
      color: string;
    }> = [];

    const colors = ["#1e293b", "#334155", "#475569", "#ef4444", "#06b6d4", "#9333ea"];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.3,
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * (Math.max(width, height) * 0.6),
        speed: (Math.random() * 0.002 + 0.0005) * (Math.random() > 0.5 ? 1 : -1),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const resize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    let angleOffset = 0;

    function render() {
      if (!ctx || !canvas) return;

      // Dark Void Background
      ctx.fillStyle = "#020306";
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Black Hole Accretion Disk (Sinister Lensing Glow)
      angleOffset += 0.003;

      // Outer Crimson Red Gravitational Distortion
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 40, centerX, centerY, 320);
      outerGlow.addColorStop(0, "rgba(0, 0, 0, 1)");
      outerGlow.addColorStop(0.3, "rgba(239, 68, 68, 0.15)");
      outerGlow.addColorStop(0.6, "rgba(147, 51, 234, 0.08)");
      outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 320, 0, Math.PI * 2);
      ctx.fill();

      // Accretion Ring Distortion
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angleOffset);
      ctx.scale(1, 0.35); // Elliptical tilt

      ctx.beginPath();
      ctx.arc(0, 0, 180, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
      ctx.lineWidth = 12;
      ctx.shadowBlur = 25;
      ctx.shadowColor = "#06b6d4";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 150, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
      ctx.lineWidth = 8;
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#ef4444";
      ctx.stroke();

      ctx.restore();

      // Black Hole Void Event Horizon Center
      ctx.beginPath();
      ctx.arc(centerX, centerY, 75, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.shadowBlur = 40;
      ctx.shadowColor = "#000000";
      ctx.fill();

      // Event Horizon Edge Glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, 76, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 2. Cosmic Dust particles gravitational pull towards Black Hole
      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        p.angle += p.speed;

        // Spiral inward movement
        const px = centerX + Math.cos(p.angle) * p.dist;
        const py = centerY + Math.sin(p.angle) * (p.dist * 0.6);

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center bg-[#020306] text-slate-100 overflow-hidden font-mono select-none">
      
      {/* Background Eerie Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none block w-full h-full" />

      {/* Top Telemetry Warning Header */}
      <header className="relative z-10 w-full p-6 flex justify-between items-center text-xs tracking-widest border-b border-red-950/40 bg-black/40 backdrop-blur-md">
        <div className="flex items-center space-x-2 text-rose-500 animate-pulse">
          <Radio className="h-4 w-4" />
          <span>MAYDAY // DISTRESS BEACON ACTIVE</span>
        </div>
        <div className="hidden sm:flex items-center space-x-6 text-slate-400">
          <span>SECTOR: UNKNOWN VOID</span>
          <span className="text-amber-400">O₂ LEVEL: {oxygen.toFixed(3)}%</span>
        </div>
      </header>

      {/* Center Eerie Content */}
      <main className="relative z-10 max-w-2xl px-6 py-12 text-center flex flex-col items-center my-auto">
        
        {/* Stranded Astronaut Silhouette Badge */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 12, -12, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: "easeInOut",
          }}
          className="h-20 w-20 rounded-full border border-rose-500/40 bg-rose-950/20 backdrop-blur-md flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
        >
          <ShieldAlert className="h-10 w-10 text-rose-500 animate-pulse" />
        </motion.div>

        {/* Eerie Glitch 404 */}
        <h1 className="font-display font-black text-7xl md:text-9xl tracking-widest text-slate-100 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)] mb-2 relative">
          <span className="bg-gradient-to-b from-slate-100 via-slate-300 to-rose-950 bg-clip-text text-transparent">
            404
          </span>
        </h1>

        <h2 className="font-display font-extrabold text-lg md:text-2xl tracking-widest text-rose-400/90 uppercase mb-4">
          TERJEBAK DI KEHAMPAAN KOSMIK
        </h2>

        <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans max-w-md mb-8">
          Sangat dingin di sini... Anda telah hanyut terlalu jauh melampaui batas koordinat IMO 2026. Gravitasi lubang hitam di depan perlahan menarik sinyal komunikasi Anda.
        </p>

        {/* Emergency Rescue Action */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Link href="/" className="w-full">
            <button className="w-full py-3.5 px-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-display font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_30px_rgba(239,68,68,0.4)] flex items-center justify-center space-x-2 cursor-pointer">
              <Home className="h-4 w-4" />
              <span>Panggil Bantuan (Ke Beranda)</span>
            </button>
          </Link>
          <Link href="/hub" className="w-full">
            <button className="w-full py-3.5 px-6 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 font-display font-semibold text-xs uppercase tracking-widest transition duration-300 flex items-center justify-center space-x-2 cursor-pointer">
              <Compass className="h-4 w-4" />
              <span>Mission Control</span>
            </button>
          </Link>
        </div>

      </main>

      {/* Bottom Emergency Status Footer */}
      <footer className="relative z-10 w-full p-6 text-center text-[10px] text-slate-600 tracking-widest uppercase border-t border-slate-900/50 bg-black/60">
        EMERGENCY PROTOCOL ACTIVE // GRAVITATIONAL SINGULARITY DISTORTION
      </footer>

    </div>
  );
}
