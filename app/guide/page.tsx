"use client";

import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "next-view-transitions";
import {
  Megaphone,
  Pin,
  Calendar,
  Clock,
  ExternalLink,
  Car,
  Backpack,
  AlertCircle,
  FileText,
  Maximize2,
  RefreshCw,
  Copy,
  Check,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  ChevronRight,
  Eye,
  X,
  Share2,
  FileEdit,
  ArrowRight,
  Download
} from "lucide-react";
import { useSiteConfig } from "@/components/SiteConfigProvider";

interface Announcement {
  id: string;
  title: string;
  content: string; // JSON string with notes, gdrive_url, autoform_url or plain text
  category: string;
  pinned: boolean;
  published_at: string;
}

interface ProcessedArticle {
  id: string;
  title: string;
  notes: string;
  gdrive_url: string;
  autoform_url?: string;
  category: string;
  pinned: boolean;
  published_at: string;
}

export default function InteractiveGuidePage() {
  const { config } = useSiteConfig();
  const [articles, setArticles] = useState<ProcessedArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  
  // Interactive Checklist State (persisted in localStorage)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<boolean>(false);
  const [noteSearchQuery, setNoteSearchQuery] = useState<string>("");
  const [isFullscreenDoc, setIsFullscreenDoc] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);

  // Load checked items from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("imo2026_guide_checklist");
      if (saved) setCheckedItems(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const toggleCheckItem = (key: string) => {
    setCheckedItems((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("imo2026_guide_checklist", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .order("pinned", { ascending: false })
          .order("published_at", { ascending: false });

        if (error) throw error;

        let processed: ProcessedArticle[] = [];

        if (data && data.length > 0) {
          processed = data.map((item: Announcement) => {
            let notes = item.content;
            let gdrive_url = "";
            let autoform_url = "";

            try {
              if (item.content.trim().startsWith("{")) {
                const parsed = JSON.parse(item.content);
                notes = parsed.notes || item.content;
                gdrive_url = parsed.gdrive_url || "";
                autoform_url = parsed.autoform_url || "";
              }
            } catch (e) {}

            return {
              id: item.id,
              title: item.title,
              notes,
              gdrive_url,
              autoform_url,
              category: item.category,
              pinned: item.pinned,
              published_at: item.published_at,
            };
          });
        }

        // Default mockup data if DB is empty to showcase the interactive embed, sample letter & autoform button
        if (processed.length === 0) {
          processed = [
            {
              id: "mock-surat",
              title: "Contoh & Petunjuk Surat Izin / Pernyataan Orang Tua",
              category: "Contoh Surat",
              pinned: true,
              published_at: new Date().toISOString(),
              gdrive_url: "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview",
              autoform_url: "/documents",
              notes: `📄 PETUNJUK PENGISIAN SURAT PERNYATAAN / IZIN PESERTA:

1. Dokumen di samping merupakan contoh struktur format Surat Izin Orang Tua / Wali resmi IMO 2026.
2. Komponen Data Wajib Diisi:
   - Nama Lengkap Peserta & NIM
   - Kelompok & Jurusan / Program Studi
   - Nama Lengkap Orang Tua / Wali
   - Alamat Tempat Tinggal & Nomor HP Darurat
   - Tanda Tangan Basah Orang Tua / Wali (+ Materai 10.000)

⚡ KEMUDAHAN AUTO-FORM:
Gunakan tombol "Buka Generator Autoform Surat" di bawah ini untuk mengisi dan mencetak PDF surat secara instan tanpa perlu mengetik manual!`
            },
            {
              id: "mock-gesang",
              title: "Pembagian Gesang (Kendaraan) IMO 2026",
              category: "Pembagian Gesang",
              pinned: true,
              published_at: new Date(Date.now() - 3600000).toISOString(),
              gdrive_url: "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview",
              notes: `📌 RINGKASAN PEMBAGIAN KENDARAAN & KEBERANGKATAN:

- Titik Kumpul: Lapangan Utama Kampus pukul 05.30 WIB (Tepat waktu!).
- Pembagian Armada Bus / Truk:
  • Bus 1: Kelompok 1 - 4 (PJ: Kak Budi)
  • Bus 2: Kelompok 5 - 8 (PJ: Kak Siti)
  • Bus 3: Kelompok 9 - 12 (PJ: Kak Aris)
- Peserta WAJIB melakukan presensi kepada LO sebelum memasuki kendaraan.
- Barang bagasi besar disimpan di bagian bawah armada, tas kecil dibawa ke kabin.`
            },
            {
              id: "mock-jadwal",
              title: "Rangkaian Jadwal Acara & Agenda Utama",
              category: "Jadwal Acara",
              pinned: false,
              published_at: new Date(Date.now() - 86400000).toISOString(),
              gdrive_url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview",
              notes: `⏰ AGENDA UTAMA HARI PERTAMA:

- 06:00 - 07:00 : Keberangkatan & Konvoy Armada
- 07:00 - 08:30 : Pengondisian Barisan & Opening Ceremony
- 08:30 - 11:30 : Sesi Orientasi & Pematerian Utama
- 11:30 - 13:00 : ISHOMA (Makan Siang & Sholat Berjamaah)
- 13:00 - 16:00 : Team Building & Games Kelompok
- 16:00 - 17:30 : Evaluasi Harian & Penutupan Sesi 1`
            },
            {
              id: "mock-perlengkapan",
              title: "Daftar Perlengkapan Wajib Peserta",
              category: "Perlengkapan",
              pinned: false,
              published_at: new Date(Date.now() - 172800000).toISOString(),
              gdrive_url: "",
              notes: `🎒 CHECKLIST PERLENGKAPAN INDIVIDU:

- Seragam Resmi IMO 2026 + ID Card Peserta
- Surat Izin / Pernyataan yang telah ditandatangani
- Obat-obatan Pribadi Khusus
- Botol Minum / Tumbler Refill (Minimal 600ml)
- Jas Hujan Ponco / Payung Lipat
- Buku Catatan & Alat Tulis
- Kit Kebersihan & Hand Sanitizer`
            }
          ];
        }

        setArticles(processed);
        if (processed.length > 0) {
          setActiveArticleId(processed[0].id);
        }
      } catch (err) {
        console.error("Error fetching articles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const categories = ["Semua", ...Array.from(new Set(articles.map((a) => a.category)))];

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => selectedCategory === "Semua" || a.category === selectedCategory);
  }, [articles, selectedCategory]);

  const activeArticle = useMemo(() => {
    return articles.find((a) => a.id === activeArticleId) || filteredArticles[0] || null;
  }, [articles, activeArticleId, filteredArticles]);

  // Convert GDrive share links to embeddable preview URL
  const getEmbedUrl = (rawUrl: string) => {
    if (!rawUrl) return "";
    let url = rawUrl.trim();

    if (url.includes("docs.google.com") || url.includes("drive.google.com")) {
      if (url.endsWith("/preview") || url.includes("/preview?") || url.includes("/embed")) {
        return url;
      }
      if (url.includes("/edit")) {
        return url.replace(/\/edit.*$/, "/preview");
      }
      if (url.includes("/view")) {
        return url.replace(/\/view.*$/, "/preview");
      }
      const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (matchFile && matchFile[1]) {
        return `https://drive.google.com/file/d/${matchFile[1]}/preview`;
      }
      const matchDoc = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
      if (matchDoc && matchDoc[1]) {
        return `https://docs.google.com/document/d/${matchDoc[1]}/preview`;
      }
      const matchSheet = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      if (matchSheet && matchSheet[1]) {
        return `https://docs.google.com/spreadsheets/d/${matchSheet[1]}/preview`;
      }
    }
    return url;
  };

  const embedUrl = useMemo(() => {
    return activeArticle ? getEmbedUrl(activeArticle.gdrive_url) : "";
  }, [activeArticle]);

  const handleCopyNotes = () => {
    if (!activeArticle) return;
    const textToCopy = `*${activeArticle.title}*\n\n${activeArticle.notes}${
      activeArticle.gdrive_url ? `\n\n📄 Dokumen GDrive: ${activeArticle.gdrive_url}` : ""
    }`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("surat") || cat.includes("dokumen")) return <FileEdit className="h-4 w-4 text-accent-purple" />;
    if (cat.includes("transportasi") || cat.includes("gesang") || cat.includes("kendaraan")) return <Car className="h-4 w-4 text-accent-cyan" />;
    if (cat.includes("perlengkapan") || cat.includes("barang")) return <Backpack className="h-4 w-4 text-emerald-400" />;
    if (cat.includes("jadwal") || cat.includes("waktu")) return <Calendar className="h-4 w-4 text-accent-yellow" />;
    if (cat.includes("penting")) return <AlertCircle className="h-4 w-4 text-rose-400" />;
    return <FileText className="h-4 w-4 text-accent-cyan" />;
  };

  // Parse notes lines into interactive checklist if bulleted/numbered, or text blocks
  const renderInteractiveNotes = (notes: string) => {
    const lines = notes.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      const isListItem = /^[-*•\d+.]\s+/.test(trimmed);
      
      if (noteSearchQuery.trim() && !trimmed.toLowerCase().includes(noteSearchQuery.toLowerCase())) {
        return null;
      }

      if (isListItem) {
        const cleanText = trimmed.replace(/^[-*•\d+.]\s+/, "");
        const checkKey = `${activeArticle?.id || "art"}_line_${idx}`;
        const isChecked = !!checkedItems[checkKey];

        return (
          <div
            key={idx}
            onClick={() => toggleCheckItem(checkKey)}
            className={`flex items-start space-x-3 p-2.5 rounded-xl border transition-all cursor-pointer mb-2 touch-manipulation ${
              isChecked
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 line-through opacity-80"
                : "bg-slate-950/60 border-card-border/40 text-slate-200 hover:bg-slate-900 hover:border-accent-cyan/40"
            }`}
          >
            <button type="button" className="mt-0.5 text-accent-cyan flex-shrink-0">
              {isChecked ? (
                <CheckSquare className="h-4 w-4 text-emerald-400" />
              ) : (
                <Square className="h-4 w-4 text-slate-500" />
              )}
            </button>
            <span className="text-xs md:text-sm font-sans leading-relaxed flex-grow">{cleanText}</span>
          </div>
        );
      }

      if (!trimmed) return <div key={idx} className="h-2" />;

      return (
        <p key={idx} className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans mb-3">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col z-0 overflow-hidden bg-[#020510] text-slate-100 font-sans">
      <StarfieldBackground />
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 relative z-10">
        
        {/* Header Title Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan text-xs font-bold uppercase tracking-wider mb-3 shadow-[0_0_20px_rgba(125,249,255,0.2)]">
            <Sparkles className="h-4 w-4" />
            <span>Interactive Document & Note Center</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-display font-black tracking-wider text-slate-100 mb-2">
            {config.guideHeroTitle || "PANDUAN & EMBED DOKUMEN"}
          </h1>
          
          <p className="text-slate-400 text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
            {config.guideHeroSubtitle || "Halaman interaktif pengumuman resmi & contoh surat. Tinjau dokumen (Jadwal, Gesang Kendaraan, Contoh Surat) bersandingan dengan petunjuk & tombol langsung ke Auto-Form Generator."}
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                const first = articles.find((a) => cat === "Semua" || a.category === cat);
                if (first) setActiveArticleId(first.id);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition duration-300 cursor-pointer flex items-center space-x-1.5 ${
                selectedCategory === cat
                  ? "bg-accent-cyan text-black font-extrabold shadow-[0_0_18px_rgba(125,249,255,0.4)] scale-105"
                  : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-card-border/50"
              }`}
            >
              {cat !== "Semua" && getCategoryIcon(cat)}
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Document Selector Tabs */}
        {filteredArticles.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {filteredArticles.map((art) => {
              const isActive = activeArticle?.id === art.id;
              return (
                <button
                  key={art.id}
                  onClick={() => setActiveArticleId(art.id)}
                  className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold font-mono transition-all flex-shrink-0 cursor-pointer border ${
                    isActive
                      ? "bg-slate-900 text-accent-cyan border-accent-cyan shadow-[0_0_15px_rgba(125,249,255,0.25)]"
                      : "bg-slate-950/70 text-slate-400 border-card-border/40 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  {art.pinned && <Pin className="h-3.5 w-3.5 text-accent-yellow fill-accent-yellow" />}
                  {getCategoryIcon(art.category)}
                  <span className="truncate max-w-[180px]">{art.title}</span>
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 glass rounded-3xl p-8 border border-card-border/30 h-[500px] animate-pulse" />
            <div className="lg:col-span-5 glass rounded-3xl p-8 border border-card-border/30 h-[500px] animate-pulse" />
          </div>
        ) : !activeArticle ? (
          <Card glowColor="purple" className="text-center p-12">
            <Info className="h-10 w-10 text-accent-purple mx-auto mb-3" />
            <h3 className="font-display font-bold text-slate-100 text-lg">Belum Ada Artikel / Dokumen</h3>
            <p className="text-xs text-slate-400 mt-1">Admin belum mempublikasikan dokumen untuk kategori ini.</p>
          </Card>
        ) : (
          /* MAIN DUAL PANE LAYOUT (EMBEDDED GDRIVE + INTERACTIVE SIDE NOTES) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT PANE: EMBEDDED GOOGLE DRIVE DOCUMENT VIEWER */}
            <div className="lg:col-span-7 space-y-4">
              <Card glowColor="cyan" className="p-4 md:p-5 flex flex-col h-full">
                
                {/* Embed Header Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-card-border/40">
                  <div className="flex items-center space-x-2">
                    <span className="p-2 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="font-display font-bold text-slate-100 text-sm md:text-base truncate max-w-[260px] md:max-w-[340px]">
                        {activeArticle.title}
                      </h2>
                      <span className="text-[10px] font-mono text-slate-400">Preview Dokumen Google Drive</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {embedUrl && (
                      <button
                        onClick={() => setIsFullscreenDoc(true)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-card-border text-slate-300 hover:text-accent-cyan text-xs font-mono font-bold transition flex items-center space-x-1 cursor-pointer"
                        title="Tampilan Layar Penuh (Pop-up Modal)"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Layar Penuh</span>
                      </button>
                    )}

                    {activeArticle.gdrive_url && (
                      <a
                        href={activeArticle.gdrive_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-accent-cyan/15 hover:bg-accent-cyan hover:text-black border border-accent-cyan/40 text-accent-cyan text-xs font-mono font-bold transition flex items-center space-x-1 cursor-pointer"
                        title="Buka Langsung di Tab Baru GDrive"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Tab Baru</span>
                      </a>
                    )}

                    <button
                      onClick={() => setIframeKey((prev) => prev + 1)}
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-card-border text-slate-400 hover:text-white transition cursor-pointer"
                      title="Muat Ulang Iframe"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Iframe Box Container */}
                <div className="w-full rounded-2xl overflow-hidden bg-slate-950 border border-card-border/60 min-h-[460px] md:min-h-[560px] relative flex flex-col justify-center items-center">
                  {embedUrl ? (
                    <iframe
                      key={iframeKey}
                      src={embedUrl}
                      className="w-full flex-grow min-h-[460px] md:min-h-[560px] border-0"
                      allow="autoplay"
                      title={activeArticle.title}
                    />
                  ) : (
                    <div className="p-8 text-center space-y-3">
                      <div className="h-12 w-12 rounded-2xl bg-accent-purple/10 border border-accent-purple/30 text-accent-purple flex items-center justify-center mx-auto">
                        <FileText className="h-6 w-6" />
                      </div>
                      <h3 className="font-display font-bold text-slate-200 text-base">Tidak Ada Embed Dokumen</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Artikel ini berfokus pada catatan ringkasan di samping. Admin belum memasukkan link dokumen Google Drive untuk artikel ini.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* RIGHT PANE: INTERACTIVE SIDE NOTES & HIGHLIGHT BOARD */}
            <div className="lg:col-span-5 space-y-4 sticky top-20">
              <Card glowColor="purple" className="p-5 md:p-6 flex flex-col justify-between">
                
                {/* Notes Header */}
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-card-border/30">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase bg-accent-purple/15 text-accent-purple border border-accent-purple/30 px-2.5 py-0.5 rounded-full font-bold">
                        {activeArticle.category}
                      </span>
                      {activeArticle.pinned && (
                        <span className="text-[10px] font-mono uppercase bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30 px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
                          <Pin className="h-3 w-3 fill-accent-yellow" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handleCopyNotes}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-card-border text-slate-300 hover:text-accent-cyan text-xs font-mono transition flex items-center space-x-1.5 cursor-pointer"
                      title="Salin Catatan ke Clipboard"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                          <span>Salin Catatan</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h2 className="font-display font-extrabold text-lg md:text-xl text-slate-100 mb-3 leading-snug">
                    {activeArticle.title}
                  </h2>

                  {/* PROMINENT AUTO-FORM CTA CARD (FOR CONTOH SURAT OR IF AUTOFORM_URL IS PROVIDED) */}
                  {(activeArticle.autoform_url || activeArticle.category.toLowerCase().includes("surat") || activeArticle.category.toLowerCase().includes("dokumen")) && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-purple/25 via-accent-cyan/15 to-accent-purple/25 border border-accent-purple/50 shadow-[0_0_20px_rgba(180,140,255,0.25)] mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-accent-purple font-mono font-bold text-xs uppercase tracking-wider">
                          <FileEdit className="h-4 w-4 text-accent-cyan" />
                          <span>Auto-Form Generator Ready</span>
                        </div>
                        <span className="text-[10px] bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40 px-2.5 py-0.5 rounded-full font-bold">
                          PDF Instan
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 mt-2 font-sans leading-relaxed">
                        Perlu mengisi surat ini? Masukkan data Anda di formulir online dan buat PDF otomatis dalam hitungan detik.
                      </p>

                      <Link
                        href={activeArticle.autoform_url || "/documents"}
                        className="mt-3 w-full py-2.5 px-4 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white font-bold text-xs flex items-center justify-center space-x-2 transition duration-300 shadow-[0_0_15px_rgba(180,140,255,0.4)] group cursor-pointer"
                      >
                        <span>Buka Generator Autoform Surat</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
                      </Link>
                    </div>
                  )}

                  {/* Search inside note items */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Cari kata kunci dalam catatan..."
                      value={noteSearchQuery}
                      onChange={(e) => setNoteSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-card-border/50 text-slate-200 text-xs focus:outline-none focus:border-accent-purple/60 font-sans"
                    />
                  </div>

                  {/* Interactive Rendered Notes Container */}
                  <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                    {renderInteractiveNotes(activeArticle.notes)}
                  </div>
                </div>

                {/* Footer Note Hint */}
                <div className="pt-4 mt-6 border-t border-card-border/30 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span className="flex items-center space-x-1 text-accent-cyan">
                    <Sparkles className="h-3 w-3" />
                    <span>Klik item poin untuk centang checklist</span>
                  </span>
                  <span>
                    {new Date(activeArticle.published_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short"
                    })}
                  </span>
                </div>

              </Card>
            </div>

          </div>
        )}

      </main>

      {/* FULLSCREEN POP-UP MODAL FOR GDRIVE PREVIEW */}
      <AnimatePresence>
        {isFullscreenDoc && embedUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-6xl h-[92vh] glass rounded-3xl border border-accent-cyan/40 shadow-[0_0_50px_rgba(125,249,255,0.3)] flex flex-col overflow-hidden bg-slate-950"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-card-border/40 bg-slate-950">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-slate-100 text-base md:text-lg">
                      {activeArticle?.title}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Mode Layar Penuh Google Drive Embed</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {activeArticle?.autoform_url && (
                    <Link
                      href={activeArticle.autoform_url}
                      className="px-3 py-1.5 rounded-xl bg-accent-purple text-white text-xs font-mono font-bold transition flex items-center space-x-1.5 hover:bg-accent-purple/80"
                    >
                      <FileEdit className="h-4 w-4" />
                      <span>Autoform</span>
                    </Link>
                  )}

                  {activeArticle?.gdrive_url && (
                    <a
                      href={activeArticle.gdrive_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-accent-cyan/15 hover:bg-accent-cyan hover:text-black text-accent-cyan text-xs font-mono font-bold transition flex items-center space-x-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="hidden sm:inline">Buka GDrive</span>
                    </a>
                  )}

                  <button
                    onClick={() => setIsFullscreenDoc(false)}
                    className="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Fullscreen Iframe */}
              <div className="flex-grow w-full h-full bg-slate-950">
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-0"
                  allow="autoplay"
                  title="Fullscreen GDrive Document"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="w-full py-8 text-center text-xs text-slate-500 font-mono border-t border-card-border/20 mt-16 bg-background/50">
        &copy; {new Date().getFullYear()} IMO 2026. Interactive Document & Note Center.
      </footer>
    </div>
  );
}
