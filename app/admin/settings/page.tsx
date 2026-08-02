"use client";

import React, { useState, useEffect, useCallback } from "react";
import StarfieldBackground from "@/components/StarfieldBackground";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import {
  Settings, Palette, FileText, Cpu, ToggleLeft, ToggleRight,
  Save, RefreshCw, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight,
  Globe, Layers, Image, Type, Layout, Sliders, Shield, Wrench,
  Bell, Star, Eye, EyeOff, LogOut, HardDrive, Zap
} from "lucide-react";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BrandConfig {
  logoUrl: string;
  siteName: string;
  siteYear: string;
  taglineMotto: string;
  accentCyan: string;
  accentPurple: string;
  accentYellow: string;
  bgColor: string;
}

interface PageContent {
  // Home
  homeBadge: string;
  homeHeroPrefix: string;
  homeTagline: string;
  homeDescription: string;
  homeCtaLabel: string;
  homeCard1Title: string; homeCard1Desc: string;
  homeCard2Title: string; homeCard2Desc: string;
  homeCard3Title: string; homeCard3Desc: string;
  // Info
  infoHeroTitle: string;
  infoSubtitle: string;
  infoBanner: string;
  // Hub
  hubBadge: string;
  hubTitle: string;
  hubDescription: string;
  // Guide
  guideBadge: string;
  guideTitle: string;
  guideDescription: string;
  // Contact
  contactTitle: string;
  contactDescription: string;
  // Footer
  footerCopyright: string;
  footerTagline: string;
}

