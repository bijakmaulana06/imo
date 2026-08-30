"use client";

import React, { useEffect, useState } from "react";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import { Link } from "next-view-transitions";
import {
  ShieldAlert,
  Terminal,
  Compass,
  ArrowRight,
  Sparkles,
  Home,
  BookOpen,
  Layers,
  FileCheck,
  CreditCard,
  FileText,
  PhoneCall,
  Settings,
  Lock,
  Unlock,
  AlertTriangle,
  Radio,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import StarfieldBackground from "@/components/StarfieldBackground";

export default function LockdownPreviewGateway() {
  const { config, isDevBypass, setDevBypass } = useSiteConfig();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // When visiting this page while in lockdown, auto-enable dev bypass
    if (config.maintenanceMode) {
      setDevBypass(true);
    }
  }, [config.maintenanceMode]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020510] text-amber-400 font-mono">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400"></div>
          <span className="text-xs tracking-widest uppercase">MEMVERIFIKASI PROTOKOL SYSTEM...</span>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Lockdown is OFF (Maintenance Mode is FALSE)
  // The bypass URL MUST BE DEAD / DISABLED until lockdown is turned back on.
  // ─────────────────────────────────────────────────────────────────────────────
  if (!config.maintenanceMode) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#020510] text-slate-100 px-4 text-center overflow-hidden font-mono select-none">
        <StarfieldBackground />
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative z-10 max-w-xl flex flex-col items-center">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-400 text-xs font-bold tracking-widest uppercase mb-6 shadow-inner">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            <span>ENDPOINT_OFFLINE // LOCKDOWN INACTIVE</span>
          </div>

          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-slate-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="h-20 w-20 rounded-2xl bg-black/60 border border-slate-800 flex items-center justify-center text-slate-500 shadow-2xl relative">
              <Lock className="h-10 w-10 text-slate-500" />
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-black tracking-widest text-slate-200 mb-4">
            404 PROTOCOL INACTIVE
          </h1>

          <div className="p-5 border-l-4 border-slate-700 bg-black/50 backdrop-blur-md rounded-r-xl max-w-lg w-full text-left text-xs leading-relaxed space-y-3 mb-8 border border-slate-800/80 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <p className="text-slate-400 font-mono">
              &gt; STATUS PROTOKOL: <span className="text-emerald-400 font-bold">NORMAL ORBIT (ONLINE)</span><br />
              &gt; GATEWAY PREVIEW: <span className="text-rose-400 font-bold">DIMATIKAN (DEAD ENDPOINT)</span>
            </p>
            <p className="text-slate-300">
              URL khusus penguji admin ini <span className="text-amber-300 font-bold">otomatis dinonaktifkan</span> karena website utama sedang tidak berada dalam status lockdown.
            </p>
            <p className="text-slate-400 text-[11px]">
              Tautan bypass ini hanya akan aktif dan dapat diakses kembali apabila sistem lockdown (Cinematic Offline) diaktifkan melalui panel Admin Settings.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
            >
              <Home className="h-4 w-4" />
              <span>Kembali ke Beranda</span>
            </Link>

            <Link
              href="/admin/settings"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold tracking-widest uppercase transition"
            >
              <Settings className="h-4 w-4" />
              <span>Admin Settings</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Lockdown is ACTIVE (Maintenance Mode is TRUE)
  // This page provides full development bypass access and visual testing suite!
  // ─────────────────────────────────────────────────────────────────────────────
  const testRoutes = [
    { name: "Beranda Utama", path: "/", icon: Home, desc: "Halaman Utama IMO 2026", color: "cyan" },
    { name: "Pusat Penjelajahan", path: "/hub", icon: Layers, desc: "Navigasi Cepat & Modul", color: "purple" },
    { name: "Panduan & Dokumen", path: "/guide", icon: BookOpen, desc: "Buku Panduan & Lampiran", color: "amber" },
    { name: "Status Pengumpulan", path: "/info", icon: FileCheck, desc: "Drive Verifier & Rekapitulasi", color: "emerald" },
    { name: "ID Card Generator", path: "/id-card", icon: CreditCard, desc: "Pembuat Kartu Tanda Pengenal", color: "pink" },
    { name: "Auto-Form Dokumen", path: "/documents", icon: FileText, desc: "Generator Surat & Form PDF", color: "blue" },
    { name: "Kontak", path: "/contact", icon: PhoneCall, desc: "Direktori Orbit Pendamping", color: "teal" },
  ];

  return (
    <div className="relative min-h-screen bg-[#020510] text-slate-100 px-4 py-12 overflow-x-hidden font-mono select-none">
      <StarfieldBackground />

      {/* Futuristic Amber/Cyan glow backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
        
        {/* Header HUD Pill */}
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black tracking-[0.2em] uppercase mb-6 shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          <span>DEVELOPMENT MODE // LOCKDOWN BYPASS AUTHORIZED</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-display font-black tracking-wider text-slate-100 text-center mb-3 drop-shadow-[0_0_25px_rgba(245,158,11,0.3)]">
          ADMIN TESTING GATEWAY
        </h1>
        <p className="text-slate-400 text-xs md:text-sm text-center max-w-2xl mb-8 leading-relaxed">
          Sistem website saat ini sedang dalam status <span className="text-rose-400 font-bold">LOCKDOWN (Cinematic Offline)</span> untuk publik umum. Halaman ini membypass penguncian tersebut agar admin dapat menguji seluruh fungsi website secara leluasa.
        </p>

        {/* Telemetry Diagnostics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
          <div className="bg-black/60 border border-rose-500/40 rounded-2xl p-4 shadow-[0_0_20px_rgba(244,63,94,0.15)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>STATUS PUBLIK</span>
              <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />
            </div>
            <div className="text-rose-400 font-black text-sm tracking-wider uppercase">
              LOCKDOWN ACTIVE
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Pengunjung umum diblokir layar 503
            </div>
          </div>

          <div className="bg-black/60 border border-amber-500/40 rounded-2xl p-4 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>STATUS SESI ANDA</span>
              <Terminal className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-amber-300 font-black text-sm tracking-wider uppercase">
              DEVELOPMENT MODE ON
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Bypass aktif dengan tanda khusus
            </div>
          </div>

          <div className="bg-black/60 border border-emerald-500/40 rounded-2xl p-4 shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>HAK AKSES FITUR</span>
              <Unlock className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-emerald-300 font-black text-sm tracking-wider uppercase">
              ALL ROUTES UNLOCKED
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Dapat membuka & menguji seluruh rute
            </div>
          </div>
        </div>

        {/* Action Controls & Direct Navigation */}
        <div className="w-full bg-black/70 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-slate-200 tracking-wider flex items-center space-x-2">
                <Compass className="h-4 w-4 text-amber-400" />
                <span>PINTU PENGUJIAN RUTE WEBSITE</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Pilih halaman di bawah untuk membuka dan menguji fungsi secara langsung.
              </p>
            </div>

            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center space-x-2 flex-shrink-0"
            >
              <span>Jelajahi Beranda</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Routes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {testRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <Link
                  key={route.path}
                  href={route.path}
                  className="group p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/50 transition-all duration-300 flex items-center justify-between relative overflow-hidden"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                        {route.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {route.desc}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-slate-600 group-hover:text-amber-400 transition-colors">
                    <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">Buka</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Footer Controls */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Development Mode aktif untuk browser ini selama tab/sesi terbuka.</span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/admin/settings"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition flex items-center space-x-1.5"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Admin Settings</span>
            </Link>

            <button
              onClick={() => {
                setDevBypass(false);
                window.location.href = "/";
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/50 text-rose-300 text-[11px] font-bold transition"
            >
              Kunci Kembali (Exit Dev Mode)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
