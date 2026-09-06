"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  ChevronRight,
  KeyRound,
  CheckCircle2,
  Copy,
  LogOut,
  RefreshCw,
  Loader2,
} from "lucide-react";
import StarfieldBackground from "@/components/StarfieldBackground";

function PreviewGatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { config, isDevBypass, setDevBypass } = useSiteConfig();

  const [mounted, setMounted] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeToken, setActiveToken] = useState<string>("");

  const urlToken = searchParams.get("token");

  // Verifikasi token via server API
  const verifyTokenWithApi = async (tokenCandidate: string): Promise<boolean> => {
    setIsVerifying(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/preview/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenCandidate }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem("imo_lockdown_bypass", "1");
        sessionStorage.setItem("imo_dev_token", tokenCandidate);
        sessionStorage.setItem("imo_dev_token_valid", "1");
        setDevBypass(true);
        setActiveToken(tokenCandidate);
        return true;
      } else {
        setAuthError(data.error || "Kode token acak tidak valid.");
        return false;
      }
    } catch (err: any) {
      setAuthError("Gagal menghubungi server otentikasi. Silakan coba lagi.");
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    setMounted(true);

    async function initialAuthCheck() {
      // 1. Cek parameter URL ?token=...
      if (urlToken && urlToken.trim()) {
        const ok = await verifyTokenWithApi(urlToken.trim());
        if (ok) return;
      }

      // 2. Cek session sebelumnya
      const storedToken = sessionStorage.getItem("imo_dev_token");
      const storedValid = sessionStorage.getItem("imo_dev_token_valid");
      if (storedToken && storedValid === "1") {
        setActiveToken(storedToken);
        setDevBypass(true);
      }
    }

    initialAuthCheck();
  }, [urlToken]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setAuthError("Harap masukkan kode token developer.");
      return;
    }
    const ok = await verifyTokenWithApi(tokenInput.trim());
    if (ok) {
      setTokenInput("");
      // Update query param ke URL secara bersih
      router.replace(`/preview?token=${encodeURIComponent(tokenInput.trim())}`);
    }
  };

  const handleDeactivateBypass = () => {
    setDevBypass(false);
    sessionStorage.removeItem("imo_lockdown_bypass");
    sessionStorage.removeItem("imo_dev_token");
    sessionStorage.removeItem("imo_dev_token_valid");
    document.cookie = "imo_lockdown_bypass=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setActiveToken("");
    router.replace("/preview");
  };

  const handleCopyBypassLink = () => {
    const fullUrl = `${window.location.origin}/preview?token=${encodeURIComponent(activeToken || config.devBypassToken || "")}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020510] text-amber-400 font-mono">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          <span className="text-xs tracking-widest uppercase">MEMVERIFIKASI PROTOKOL DEVELOPER...</span>
        </div>
      </div>
    );
  }

  const isAuthenticated = isDevBypass || Boolean(activeToken);

  const testRoutes = [
    { name: "Beranda Utama", path: "/", icon: Home, desc: "Halaman Utama IMO 2026", color: "cyan" },
    { name: "Pusat Penjelajahan", path: "/hub", icon: Layers, desc: "Navigasi Cepat & Modul", color: "purple" },
    { name: "Panduan & Dokumen", path: "/guide", icon: BookOpen, desc: "Buku Panduan & Lampiran", color: "amber" },
    { name: "Status Pengumpulan", path: "/info", icon: FileCheck, desc: "Drive Verifier & Rekapitulasi", color: "emerald" },
    { name: "ID Card Generator", path: "/id-card", icon: CreditCard, desc: "Pembuat Kartu Tanda Pengenal", color: "pink" },
    { name: "Auto-Form Dokumen", path: "/documents", icon: FileText, desc: "Generator Surat & Form PDF", color: "blue" },
    { name: "Kontak", path: "/contact", icon: PhoneCall, desc: "Direktori Orbit Pendamping", color: "teal" },
    { name: "Admin Dashboard", path: "/admin/dashboard", icon: Settings, desc: "Panel Kontrol Administrator", color: "slate" },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // TAMPILAN 1: BELUM TERAUTENTIKASI (MEMBUTUHKAN TOKEN ACAK)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#020510] text-slate-100 px-4 text-center overflow-hidden font-mono select-none">
        <StarfieldBackground />
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative z-10 max-w-lg w-full flex flex-col items-center">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-amber-400 text-xs font-bold tracking-widest uppercase mb-6 shadow-inner">
            <KeyRound className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span>AUTHENTICATION REQUIRED // RESTRICTED GATEWAY</span>
          </div>

          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="h-20 w-20 rounded-2xl bg-black/80 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)] relative">
              <Lock className="h-10 w-10 text-amber-400" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-display font-black tracking-widest text-slate-100 mb-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            DEVELOPER GATEWAY
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed max-w-md">
            Halaman ini dilindungi kode token acak khusus developer untuk membypass penguncian fitur. Masukkan kode token Anda untuk membuka akses.
          </p>

          {/* Form Input Token */}
          <form onSubmit={handleFormSubmit} className="w-full bg-black/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-4 text-left">
            <div>
              <label htmlFor="token-input" className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Kode Token Akses Developer
              </label>
              <div className="relative">
                <input
                  id="token-input"
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Contoh: dev_8f2a1b9c..."
                  disabled={isVerifying}
                  className="w-full px-4 py-3 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  autoFocus
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  <span>MEMVERIFIKASI TOKEN...</span>
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 text-black" />
                  <span>VERIFIKASI & BUKA AKSES</span>
                </>
              )}
            </button>
          </form>

          {/* Catatan Admin */}
          <div className="mt-6 text-slate-500 text-[11px] max-w-md leading-relaxed border-t border-slate-800/60 pt-4">
            💡 <span className="text-slate-400 font-bold">Catatan Administrator:</span> Kode token acak dapat dilihat, diacak ulang, atau disalin langsung melalui panel{" "}
            <Link href="/admin/settings" className="text-cyan-400 hover:underline">
              Admin Settings &gt; Status &amp; Keamanan
            </Link>.
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TAMPILAN 2: SUDAH TERAUTENTIKASI (DEVELOPER COMMAND CENTER // BYPASS AKTIF)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-[#020510] text-slate-100 px-4 py-12 overflow-x-hidden font-mono select-none">
      <StarfieldBackground />

      {/* Futuristic Amber/Cyan glow backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
        
        {/* Header HUD Pill */}
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-black tracking-[0.2em] uppercase mb-6 shadow-[0_0_20px_rgba(16,185,129,0.25)] animate-pulse">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>DEVELOPER ACCESS GRANTED // TOKEN VERIFIED</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-display font-black tracking-wider text-slate-100 text-center mb-3 drop-shadow-[0_0_25px_rgba(245,158,11,0.3)]">
          DEVELOPER TESTING GATEWAY
        </h1>
        <p className="text-slate-400 text-xs md:text-sm text-center max-w-2xl mb-6 leading-relaxed">
          Sesi Anda telah terverifikasi dengan token khusus developer. Seluruh penguncian fitur, halaman isolasi, maupun mode pemeliharaan website <span className="text-emerald-400 font-bold">otomatis dibypass</span> untuk Anda.
        </p>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={handleCopyBypassLink}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold tracking-wider transition shadow-lg"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300">Link Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-cyan-400" />
                <span>Salin Link Developer Ini</span>
              </>
            )}
          </button>

          <button
            onClick={handleDeactivateBypass}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-bold tracking-wider transition shadow-lg"
          >
            <LogOut className="h-4 w-4 text-rose-400" />
            <span>Nonaktifkan Bypass (Keluar)</span>
          </button>
        </div>

        {/* Telemetry Diagnostics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
          <div className="bg-black/60 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>STATUS PUBLIK</span>
              <AlertTriangle className={`h-4 w-4 ${config.maintenanceMode ? "text-rose-500 animate-pulse" : "text-emerald-500"}`} />
            </div>
            <div className={`font-black text-sm tracking-wider uppercase ${config.maintenanceMode ? "text-rose-400" : "text-emerald-400"}`}>
              {config.maintenanceMode ? "LOCKDOWN ACTIVE" : "NORMAL ORBIT (ONLINE)"}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {config.maintenanceMode ? "Pengunjung umum diblokir layar 503" : "Website terbuka normal untuk publik"}
            </div>
          </div>

          <div className="bg-black/60 border border-amber-500/40 rounded-2xl p-4 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>STATUS SESI ANDA</span>
              <Terminal className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-amber-300 font-black text-sm tracking-wider uppercase">
              DEV BYPASS AKTIF
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">
              Token: <span className="text-cyan-300 font-mono font-bold">{activeToken || "VERIFIED"}</span>
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
                <span>PINTU PENGUJIAN RUTE & FITUR WEBSITE</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Pilih halaman di bawah untuk membuka dan menguji fungsi secara langsung tanpa blokade kunci.
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
              const lockedInfo = config.lockedPages?.find(
                (p) => p.isLocked && (p.path.toLowerCase() === route.path.toLowerCase() || route.path.toLowerCase().startsWith(p.path.toLowerCase() + "/"))
              );
              const isRouteLockedForPublic = config.maintenanceMode || !!lockedInfo;

              return (
                <Link
                  key={route.path}
                  href={route.path}
                  className={`group p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between relative overflow-hidden ${
                    isRouteLockedForPublic
                      ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/40"
                      : "bg-slate-900/40 hover:bg-slate-900/80 border-slate-800/80 hover:border-cyan-500/50"
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform ${
                      isRouteLockedForPublic
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                        : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                          {route.name}
                        </span>
                        {isRouteLockedForPublic && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                            BYPASSED
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {route.path}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LockdownPreviewGateway() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#020510] text-amber-400 font-mono">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
            <span className="text-xs tracking-widest uppercase">MEMVERIFIKASI PROTOKOL DEVELOPER...</span>
          </div>
        </div>
      }
    >
      <PreviewGatewayContent />
    </Suspense>
  );
}
