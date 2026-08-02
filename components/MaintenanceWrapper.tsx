"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { ShieldAlert, Radio, Wrench } from "lucide-react";

export default function MaintenanceWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  const [isMaintenance, setIsMaintenance] = useState(false);
  const [message, setMessage] = useState("Sistem sedang dalam pemeliharaan. Silakan coba kembali dalam beberapa saat.");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [oxygen, setOxygen] = useState(100.0);

  // 1. Fetch Maintenance Status
  useEffect(() => {
    if (isAdmin) return;

    const checkMaintenance = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "feature_flags")
          .maybeSingle();

        if (data?.value) {
          const flags = JSON.parse(data.value);
          if (flags.maintenanceMode) {
            setIsMaintenance(true);
            if (flags.maintenanceMessage) setMessage(flags.maintenanceMessage);
          }
        }
      } catch (err) {
        console.warn("Maintenance check failed:", err);
      }
    };

    checkMaintenance();

    // Listen for live toggle from another tab (or after saving)
    const handleThemeLoaded = (e: CustomEvent) => {
      if (e.detail?.maintenanceMode !== undefined) {
        setIsMaintenance(e.detail.maintenanceMode);
        if (e.detail.maintenanceMessage) setMessage(e.detail.maintenanceMessage);
      }
    };
    window.addEventListener("imo-theme-loaded", handleThemeLoaded as EventListener);
    
    return () => {
      window.removeEventListener("imo-theme-loaded", handleThemeLoaded as EventListener);
    };
  }, [isAdmin]);

  // 2. Oxygen depletion simulation (only active during maintenance)
  useEffect(() => {
    if (!isMaintenance) return;
    const timer = setInterval(() => {
      setOxygen((prev) => (prev > 0.5 ? prev - 0.05 : 0.404));
    }, 1000);
    return () => clearInterval(timer);
  }, [isMaintenance]);

  // 3. Eerie Black Hole Canvas Animation
  useEffect(() => {
    if (!isMaintenance) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const numParticles = 180;
    const particles: Array<{
      x: number; y: number; radius: number; angle: number; dist: number; speed: number; color: string;
    }> = [];
    const colors = ["#1e293b", "#334155", "#475569", "#ef4444", "#eab308", "#f97316"];

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

      angleOffset += 0.003;

      // Warning Orange/Red Gravitational Distortion (Maintenance theme)
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 40, centerX, centerY, 320);
      outerGlow.addColorStop(0, "rgba(0, 0, 0, 1)");
      outerGlow.addColorStop(0.3, "rgba(234, 179, 8, 0.15)"); // Yellow/Amber
      outerGlow.addColorStop(0.6, "rgba(239, 68, 68, 0.08)"); // Red
      outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 320, 0, Math.PI * 2);
      ctx.fill();

      // Accretion Ring
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angleOffset);
      ctx.scale(1, 0.35);

      ctx.beginPath();
      ctx.arc(0, 0, 180, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
      ctx.lineWidth = 12;
      ctx.shadowBlur = 25;
      ctx.shadowColor = "#eab308";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 150, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
      ctx.lineWidth = 8;
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#ef4444";
      ctx.stroke();

      ctx.restore();

      // Event Horizon
      ctx.beginPath();
      ctx.arc(centerX, centerY, 75, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.shadowBlur = 40;
      ctx.shadowColor = "#000000";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 76, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cosmic Dust
      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        p.angle += p.speed;
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
  }, [isMaintenance]);

  if (isAdmin || !isMaintenance) {
    return <>{children}</>;
  }

  // ─────────────────────────────────────────────────────────────────
  // MAINTENANCE SCREEN UI
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[99999] bg-[#020306] text-slate-100 flex flex-col justify-between items-center overflow-hidden font-mono select-none">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none block w-full h-full" />

      <header className="relative z-10 w-full p-6 flex justify-between items-center text-xs tracking-widest border-b border-amber-900/40 bg-black/40 backdrop-blur-md">
        <div className="flex items-center space-x-2 text-amber-500 animate-pulse">
          <Radio className="h-4 w-4" />
          <span>SYSTEM OFFLINE // MAINTENANCE IN PROGRESS</span>
        </div>
        <div className="hidden sm:flex items-center space-x-6 text-slate-400">
          <span>PORTAL: IMO 2026</span>
          <span className="text-amber-400">SYS_O₂: {oxygen.toFixed(3)}%</span>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl px-6 py-12 text-center flex flex-col items-center my-auto">
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 8, -8, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="h-24 w-24 rounded-full border border-amber-500/40 bg-amber-950/20 backdrop-blur-md flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(245,158,11,0.2)]"
        >
          <Wrench className="h-12 w-12 text-amber-500 animate-pulse" />
        </motion.div>

        <h1 className="font-display font-black text-5xl md:text-7xl tracking-widest text-slate-100 drop-shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-4 relative">
          <span className="bg-gradient-to-b from-slate-100 via-amber-200 to-amber-900 bg-clip-text text-transparent">
            SYSTEM MAINTENANCE
          </span>
        </h1>

        <h2 className="font-display font-extrabold text-lg md:text-xl tracking-widest text-amber-400/90 uppercase mb-6">
          ENGINEERING PROTOCOL OVERRIDE
        </h2>

        <p className="text-sm md:text-base text-slate-400 leading-relaxed font-sans max-w-md mx-auto mb-10">
          {message}
        </p>

        <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-full border border-amber-500/30 bg-amber-950/40 text-amber-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <ShieldAlert className="h-4 w-4" />
          <span>Mohon Tunggu & Reload Halaman Nanti</span>
        </div>
      </main>

      <footer className="relative z-10 w-full p-6 text-center text-[10px] text-slate-600 tracking-widest uppercase border-t border-slate-900/50 bg-black/60">
        CORE ENGINEERING TEAM // INNOVATIVE MINDS OUTCLASS 2026
      </footer>
    </div>
  );
}
