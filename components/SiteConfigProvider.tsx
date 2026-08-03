"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
import { Wrench, Sparkles, X, ChevronRight, AlertTriangle } from "lucide-react";
import StarfieldBackground from "@/components/StarfieldBackground";
import RealisticBlackHole from "@/components/RealisticBlackHole";

export interface SiteConfig {
  // Branding & Identity
  siteName: string;
  siteYear: string;
  siteLogoUrl: string;
  faviconUrl: string;
  metaTitle: string;
  metaDescription: string;
  
  // Theme & Styling
  accentCyan: string;
  accentPurple: string;
  accentYellow: string;
  backgroundColor: string;
  enableStarfield: boolean;
  glassBlurIntensity: string;

  // Web Status & Modes
  maintenanceMode: boolean;
  maintenanceMessage: string;
  taskSubmissionFrozen: boolean;
  taskFreezeMessage: string;

  // Root System Controls
  swCacheVersion: string;
  killServiceWorker: boolean;
  cacheTtl: number;
  apiLockdown: boolean;
  
  // Global Top Banner
  enableGlobalBanner: boolean;
  globalBannerText: string;
  globalBannerStyle: "info" | "warning" | "alert" | "success";
  globalBannerLink: string;

  // Eruda Inspector Console
  enableErudaConsole: boolean;
  analyticsScriptTag: string;

  // Copywriting - Home Page
  homeMissionBadge: string;
  homeTagline: string;
  homeDescription: string;
  homeCtaLabel: string;
  homeCard1Title: string;
  homeCard1Desc: string;
  homeCard2Title: string;
  homeCard2Desc: string;
  homeCard3Title: string;
  homeCard3Desc: string;

  // Copywriting - Info Page
  infoHeroTitle: string;
  infoHeroSubtitle: string;
  infoWarningNotice: string;

  // Copywriting - Hub Page
  hubHeroTitle: string;
  hubHeroSubtitle: string;
  hubSearchPlaceholder: string;

  // Copywriting - Guide Page
  guideHeroTitle: string;
  guideHeroSubtitle: string;

  // Copywriting - Contact Page
  contactHeroTitle: string;
  contactHeroSubtitle: string;

  // Copywriting - ID Card Page
  idCardHeroTitle: string;
  idCardHeroSubtitle: string;

  // Copywriting - Documents Page
  documentsHeroTitle: string;
  documentsHeroSubtitle: string;

  // Home Page Node Graph
  homeNodesOrder: string[];

  // Footer
  footerText: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: "IMO 2026",
  siteYear: "2026",
  siteLogoUrl: "/Brighton.svg",
  faviconUrl: "/favicon.ico",
  metaTitle: "IMO 2026 - Innovative Minds Outclass",
  metaDescription: "Portal Resmi IMO 2026: Different Minds, Different Stories, One Generation Chasing Glories.",
  
  accentCyan: "#7df9ff",
  accentPurple: "#b48cff",
  accentYellow: "#ffd166",
  backgroundColor: "#020510",
  enableStarfield: true,
  glassBlurIntensity: "blur(30px)",

  maintenanceMode: false,
  maintenanceMessage: "Website IMO 2026 sedang dalam pemeliharaan sistem berkala. Mohon kembali beberapa saat lagi.",
  taskSubmissionFrozen: false,
  taskFreezeMessage: "Pengiriman dan verifikasi berkas sedang dibekukan sementara untuk rekapitulasi data.",

  swCacheVersion: "v1.0.0",
  killServiceWorker: false,
  cacheTtl: 3600,
  apiLockdown: false,
  
  enableGlobalBanner: false,
  globalBannerText: "📢 Pengumuman: Jadwal pengkondisian barisan telah diperbarui. Cek menu Panduan!",
  globalBannerStyle: "info",
  globalBannerLink: "/guide",

  enableErudaConsole: true,
  analyticsScriptTag: "",

  homeMissionBadge: "Innovative Minds Outclass",
  homeTagline: '"Different Minds, Different Stories, One Generation Chasing Glories."',
  homeDescription: "Persiapkan diri Anda untuk lepas landas! Ini adalah portal penjelajahan resmi bagi seluruh Mahasiswa Baru. Temukan semua petunjuk arah, jadwal navigasi, dan koordinat LO Anda di sini.",
  homeCtaLabel: "Mulai Penjelajahan",
  homeCard1Title: "Summary Tugas Kelompok",
  homeCard1Desc: "Periksa kelengkapan pengumpulan tugas kelompok Anda yang terverifikasi otomatis dari repositori Google Drive IMO 2026.",
  homeCard2Title: "ID Card Generator",
  homeCard2Desc: "Kustomisasi & unduh tanda pengenal resmi IMO 2026. Diproses instan murni pada perangkat Android/iOS Anda untuk menjaga keamanan data.",
  homeCard3Title: "Hubungi LO",
  homeCard3Desc: "Kehilangan arah dalam perjalanan luar angkasa ini? Hubungi LO/Pendamping kelompok Anda secara langsung melalui satu tombol WhatsApp.",

  infoHeroTitle: "Status Hub & Pengumpulan",
  infoHeroSubtitle: "Verifikasi kelengkapan pengumpulan tugas kelompok dan berkas individu real-time.",
  infoWarningNotice: "Catatan: Jika ingin membuka folder, mohon menunggu loading selesai, Terimakasih.",

  hubHeroTitle: "PUSAT PENJELAJAHAN",
  hubHeroSubtitle: "Portal pusat navigasi cepat untuk mengakses semua panduan, tools generator, saluran media resmi, dan pusat berkas IMO 2026.",
  hubSearchPlaceholder: "Cari tautan modul, generator, atau panduan penjelajahan...",

  guideHeroTitle: "PANDUAN & EMBED DOKUMEN",
  guideHeroSubtitle: "Halaman interaktif pengumuman resmi & contoh surat. Tinjau dokumen bersandingan dengan petunjuk & tombol langsung ke Auto-Form Generator.",

  contactHeroTitle: "LO & PENDAMPING KELOMPOK",
  contactHeroSubtitle: "Temukan pemandu orbit Anda. Cari berdasarkan nama kelompok atau nama LO untuk menghubungi langsung.",

  idCardHeroTitle: "ID CARD GENERATOR",
  idCardHeroSubtitle: "Generator tanda pengenal resmi peserta IMO 2026. Diproses 100% di browser Anda untuk keamanan data penuh.",

  documentsHeroTitle: "AUTO-FORM GENERATOR",
  documentsHeroSubtitle: "Isi formulir online dan buat dokumen PDF resmi instan tanpa mengetik ulang.",

  homeNodesOrder: ["guide", "hub", "info", "idcard", "documents", "contact"],

  footerText: "Made with Astro-Physics & Next.js.",
};

const SiteConfigContext = createContext<{
  config: SiteConfig;
  refreshConfig: () => Promise<void>;
}>({
  config: DEFAULT_SITE_CONFIG,
  refreshConfig: async () => {},
});

export const useSiteConfig = () => useContext(SiteConfigContext);

export default function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [bannerDismissed, setBannerDismissed] = useState(false);
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

  // Check Maintenance Mode
  if (config.maintenanceMode && !isAdminPath) {
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
    <SiteConfigContext.Provider value={{ config, refreshConfig: fetchConfig }}>
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
