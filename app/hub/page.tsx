"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ImoLogo from "@/components/ImoLogo";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Search,
  ExternalLink,
  BookOpen,
  FileCheck2,
  QrCode,
  Users,
  MessageSquare,
  Camera,
  Sparkles,
  Layers,
  Compass,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

interface HubLink {
  id: string;
  label: string;
  url: string;
  icon_key: string;
  category: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

const DEFAULT_HUB_LINKS: HubLink[] = [
  {
    id: "guide-0",
    label: "Pusat Informasi & Panduan (Artikel)",
    url: "/guide",
    icon_key: "sparkles",
    category: "Panduan & Berkas",
    description: "Artikel dan highlight penting seputar pembagian gesang (kendaraan), jadwal acara, dan perlengkapan.",
    sort_order: 0,
    is_active: true,
  },
  {
    id: "1",
    label: "Buku Panduan IMO 2026",
    url: "https://drive.google.com",
    icon_key: "book",
    category: "Panduan & Berkas",
    description: "Panduan lengkap regulasi, jadwal kegiatan, dan tata tertib IMO 2026.",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "2",
    label: "ID Card Generator IMO 2026",
    url: "/id-card",
    icon_key: "qrcode",
    category: "Generator & Tools",
    description: "Generator kartu identitas resmi IMO 2026 diproses instan 100% pada perangkat Anda.",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "3",
    label: "Auto-Form Generator Dokumen",
    url: "/documents",
    icon_key: "folder",
    category: "Generator & Tools",
    description: "Generator otomatis berkas seperti lembar pengesahan dan surat ijin.",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "4",
    label: "Direktori Kontak LO & Pendamping",
    url: "/contact",
    icon_key: "users",
    category: "Media & Komunikasi",
    description: "Daftar WhatsApp dan Instagram pendamping kelompok Anda.",
    sort_order: 4,
    is_active: true,
  },
  {
    id: "5",
    label: "Grup Telegram & Saluran Informasi IMO 2026",
    url: "https://t.me",
    icon_key: "telegram",
    category: "Media & Komunikasi",
    description: "Saluran pengumuman resmi dan grup Telegram koordinasi.",
    sort_order: 5,
    is_active: true,
  },
  {
    id: "6",
    label: "Instagram Resmi IMO 2026",
    url: "https://instagram.com",
    icon_key: "instagram",
    category: "Media & Komunikasi",
    description: "Foto kegiatan, pengumuman kilat, dan dokumentasi visual IMO 2026.",
    sort_order: 6,
    is_active: true,
  },
  {
    id: "7",
    label: "Scanner Pengumpulan Drive",
    url: "/info",
    icon_key: "folder",
    category: "Pengumpulan Tugas",
    description: "Verifikasi otomatis pengumpulan berkas kelompok dan berkas individu.",
    sort_order: 7,
    is_active: true,
  },
];

export default function HubPage() {
  const [links, setLinks] = useState<HubLink[]>(DEFAULT_HUB_LINKS);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua Penjelajahan");
  const [loading, setLoading] = useState<boolean>(true);

  // Dynamic header state from page_content settings
  const [headerContent, setHeaderContent] = useState({
    hubBadge: "Pusat Penjelajahan IMO 2026",
    hubTitle: "PUSAT PENJELAJAHAN",
    hubDescription: "Portal pusat navigasi cepat untuk mengakses semua panduan, tools generator, saluran media resmi, dan pusat berkas IMO 2026.",
  });

  const renderIcon = (iconKey: string) => {
    switch (iconKey.toLowerCase()) {
      case "book":
        return <BookOpen className="h-6 w-6 text-accent-cyan" />;
      case "qrcode":
        return <QrCode className="h-6 w-6 text-accent-purple" />;
      case "folder":
        return <FileCheck2 className="h-6 w-6 text-emerald-400" />;
      case "users":
        return <Users className="h-6 w-6 text-accent-yellow" />;
      case "telegram":
        return <MessageSquare className="h-6 w-6 text-sky-400" />;
      case "instagram":
        return <Camera className="h-6 w-6 text-pink-400" />;
      case "sparkles":
        return <Sparkles className="h-6 w-6 text-amber-300" />;
      case "help":
        return <HelpCircle className="h-6 w-6 text-indigo-400" />;
      default:
        return <Compass className="h-6 w-6 text-accent-cyan" />;
    }
  };

  useEffect(() => {
    const fetchHubData = async () => {
      try {
        const supabase = createClient();

        // 1. Fetch page_content settings for dynamic header
        const { data: pageContentData } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "page_content")
          .maybeSingle();

        if (pageContentData?.value) {
          try {
            const parsed = JSON.parse(pageContentData.value);
            setHeaderContent({
              hubBadge: parsed.hubBadge || headerContent.hubBadge,
              hubTitle: parsed.hubTitle || headerContent.hubTitle,
              hubDescription: parsed.hubDescription || headerContent.hubDescription,
            });
          } catch {}
        }

        // 2. Fetch hub_links
        const { data, error } = await supabase
          .from("hub_links")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (data && data.length > 0) {
          setLinks(data as HubLink[]);
        }
      } catch (err) {
        console.warn("Fallback to defaults:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHubData();
  }, []);

  const categories = [
    "Semua Penjelajahan",
    "Panduan & Berkas",
    "Generator & Tools",
    "Media & Komunikasi",
    "Pengumpulan Tugas",
  ];

  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (link.description && link.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory =
      selectedCategory === "Semua Penjelajahan" || link.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative min-h-screen flex flex-col z-0 overflow-hidden bg-[#020510] text-slate-100 font-sans">
      <StarfieldBackground />
      <Navbar />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-12 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full border border-accent-purple/30 bg-accent-purple/5 text-accent-purple text-xs font-bold uppercase tracking-wider mb-4">
            <Layers className="h-4 w-4" />
            <span>{headerContent.hubBadge}</span>
          </div>
          
          <div className="flex items-center justify-center space-x-3 mb-2">
            <ImoLogo height={44} className="h-10 md:h-12" />
            <h1 className="text-3xl md:text-5xl font-display font-black tracking-wider text-slate-100">
              {headerContent.hubTitle}
            </h1>
          </div>
          
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {headerContent.hubDescription}
          </p>
        </div>

        <div className="glass rounded-2xl p-6 mb-10 border border-card-border/40 space-y-4">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tautan modul, generator, atau panduan penjelajahan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950/70 border border-card-border/50 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-accent-cyan/60 font-sans transition"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition duration-300 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-accent-cyan text-black shadow-[0_0_15px_rgba(125,249,255,0.4)]"
                    : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-card-border/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Link Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLinks.map((link) => {
            const isExternal = link.url.startsWith("http://") || link.url.startsWith("https://");

            const CardContent = (
              <Card glowColor="cyan" className="h-full flex flex-col justify-between group cursor-pointer">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-card-border/50 group-hover:border-accent-cyan/60 transition duration-300">
                      {renderIcon(link.icon_key)}
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-950/80 border border-card-border/40 text-slate-400">
                      {link.category}
                    </span>
                  </div>

                  <h3 className="font-display font-extrabold text-base text-slate-100 group-hover:text-accent-cyan transition duration-300 mb-2">
                    {link.label}
                  </h3>

                  {link.description && (
                    <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">
                      {link.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center text-xs font-mono font-bold text-accent-cyan group-hover:translate-x-1 transition-transform duration-300 mt-auto pt-2">
                  <span>Akses Sekarang</span>
                  {isExternal ? (
                    <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  ) : (
                    <Rocket className="h-3.5 w-3.5 ml-1.5" />
                  )}
                </div>
              </Card>
            );

            return isExternal ? (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="block h-full">
                {CardContent}
              </a>
            ) : (
              <Link key={link.id} href={link.url} className="block h-full">
                {CardContent}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