interface FeatureFlags {
  enablePushNotif: boolean;
  enableIdCard: boolean;
  enableDocuments: boolean;
  enableGuide: boolean;
  enableContact: boolean;
  enableStarfield: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

interface TechConfig {
  gdriveParentFolder: string;
  totalGroups: number;
  membersPerGroup: number;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

type TabId = "brand" | "content" | "features" | "technical";

// ─────────────────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_BRAND: BrandConfig = {
  logoUrl: "",
  siteName: "IMO 2026",
  siteYear: "2026",
  taglineMotto: "Different Minds, Different Stories, One Generation Chasing Glories.",
  accentCyan: "#7df9ff",
  accentPurple: "#b48cff",
  accentYellow: "#ffd166",
  bgColor: "#020510",
};

const DEFAULT_CONTENT: PageContent = {
  homeBadge: "Innovative Minds Outclass",
  homeHeroPrefix: "SELAMAT DATANG DI",
  homeTagline: '"Different Minds, Different Stories, One Generation Chasing Glories."',
  homeDescription: "Persiapkan diri Anda untuk lepas landas! Ini adalah portal penjelajahan resmi bagi seluruh Mahasiswa Baru. Temukan semua petunjuk arah, jadwal navigasi, dan koordinat LO Anda di sini.",
  homeCtaLabel: "Mulai Penjelajahan",
  homeCard1Title: "Summary Tugas Kelompok",
  homeCard1Desc: "Periksa kelengkapan pengumpulan tugas kelompok Anda yang terverifikasi otomatis dari repositori Google Drive IMO 2026.",
  homeCard2Title: "ID Card Generator",
  homeCard2Desc: "Kustomisasi & unduh tanda pengenal resmi IMO 2026. Diproses instan murni pada perangkat Anda.",
  homeCard3Title: "Hubungi LO",
  homeCard3Desc: "Kehilangan arah? Hubungi LO/Pendamping kelompok Anda secara langsung melalui satu tombol WhatsApp.",
  infoHeroTitle: "Status Hub & Pengumpulan",
  infoSubtitle: "Verifikasi kelengkapan pengumpulan tugas kelompok dan berkas individu real-time.",
  infoBanner: "Catatan: Jika ingin membuka folder, mohon menunggu loading selesai, Terimakasih.",
  hubBadge: "Pusat Penjelajahan IMO 2026",
  hubTitle: "PUSAT PENJELAJAHAN",
  hubDescription: "Portal pusat navigasi cepat untuk mengakses semua panduan, tools generator, saluran media resmi, dan pusat berkas IMO 2026.",
  guideBadge: "Interactive Document & Note Center",
  guideTitle: "PANDUAN & EMBED DOKUMEN",
  guideDescription: "Halaman interaktif pengumuman resmi & contoh surat. Tinjau dokumen bersandingan dengan petunjuk & tombol langsung ke Auto-Form Generator.",
  contactTitle: "LO & PENDAMPING KELOMPOK",
  contactDescription: "Temukan pemandu orbit Anda. Cari berdasarkan nama kelompok atau nama LO untuk menghubungi langsung.",
  footerCopyright: "IMO 2026. Made with Astro-Physics & Next.js.",
  footerTagline: "",
};

const DEFAULT_FEATURES: FeatureFlags = {
  enablePushNotif: true,
  enableIdCard: true,
  enableDocuments: true,
  enableGuide: true,
  enableContact: true,
  enableStarfield: true,
  maintenanceMode: false,
  maintenanceMessage: "Sistem sedang dalam pemeliharaan. Silakan coba kembali dalam beberapa saat.",
};

const DEFAULT_TECH: TechConfig = {
  gdriveParentFolder: "",
  totalGroups: 20,
  membersPerGroup: 10,
  seoTitle: "IMO 2026 - Innovative Minds Outclass",
  seoDescription: "Portal Resmi IMO 2026: Different Minds, Different Stories, One Generation Chasing Glories.",
  seoKeywords: "IMO 2026, mahasiswa baru, orientasi, innovative minds outclass",
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-4 border-b border-white/5 last:border-0">
      <div className="sm:w-64 flex-shrink-0">
        <p className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">{label}</p>
        {hint && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div className="flex-grow">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, mono = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0a1020] border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-accent-cyan/60 focus:shadow-[0_0_0_3px_rgba(125,249,255,0.08)] transition ${mono ? "font-mono text-xs" : ""}`} />
  );
}

function TextArea({ value, onChange, rows = 2, placeholder }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a1020] border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-accent-cyan/60 focus:shadow-[0_0_0_3px_rgba(125,249,255,0.08)] transition resize-y" />
  );
}

function ColorSwatch({ label, value, onChange, preview }: {
  label: string; value: string; onChange: (v: string) => void; preview?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0a1020] border border-white/10">
      <label className="relative cursor-pointer flex-shrink-0">
        <div className="h-9 w-9 rounded-lg border-2 border-white/20 shadow-lg transition-transform hover:scale-110"
          style={{ backgroundColor: value }} />
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
      </label>
      <div className="flex-grow min-w-0">
        <p className="text-xs font-mono font-bold text-slate-300">{label}</p>
        <p className="text-[10px] font-mono text-slate-500 mt-0.5">{value}</p>
      </div>
      {preview && (
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
          style={{ color: value, border: `1px solid ${value}22`, backgroundColor: `${value}15` }}>
          {preview}
        </span>
      )}
    </div>
  );
}

function FeatureToggle({ label, desc, on, onToggle, warning }: {
  label: string; desc: string; on: boolean; onToggle: () => void; warning?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition ${on ? "bg-slate-950/80 border-white/8" : "bg-rose-950/20 border-rose-500/15"
      } ${warning && !on ? "border-rose-500/30" : ""}`}>
      <div className="flex-grow">
        <p className={`text-sm font-bold ${on ? "text-slate-100" : "text-slate-400 line-through"}`}>{label}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
        {warning && !on && (
          <p className="text-[10px] text-rose-400 mt-1 font-mono">⚠ Halaman ini akan tampil sebagai 404 saat dinonaktifkan</p>
        )}
      </div>
      <button onClick={onToggle} className={`flex-shrink-0 w-12 h-6 rounded-full transition-all duration-300 relative cursor-pointer ${on ? "bg-accent-cyan shadow-[0_0_10px_rgba(125,249,255,0.4)]" : "bg-slate-700"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${on ? "left-6" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function AccordionSection({ title, icon: Icon, children, defaultOpen = false }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/8 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-slate-950/60 hover:bg-slate-900/60 transition cursor-pointer">
        <div className="flex items-center space-x-3">
          <span className="p-1.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
            <Icon className="h-4 w-4 text-accent-cyan" />
          </span>
          <span className="text-sm font-bold text-slate-100 font-mono">{title}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 bg-slate-950/40 border-t border-white/5">
          {children}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabId>("brand");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND);
  const [content, setContent] = useState<PageContent>(DEFAULT_CONTENT);
  const [features, setFeatures] = useState<FeatureFlags>(DEFAULT_FEATURES);
  const [tech, setTech] = useState<TechConfig>(DEFAULT_TECH);
  const [syncing, setSyncing] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("system_settings").select("key, value");
      if (!data) return;
      const map: Record<string, string> = {};
      data.forEach((r: any) => { map[r.key] = r.value; });

      if (map.brand_config) {
        try { setBrand({ ...DEFAULT_BRAND, ...JSON.parse(map.brand_config) }); } catch { }
      }
      if (map.page_content) {
        try { setContent({ ...DEFAULT_CONTENT, ...JSON.parse(map.page_content) }); } catch { }
      }
      if (map.feature_flags) {
        try { setFeatures({ ...DEFAULT_FEATURES, ...JSON.parse(map.feature_flags) }); } catch { }
      }
      if (map.tech_config) {
        try { setTech({ ...DEFAULT_TECH, ...JSON.parse(map.tech_config) }); } catch { }
      } else {
        // Migrate from older keys
        if (map.gdrive_parent_folder) setTech(t => ({ ...t, gdriveParentFolder: map.gdrive_parent_folder }));
        if (map.total_groups_count) setTech(t => ({ ...t, totalGroups: Number(map.total_groups_count) }));
        if (map.target_members_per_group) setTech(t => ({ ...t, membersPerGroup: Number(map.target_members_per_group) }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const rows = [
        { key: "brand_config", value: JSON.stringify(brand), description: "Brand identity & tema visual web", updated_at: new Date().toISOString() },
        { key: "page_content", value: JSON.stringify(content), description: "Konten teks semua halaman web (CMS)", updated_at: new Date().toISOString() },
        { key: "feature_flags", value: JSON.stringify(features), description: "Toggle on/off fitur & modul web", updated_at: new Date().toISOString() },
        { key: "tech_config", value: JSON.stringify(tech), description: "Konfigurasi teknis: Drive, SEO, dsb.", updated_at: new Date().toISOString() },
        // Keep old keys in sync for backward compat
        { key: "gdrive_parent_folder", value: tech.gdriveParentFolder, description: "Google Drive parent folder ID", updated_at: new Date().toISOString() },
        { key: "total_groups_count", value: String(tech.totalGroups), description: "Total kelompok", updated_at: new Date().toISOString() },
        { key: "target_members_per_group", value: String(tech.membersPerGroup), description: "Anggota per kelompok", updated_at: new Date().toISOString() },
        // Sync ui_customizations for /info page backward compat
        { key: "ui_customizations", value: JSON.stringify({ heroTitle: content.infoHeroTitle, heroSubtitle: content.infoSubtitle, announcementBanner: content.infoBanner }), description: "UI kustomisasi", updated_at: new Date().toISOString() },
        // Sync home_customizations for /page.tsx backward compat
        { key: "home_customizations", value: JSON.stringify({ siteName: brand.siteName, siteYear: brand.siteYear, missionBadge: content.homeBadge, tagline: content.homeTagline, description: content.homeDescription, ctaLabel: content.homeCtaLabel, footerText: content.footerCopyright, homeCard1Title: content.homeCard1Title, homeCard1Desc: content.homeCard1Desc, homeCard2Title: content.homeCard2Title, homeCard2Desc: content.homeCard2Desc, homeCard3Title: content.homeCard3Title, homeCard3Desc: content.homeCard3Desc }), description: "Home customizations", updated_at: new Date().toISOString() },
      ];

      const { error } = await supabase.from("system_settings").upsert(rows, { onConflict: "key" });
      if (error) throw new Error(error.message);

      setSaveMsg({ type: "ok", text: "✅ Semua pengaturan berhasil disimpan & diterapkan ke web!" });

      // Apply theme immediately in this tab
      const root = document.documentElement;
      root.style.setProperty("--accent-cyan", brand.accentCyan);
      root.style.setProperty("--accent-purple", brand.accentPurple);
      root.style.setProperty("--accent-yellow", brand.accentYellow);
      root.style.setProperty("--background", brand.bgColor);

    } catch (err: any) {
      setSaveMsg({ type: "err", text: "❌ Gagal: " + err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 5000);
    }
  };

  // ── Sync Drive ───────────────────────────────────────────────────────────

  const handleSyncDrive = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/drive-sync-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalGroups: tech.totalGroups }),
      });
      const d = await res.json();
      setSaveMsg({ type: res.ok ? "ok" : "err", text: res.ok ? ("✅ " + (d.message || "Sync berhasil!")) : ("❌ " + (d.error || "Gagal")) });
    } catch (e: any) {
      setSaveMsg({ type: "err", text: "❌ " + e.message });
    }
    setSyncing(false);
    setTimeout(() => setSaveMsg(null), 5000);
  };

  // ── Tab definitions ──────────────────────────────────────────────────────

  const tabs: { id: TabId; label: string; icon: any; badge?: string }[] = [
    { id: "brand", label: "Brand & Tema", icon: Palette },
    { id: "content", label: "Konten Halaman", icon: FileText },
    { id: "features", label: "Fitur & Modul", icon: Zap },
    { id: "technical", label: "Teknis & SEO", icon: Cpu },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-[#020510] text-slate-100 font-sans overflow-hidden">
      <StarfieldBackground />

      {/* Top Admin Bar */}
      <header className="sticky top-0 z-50 w-full glass border-b border-white/10 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
                <Settings className="h-4 w-4 text-accent-cyan" />
              </div>
              <div>
                <p className="text-xs font-mono font-extrabold text-accent-cyan tracking-wider uppercase">Site Settings</p>
                <p className="text-[10px] text-slate-500 font-mono">Konfigurasi teknis web IMO 2026</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <AnimatePresence>
              {saveMsg && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold flex items-center space-x-1.5 ${saveMsg.type === "ok" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                    }`}>
                  <span>{saveMsg.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={handleSave} disabled={saving || loading}
              className="px-5 py-2 rounded-xl bg-accent-cyan text-black font-mono font-extrabold text-xs hover:bg-cyan-300 transition shadow-[0_0_15px_rgba(125,249,255,0.3)] flex items-center space-x-2 cursor-pointer disabled:opacity-60">
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>{saving ? "Menyimpan..." : "Simpan & Terapkan"}</span>
            </button>

            <button onClick={() => router.push("/admin/dashboard")}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-slate-200 text-xs font-mono transition cursor-pointer">
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-8 relative z-10">
        {/* Tab Navigation - Sidebar style */}
        <div className="flex gap-6">

          {/* Left sidebar nav */}
          <aside className="w-52 flex-shrink-0">
            <nav className="space-y-1 sticky top-24">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer text-left ${active
                        ? "bg-accent-cyan text-black shadow-[0_0_15px_rgba(125,249,255,0.25)]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                      }`}>
                    <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-black" : "text-slate-500"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              <div className="pt-4 border-t border-white/8 mt-4">
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider px-3 mb-2">Akses Cepat</p>
                <button onClick={() => router.push("/admin/dashboard")}
                  className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 transition cursor-pointer text-left">
                  <Layers className="h-4 w-4" /><span>Dashboard</span>
                </button>
                <a href="/" target="_blank" rel="noreferrer"
                  className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 transition cursor-pointer text-left">
                  <Eye className="h-4 w-4" /><span>Lihat Web</span>
                </a>
              </div>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-grow min-w-0">
            {loading ? (
              <div className="rounded-3xl border border-white/8 bg-slate-950/60 p-16 text-center">
                <RefreshCw className="h-8 w-8 text-accent-cyan mx-auto mb-3 animate-spin" />
                <p className="text-slate-400 text-sm font-mono">Memuat konfigurasi web...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

                  {/* ══════════════════════════════════════════════════════
                      TAB 1: BRAND & TEMA
                  ══════════════════════════════════════════════════════ */}
                  {activeTab === "brand" && (
                    <div className="space-y-5">
                      {/* Identity card */}
                      <section className="rounded-2xl border border-white/8 bg-slate-950/60 overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/8 bg-slate-900/40">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-accent-cyan" />
                            <h2 className="text-sm font-bold text-slate-100">Identitas Web</h2>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Nama, tahun, logo, dan motto utama yang muncul di seluruh web.</p>
                        </div>
                        <div className="px-5">
                          <SettingRow label="URL Logo Kustom" hint={`Kosongkan = gunakan logo SVG default (/Brighton.svg). Isi URL gambar untuk mengganti logo di semua halaman.`}>
                            <div className="space-y-2">
                              <TextInput value={brand.logoUrl} onChange={v => setBrand({ ...brand, logoUrl: v })} placeholder="https://..." mono />
                              {brand.logoUrl && (
                                <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-white/10">
                                  <img src={brand.logoUrl} alt="Logo Preview" className="h-8 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                                  <span className="text-[10px] text-slate-400 font-mono">Preview logo</span>
                                </div>
                              )}
                              <p className="text-[10px] text-slate-600 font-mono">Path lokal: /public/Brighton.svg (ganti file tersebut untuk mengganti logo default)</p>
                            </div>
                          </SettingRow>
                          <SettingRow label="Nama Event / Site" hint="Muncul di browser tab, footer, dan meta SEO">
                            <TextInput value={brand.siteName} onChange={v => setBrand({ ...brand, siteName: v })} placeholder="IMO 2026" />
                          </SettingRow>
                          <SettingRow label="Tahun Event" hint="Ditampilkan besar di samping logo pada halaman utama">
                            <TextInput value={brand.siteYear} onChange={v => setBrand({ ...brand, siteYear: v })} placeholder="2026" />
                          </SettingRow>
                          <SettingRow label="Tagline / Motto Utama" hint="Kutipan brand yang muncul di hero halaman utama (dalam tanda kutip italic)">
                            <TextArea value={brand.taglineMotto} onChange={v => setBrand({ ...brand, taglineMotto: v })} />
                          </SettingRow>
                        </div>
                      </section>

                      {/* Color palette */}
                      <section className="rounded-2xl border border-white/8 bg-slate-950/60 overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/8 bg-slate-900/40">
                          <div className="flex items-center space-x-2">
                            <Palette className="h-4 w-4 text-accent-purple" />
                            <h2 className="text-sm font-bold text-slate-100">Palet Warna Tema</h2>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Warna-warna ini disuntikkan sebagai CSS custom property (<code className="text-accent-cyan">--accent-cyan</code>, dll.) ke seluruh web secara real-time.</p>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <ColorSwatch label="--accent-cyan (Warna Utama)" value={brand.accentCyan} onChange={v => setBrand({ ...brand, accentCyan: v })} preview="Cyan" />
                          <ColorSwatch label="--accent-purple (Warna Sekunder)" value={brand.accentPurple} onChange={v => setBrand({ ...brand, accentPurple: v })} preview="Purple" />
                          <ColorSwatch label="--accent-yellow (Warna Aksen)" value={brand.accentYellow} onChange={v => setBrand({ ...brand, accentYellow: v })} preview="Yellow" />
                          <ColorSwatch label="--background (Warna Latar)" value={brand.bgColor} onChange={v => setBrand({ ...brand, bgColor: v })} preview="BG" />
                        </div>

                        {/* Live preview bar */}
                        <div className="px-5 pb-5">
                          <p className="text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-wide">Preview Warna:</p>
                          <div className="flex items-center gap-2 p-3 rounded-xl border border-white/8"
                            style={{ backgroundColor: brand.bgColor }}>
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: brand.accentCyan, boxShadow: `0 0 8px ${brand.accentCyan}` }} />
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: brand.accentPurple, boxShadow: `0 0 8px ${brand.accentPurple}` }} />
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: brand.accentYellow, boxShadow: `0 0 8px ${brand.accentYellow}` }} />
                            <span className="text-xs font-mono ml-2" style={{ color: brand.accentCyan }}>Pratinjau tema langsung</span>
                            <span className="ml-auto text-[10px] font-mono text-slate-600">BG: {brand.bgColor}</span>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {/* ══════════════════════════════════════════════════════
                      TAB 2: KONTEN HALAMAN (CMS)
                  ══════════════════════════════════════════════════════ */}
                  {activeTab === "content" && (
                    <div className="space-y-3">
                      <div className="px-1 mb-4">
                        <p className="text-xs text-slate-400 font-mono">Edit teks yang ditampilkan di setiap halaman. Perubahan akan langsung tercermin setelah disimpan.</p>
                      </div>

                      <AccordionSection title="/ — Halaman Utama (Home)" icon={Layout} defaultOpen>
                        <div className="space-y-0">
                          <SettingRow label="Badge Atas" hint='Teks kecil bertanda di atas judul. Misal: "Innovative Minds Outclass"'>
                            <TextInput value={content.homeBadge} onChange={v => setContent({ ...content, homeBadge: v })} />
                          </SettingRow>
                          <SettingRow label="Teks Awalan Hero" hint='Muncul di atas logo, misal: "SELAMAT DATANG DI"'>
                            <TextInput value={content.homeHeroPrefix} onChange={v => setContent({ ...content, homeHeroPrefix: v })} />
                          </SettingRow>
                          <SettingRow label="Tagline Kutipan (italic)">
                            <TextArea value={content.homeTagline} onChange={v => setContent({ ...content, homeTagline: v })} />
                          </SettingRow>
                          <SettingRow label="Deskripsi Portal (paragraf)">
                            <TextArea value={content.homeDescription} onChange={v => setContent({ ...content, homeDescription: v })} rows={3} />
                          </SettingRow>
                          <SettingRow label="Label Tombol CTA">
                            <TextInput value={content.homeCtaLabel} onChange={v => setContent({ ...content, homeCtaLabel: v })} placeholder="Mulai Penjelajahan" />
                          </SettingRow>
                          <div className="pt-3 border-t border-white/5 mt-3">
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wide mb-3">3 Kartu Fitur</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {([
                                { t: "homeCard1Title" as const, d: "homeCard1Desc" as const, label: "Kartu 1 (Tugas)" },
                                { t: "homeCard2Title" as const, d: "homeCard2Desc" as const, label: "Kartu 2 (ID Card)" },
                                { t: "homeCard3Title" as const, d: "homeCard3Desc" as const, label: "Kartu 3 (Kontak)" },
                              ]).map(c => (
                                <div key={c.label} className="space-y-2 p-3 rounded-xl bg-[#0a1020] border border-white/8">
                                  <p className="text-[10px] font-mono text-accent-cyan uppercase">{c.label}</p>
                                  <TextInput value={content[c.t]} onChange={v => setContent({ ...content, [c.t]: v })} placeholder="Judul..." />
                                  <TextArea value={content[c.d]} onChange={v => setContent({ ...content, [c.d]: v })} rows={3} placeholder="Deskripsi..." />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </AccordionSection>

                      <AccordionSection title="/info — Halaman Penugasan" icon={Star}>
                        <SettingRow label="Judul Hero"><TextInput value={content.infoHeroTitle} onChange={v => setContent({ ...content, infoHeroTitle: v })} /></SettingRow>
                        <SettingRow label="Sub-judul"><TextArea value={content.infoSubtitle} onChange={v => setContent({ ...content, infoSubtitle: v })} /></SettingRow>
                        <SettingRow label="Banner Peringatan / Catatan" hint="Tampil sebagai banner kuning di atas daftar tugas">
                          <TextArea value={content.infoBanner} onChange={v => setContent({ ...content, infoBanner: v })} />
                        </SettingRow>
                      </AccordionSection>

                      <AccordionSection title="/hub — Pusat Penjelajahan" icon={Layers}>
                        <SettingRow label="Teks Badge"><TextInput value={content.hubBadge} onChange={v => setContent({ ...content, hubBadge: v })} /></SettingRow>
                        <SettingRow label="Judul Halaman"><TextInput value={content.hubTitle} onChange={v => setContent({ ...content, hubTitle: v })} /></SettingRow>
                        <SettingRow label="Deskripsi"><TextArea value={content.hubDescription} onChange={v => setContent({ ...content, hubDescription: v })} /></SettingRow>
                      </AccordionSection>

                      <AccordionSection title="/guide — Panduan & Artikel" icon={FileText}>
                        <SettingRow label="Teks Badge"><TextInput value={content.guideBadge} onChange={v => setContent({ ...content, guideBadge: v })} /></SettingRow>
                        <SettingRow label="Judul Halaman"><TextInput value={content.guideTitle} onChange={v => setContent({ ...content, guideTitle: v })} /></SettingRow>
                        <SettingRow label="Deskripsi"><TextArea value={content.guideDescription} onChange={v => setContent({ ...content, guideDescription: v })} /></SettingRow>
                      </AccordionSection>

                      <AccordionSection title="/contact — Kontak LO" icon={Type}>
                        <SettingRow label="Judul Halaman"><TextInput value={content.contactTitle} onChange={v => setContent({ ...content, contactTitle: v })} /></SettingRow>
                        <SettingRow label="Deskripsi"><TextArea value={content.contactDescription} onChange={v => setContent({ ...content, contactDescription: v })} /></SettingRow>
                      </AccordionSection>

                      <AccordionSection title="Footer (semua halaman)" icon={Layout}>
                        <SettingRow label="Teks Copyright" hint='Muncul di footer semua halaman. Misal: "IMO 2026. Made with Next.js."'>
                          <TextInput value={content.footerCopyright} onChange={v => setContent({ ...content, footerCopyright: v })} />
                        </SettingRow>
                        <SettingRow label="Tagline Footer (opsional)">
                          <TextInput value={content.footerTagline} onChange={v => setContent({ ...content, footerTagline: v })} placeholder="Biarkan kosong jika tidak diperlukan" />
                        </SettingRow>
                      </AccordionSection>
                    </div>
                  )}

