"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
import { Wrench, Sparkles, X, ChevronRight, AlertTriangle, Lock, ShieldAlert } from "lucide-react";
import StarfieldBackground from "@/components/StarfieldBackground";
import RealisticBlackHole from "@/components/RealisticBlackHole";

export * from "@/types/site-config";
import {
  HomePhotoSlot,
  LockedPageConfig,
  SiteConfig,
  DEFAULT_LOCKED_PAGES,
  DEFAULT_SITE_CONFIG,
} from "@/types/site-config";

const SiteConfigContext = createContext<{
  config: SiteConfig;
  refreshConfig: () => Promise<void>;
  isDevBypass: boolean;
  setDevBypass: (active: boolean) => void;
}>({
  config: DEFAULT_SITE_CONFIG,
  refreshConfig: async () => {},
  isDevBypass: false,
  setDevBypass: () => {},
});

export const useSiteConfig = () => useContext(SiteConfigContext);

export default function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isDevBypass, setIsDevBypass] = useState<boolean>(false);
  const pathname = usePathname();

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/site-config");
      if (res.ok) {
        const data = await res.json();
        setConfig((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn("Could not fetch dynamic site config:", err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Sync dev bypass state with session storage & url
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasAnyLockdown = config.maintenanceMode || config.lockedPages?.some((p) => p.isLocked);

    if (hasAnyLockdown) {
      const stored = sessionStorage.getItem("imo_lockdown_bypass");
      const urlParams = new URLSearchParams(window.location.search);
      const hasParam = urlParams.get("bypass") === "1" || urlParams.get("dev") === "1";
      const isPreviewRoute = pathname?.startsWith("/preview");

      if (stored === "1" || hasParam || isPreviewRoute) {
        setIsDevBypass(true);
        sessionStorage.setItem("imo_lockdown_bypass", "1");
        document.cookie = "imo_lockdown_bypass=1; path=/; max-age=86400; SameSite=Lax";
      }
    } else {
      // If no lockdown is active anywhere, clean up bypass session
      setIsDevBypass(false);
      sessionStorage.removeItem("imo_lockdown_bypass");
      document.cookie = "imo_lockdown_bypass=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, [config.maintenanceMode, config.lockedPages, pathname]);

  const handleSetDevBypass = (active: boolean) => {
    setIsDevBypass(active);
    if (typeof window !== "undefined") {
      if (active) {
        sessionStorage.setItem("imo_lockdown_bypass", "1");
        document.cookie = "imo_lockdown_bypass=1; path=/; max-age=86400; SameSite=Lax";
      } else {
        sessionStorage.removeItem("imo_lockdown_bypass");
        document.cookie = "imo_lockdown_bypass=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }
  };

  // Inject CSS Variables dynamically into document root
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (config.accentCyan) root.style.setProperty("--accent-cyan", config.accentCyan);
    if (config.accentPurple) root.style.setProperty("--accent-purple", config.accentPurple);
    if (config.accentYellow) root.style.setProperty("--accent-yellow", config.accentYellow);
    if (config.backgroundColor) root.style.setProperty("--background", config.backgroundColor);
    
    if (config.metaTitle) document.title = config.metaTitle;
  }, [config]);

  const isAdminPath = pathname?.startsWith("/admin");
  const isPreviewPath = pathname?.startsWith("/preview");
  const isBypassed = isDevBypass;

  // 1. Check Global Maintenance Mode (Whole Site Lockdown)
  if (config.maintenanceMode && !isAdminPath && !isPreviewPath && !isBypassed) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-black text-slate-100 px-4 text-center overflow-hidden font-mono">
        <StarfieldBackground />
        
        {/* Cinematic Black Hole at the center */}
        <div className="absolute inset-0 flex items-center justify-center opacity-80 pointer-events-none z-0">
          <RealisticBlackHole size={400} />
        </div>

        {/* Ambient Red Glow for Emergency/Offline Vibe */}
        <div className="absolute inset-0 bg-rose-950/20 mix-blend-overlay z-0 pointer-events-none" />

        <div className="relative z-10 max-w-lg mt-32 md:mt-48 flex flex-col items-center">
          <div className="flex items-center space-x-3 mb-6">
            <AlertTriangle className="h-6 w-6 text-rose-500 animate-pulse" />
            <span className="text-rose-500 font-black text-xl tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] glow-text-rose">
              SYSTEM_OFFLINE
            </span>
            <AlertTriangle className="h-6 w-6 text-rose-500 animate-pulse" />
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-black tracking-widest text-slate-100 mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
            LOST IN ORBIT
          </h1>

          <div className="p-6 border-l-4 border-rose-500 bg-rose-950/30 backdrop-blur-md rounded-r-2xl max-w-md w-full shadow-[0_0_30px_rgba(244,63,94,0.15)] text-left">
            <p className="text-rose-200 text-sm leading-relaxed mb-4">
              &gt; ERROR 503: SERVICE UNAVAILABLE<br />
              &gt; ESTABLISHING CONNECTION... FAILED<br />
              <br />
              <span className="text-slate-300">
                {config.maintenanceMessage || DEFAULT_SITE_CONFIG.maintenanceMessage}
              </span>
            </p>
            <div className="flex items-center space-x-2 text-rose-500/70 text-xs">
              <span className="h-2 w-2 bg-rose-500 rounded-full animate-ping" />
              <span>AWAITING SIGNAL FROM EARTH COMMAND</span>
            </div>
          </div>

          <div className="mt-12 text-[10px] text-slate-600 tracking-widest uppercase">
            &copy; {config.siteYear} {config.siteName}. KODE AKAR TERKUNCI.
          </div>
        </div>
      </div>
    );
  }

  // 2. Check Per-Page Lockdown (Granular Sector Quarantine)
  const matchingLockedPage = (!isAdminPath && !isPreviewPath && config.lockedPages)
    ? config.lockedPages.find((page) => {
        if (!page.isLocked || !page.path) return false;
        const target = page.path.trim().toLowerCase();
        const current = (pathname || "").toLowerCase();
        return current === target || current.startsWith(target + "/");
      })
    : null;

  if (matchingLockedPage && !isBypassed) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#020510] text-slate-100 px-4 text-center overflow-hidden font-mono select-none">
        <StarfieldBackground />
        
        {/* Futuristic Sci-fi Grid backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f43f5e10_1px,transparent_1px),linear-gradient(to_bottom,#f43f5e10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Ambient emergency amber/rose lighting */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-950/25 via-amber-950/15 to-[#020510] mix-blend-screen pointer-events-none" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg w-full flex flex-col items-center my-12">
          {/* Header Protocol Badge */}
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <ShieldAlert className="h-4 w-4 text-rose-400 animate-pulse" />
            <span>SECTOR LOCKDOWN // ISOLASI PROTOKOL</span>
          </div>

          {/* Holographic Lock Icon Box */}
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-rose-500/20 rounded-3xl blur-xl animate-pulse pointer-events-none" />
            <div className="h-20 w-20 rounded-2xl bg-black/80 border-2 border-rose-500/60 flex items-center justify-center text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.4)] relative">
              <Lock className="h-9 w-9 text-rose-400" />
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-black tracking-widest text-slate-100 mb-2 drop-shadow-[0_0_25px_rgba(244,63,94,0.5)]">
            SEKTOR TERKUNCI
          </h1>

          <div className="text-xs font-mono text-cyan-400 tracking-wider mb-6 bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-500/30">
            Jalur Orbit: <span className="font-bold">{pathname}</span>
          </div>

          {/* Holographic Terminal Block */}
          <div className="p-5 md:p-6 border-l-4 border-rose-500 bg-black/80 border border-slate-800 backdrop-blur-xl rounded-r-2xl max-w-md w-full shadow-[0_0_35px_rgba(244,63,94,0.2)] text-left mb-8">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-500/20 text-[10px] text-rose-400 font-bold uppercase tracking-wider">
              <span>STATUS: ACCESS_RESTRICTED (423_LOCKED)</span>
              {matchingLockedPage.reason && (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-200">
                  {matchingLockedPage.reason}
                </span>
              )}
            </div>

            <div className="text-rose-200/90 text-xs leading-relaxed space-y-2 mb-4 font-mono">
              <div className="text-slate-400 text-[11px]">&gt; TARGET_SECTOR: {matchingLockedPage.title.toUpperCase()}</div>
              <div className="text-slate-200 text-xs mt-2 bg-rose-950/30 p-3 rounded-lg border border-rose-900/40 leading-relaxed">
                {matchingLockedPage.message || "Akses ke sektor ini ditutup sementara waktu oleh Earth Command untuk pemeliharaan data atau penyesuaian teknis."}
              </div>
            </div>

            <div className="flex items-center space-x-2 text-rose-400/80 text-[10px] pt-2 border-t border-slate-800">
              <span className="h-2 w-2 bg-rose-500 rounded-full animate-ping" />
              <span>ISOLASI OTOMATIS BERLAKU HINGGA PEMBERITAHUAN BERIKUTNYA</span>
            </div>
          </div>

          {/* Quick Escape Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Kembali ke Beranda</span>
            </Link>

            <Link
              href="/hub"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold tracking-widest uppercase transition"
            >
              <span>Pusat Navigasi Hub</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-12 text-[10px] text-slate-600 tracking-widest uppercase">
            &copy; {config.siteYear} {config.siteName}. SEKTOR DIISOLASI PUSAT KENDALI.
          </div>
        </div>
      </div>
    );
  }

  const getBannerColor = (style: string) => {
    switch (style) {
      case "warning":
        return "bg-amber-500/20 border-amber-500/50 text-amber-200";
      case "alert":
        return "bg-rose-500/20 border-rose-500/50 text-rose-200";
      case "success":
        return "bg-emerald-500/20 border-emerald-500/50 text-emerald-200";
      default:
        return "bg-accent-cyan/15 border-accent-cyan/40 text-accent-cyan";
    }
  };

  return (
    <SiteConfigContext.Provider value={{ config, refreshConfig: fetchConfig, isDevBypass, setDevBypass: handleSetDevBypass }}>
      {/* Floating DEVELOPMENT MODE Indicator HUD Bar during Lockdown Bypass */}
      {((config.maintenanceMode && isBypassed) || (matchingLockedPage && isBypassed)) && !isAdminPath && (
        <div className="sticky top-0 left-0 right-0 z-[200] bg-black/90 border-b border-amber-500/60 shadow-[0_4px_30px_rgba(245,158,11,0.35)] backdrop-blur-xl px-4 py-2 flex items-center justify-between font-mono text-xs text-amber-200 transition-all select-none">
          <div className="flex items-center space-x-3 max-w-4xl truncate">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="bg-amber-500/20 border border-amber-400/50 px-2 py-0.5 rounded text-[11px] font-black tracking-widest text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              DEVELOPMENT MODE
            </span>
            <span className="hidden sm:inline text-slate-400 text-[11px] truncate">
              {config.maintenanceMode
                ? "[GLOBAL LOCKDOWN BYPASS ACTIVE — ADMIN TESTING PROTOCOL]"
                : `[SECTOR LOCKDOWN BYPASS ACTIVE — "${matchingLockedPage?.title}" DIKUNCI UNTUK PUBLIK]`}
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link
              href="/preview"
              className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold tracking-wider transition"
            >
              Control Portal
            </Link>
            <button
              onClick={() => handleSetDevBypass(false)}
              className="px-2.5 py-1 rounded-md bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-[10px] font-bold tracking-wider transition hover:shadow-[0_0_10px_rgba(244,63,94,0.3)]"
              title="Kunci kembali website ke status lockdown"
            >
              Exit Dev Mode
            </button>
          </div>
        </div>
      )}

      {/* Global Top Announcement Alert Banner */}
      {config.enableGlobalBanner && !bannerDismissed && (
        <div className={`w-full py-2.5 px-4 border-b text-xs font-mono font-bold flex items-center justify-between relative z-[150] transition-all backdrop-blur-md ${getBannerColor(config.globalBannerStyle)}`}>
          <div className="flex items-center space-x-2 max-w-5xl mx-auto truncate">
            <Sparkles className="h-4 w-4 flex-shrink-0 animate-pulse" />
            <span className="truncate">{config.globalBannerText}</span>
            {config.globalBannerLink && (
              <Link href={config.globalBannerLink} className="underline hover:opacity-80 flex items-center space-x-0.5 ml-2 flex-shrink-0">
                <span>Lihat Selengkapnya</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          <button
            onClick={() => setBannerDismissed(true)}
            className="p-1 rounded-lg hover:bg-black/20 text-slate-300 hover:text-white transition"
            title="Tutup Banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {children}
    </SiteConfigContext.Provider>
  );
}