                  {/* ══════════════════════════════════════════════════════
                      TAB 3: FITUR & MODUL
                  ══════════════════════════════════════════════════════ */}
                  {activeTab === "features" && (
                    <div className="space-y-5">
                      <section className="rounded-2xl border border-white/8 bg-slate-950/60 overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/8 bg-slate-900/40">
                          <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4 text-accent-yellow" />
                            <h2 className="text-sm font-bold text-slate-100">Toggle Modul Web</h2>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Aktifkan atau nonaktifkan fitur/halaman tertentu di web. Perubahan berlaku setelah disimpan.</p>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <FeatureToggle label="Push Notification" desc="Sistem notifikasi push ke perangkat user. Nonaktifkan untuk menutup prompt izin notifikasi." on={features.enablePushNotif} onToggle={() => setFeatures(f => ({ ...f, enablePushNotif: !f.enablePushNotif }))} />
                          <FeatureToggle label="Background Starfield" desc="Animasi partikel bintang 3D di background. Nonaktifkan untuk performa lebih baik di perangkat lemah." on={features.enableStarfield} onToggle={() => setFeatures(f => ({ ...f, enableStarfield: !f.enableStarfield }))} />
                          <FeatureToggle label="ID Card Generator (/id-card)" desc="Fitur generator kartu identitas peserta IMO 2026." on={features.enableIdCard} onToggle={() => setFeatures(f => ({ ...f, enableIdCard: !f.enableIdCard }))} warning />
                          <FeatureToggle label="Document Generator (/documents)" desc="Fitur auto-form generator dokumen PDF." on={features.enableDocuments} onToggle={() => setFeatures(f => ({ ...f, enableDocuments: !f.enableDocuments }))} warning />
                          <FeatureToggle label="Halaman Panduan (/guide)" desc="Halaman artikel, pengumuman, dan embed dokumen Google Drive." on={features.enableGuide} onToggle={() => setFeatures(f => ({ ...f, enableGuide: !f.enableGuide }))} warning />
                          <FeatureToggle label="Halaman Kontak (/contact)" desc="Direktori kontak WhatsApp LO & pendamping kelompok." on={features.enableContact} onToggle={() => setFeatures(f => ({ ...f, enableContact: !f.enableContact }))} warning />
                        </div>
                      </section>

                      <section className="rounded-2xl border border-rose-500/20 bg-rose-950/10 overflow-hidden">
                        <div className="px-5 py-4 border-b border-rose-500/15 bg-rose-950/20">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-rose-400" />
                            <h2 className="text-sm font-bold text-rose-200">Mode Maintenance</h2>
                          </div>
                          <p className="text-[11px] text-rose-400/70 mt-0.5">Saat aktif, semua halaman publik menampilkan pesan maintenance. Hanya admin yang bisa mengakses.</p>
                        </div>
                        <div className="p-5 space-y-4">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-rose-500/20">
                            <div>
                              <p className={`text-sm font-bold ${features.maintenanceMode ? "text-rose-300" : "text-slate-400"}`}>
                                {features.maintenanceMode ? "🔒 MAINTENANCE MODE AKTIF" : "🟢 Web Berjalan Normal"}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">Semua halaman publik akan menampilkan pesan di bawah</p>
                            </div>
                            <button onClick={() => setFeatures(f => ({ ...f, maintenanceMode: !f.maintenanceMode }))}
                              className={`flex-shrink-0 w-12 h-6 rounded-full transition-all duration-300 relative cursor-pointer ${features.maintenanceMode ? "bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" : "bg-slate-700"}`}>
                              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${features.maintenanceMode ? "left-6" : "left-0.5"}`} />
                            </button>
                          </div>
                          <div>
                            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Pesan Maintenance</label>
                            <TextArea value={features.maintenanceMessage} onChange={v => setFeatures(f => ({ ...f, maintenanceMessage: v }))} rows={3} placeholder="Sistem sedang dalam pemeliharaan..." />
                          </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {/* ══════════════════════════════════════════════════════
                      TAB 4: TEKNIS & SEO
                  ══════════════════════════════════════════════════════ */}
                  {activeTab === "technical" && (
                    <div className="space-y-5">
                      {/* Drive Config */}
                      <section className="rounded-2xl border border-white/8 bg-slate-950/60 overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/8 bg-slate-900/40">
                          <div className="flex items-center space-x-2">
                            <HardDrive className="h-4 w-4 text-accent-cyan" />
                            <h2 className="text-sm font-bold text-slate-100">Google Drive Integration</h2>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Konfigurasi folder Google Drive untuk sistem pengecekan tugas kelompok & individu.</p>
                        </div>
                        <div className="px-5">
                          <SettingRow label="Parent Folder ID" hint="ID folder Google Drive induk. Bisa ID saja (dari URL) atau full URL.">
                            <TextInput value={tech.gdriveParentFolder} onChange={v => setTech({ ...tech, gdriveParentFolder: v })} placeholder="11xRuReiU4Eyuw5lBOWgn30IMBoWKElGI" mono />
                          </SettingRow>
                          <SettingRow label="Total Kelompok" hint="Jumlah kelompok yang akan dibuatkan folder di Drive">
                            <input type="number" min={1} max={300} value={tech.totalGroups}
                              onChange={e => setTech({ ...tech, totalGroups: Number(e.target.value) })}
                              className="w-32 px-3.5 py-2.5 rounded-xl bg-[#0a1020] border border-white/10 text-slate-100 text-sm font-mono focus:outline-none focus:border-accent-cyan/60 transition" />
                          </SettingRow>
                          <SettingRow label="Anggota per Kelompok" hint="Digunakan untuk menghitung % kelengkapan tugas individu">
                            <input type="number" min={1} max={100} value={tech.membersPerGroup}
                              onChange={e => setTech({ ...tech, membersPerGroup: Number(e.target.value) })}
                              className="w-32 px-3.5 py-2.5 rounded-xl bg-[#0a1020] border border-white/10 text-slate-100 text-sm font-mono focus:outline-none focus:border-accent-cyan/60 transition" />
                          </SettingRow>
                        </div>
                        <div className="px-5 pb-5">
                          <button onClick={handleSyncDrive} disabled={syncing}
                            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-xs font-mono font-bold hover:bg-accent-cyan/20 transition cursor-pointer disabled:opacity-60">
                            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                            <span>{syncing ? "Menyinkronkan..." : "Sinkronisasi Folder Drive Sekarang"}</span>
                          </button>
                        </div>
                      </section>

                      {/* SEO */}
                      <section className="rounded-2xl border border-white/8 bg-slate-950/60 overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/8 bg-slate-900/40">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-accent-purple" />
                            <h2 className="text-sm font-bold text-slate-100">SEO & Metadata</h2>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Metadata yang muncul di browser tab, Google Search, dan saat link dibagikan di media sosial.</p>
                        </div>
                        <div className="px-5">
                          <SettingRow label="Title Tag (Browser Tab)" hint="Muncul di tab browser dan hasil pencarian Google. Maks ~60 karakter">
                            <TextInput value={tech.seoTitle} onChange={v => setTech({ ...tech, seoTitle: v })} placeholder="IMO 2026 - Innovative Minds Outclass" />
                          </SettingRow>
                          <SettingRow label="Meta Description" hint="Deskripsi singkat di hasil pencarian Google. Maks ~160 karakter">
                            <TextArea value={tech.seoDescription} onChange={v => setTech({ ...tech, seoDescription: v })} />
                          </SettingRow>
                          <SettingRow label="Meta Keywords" hint="Kata kunci terpisah koma (opsional, tidak terlalu penting untuk SEO modern)">
                            <TextInput value={tech.seoKeywords} onChange={v => setTech({ ...tech, seoKeywords: v })} placeholder="IMO 2026, mahasiswa baru, orientasi" />
                          </SettingRow>
                        </div>
                      </section>

                      {/* System Info - readonly */}
                      <section className="rounded-2xl border border-white/8 bg-slate-950/40 overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/8 bg-slate-900/30">
                          <div className="flex items-center space-x-2">
                            <Cpu className="h-4 w-4 text-slate-400" />
                            <h2 className="text-sm font-bold text-slate-300">Informasi Sistem (Readonly)</h2>
                          </div>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { label: "Framework", value: "Next.js 16.2.10 (Turbopack)" },
                            { label: "Database", value: "Supabase (PostgreSQL)" },
                            { label: "Runtime", value: "Vercel Edge / Node.js" },
                            { label: "Env", value: process.env.NODE_ENV || "production" },
                            { label: "Repo", value: "bijakmaulana06/imo" },
                            { label: "Logo Asset", value: "/public/Brighton.svg" },
                          ].map(item => (
                            <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-[#0a1020] border border-white/6">
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">{item.label}</span>
                              <span className="text-xs font-mono text-slate-300">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
