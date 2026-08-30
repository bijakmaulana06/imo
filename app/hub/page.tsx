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
import { Link } from "next-view-transitions";
import { useSiteConfig } from "@/components/SiteConfigProvider";

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

const DEFAULT_HUB_LINKS: HubLink[] = [];

export default function HubPage() {
  const { config } = useSiteConfig();
  const [links, setLinks] = useState<HubLink[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua Penjelajahan");
  const [loading, setLoading] = useState<boolean>(true);

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
    const fetchHubLinks = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("hub_links")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (error) {
          console.warn("Supabase fetch error for hub_links:", error.message);
        } else if (data) {
          setLinks(data as HubLink[]);
        }
      } catch (err) {
        console.warn("Error fetching hub links:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHubLinks();
  }, []);

  const categories = ["Semua Penjelajahan", "Panduan & Berkas", "Generator & Tools", "Media & Komunikasi", "Pengumpulan Tugas"];

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
            <span>Pusat Penjelajahan {config.siteName}</span>
          </div>
          
          <div className="flex items-center justify-center space-x-3 mb-2">
            <ImoLogo height={44} className="h-10 md:h-12" />
            <h1 className="text-3xl md:text-5xl font-display font-black tracking-wider text-slate-100">
              {config.hubHeroTitle || "PUSAT PENJELAJAHAN"}
            </h1>
          </div>
          
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {config.hubHeroSubtitle || "Portal pusat navigasi cepat untuk mengakses semua panduan, tools generator, saluran media resmi, dan pusat berkas IMO 2026."}
          </p>
        </div>

        <div className="glass rounded-2xl p-6 mb-10 border border-card-border/40 space-y-4">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder={config.hubSearchPlaceholder || "Cari tautan modul, generator, atau panduan penjelajahan..."}
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
                    ? "bg-accent-cyan text-black font-extrabold shadow-[0_0_15px_rgba(125,249,255,0.4)]"
                    : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-card-border/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
            <p className="font-mono text-sm">Memuat modul penjelajahan...</p>
          </div>
        ) : links.length === 0 ? (
          <Card glowColor="purple" className="text-center py-16 max-w-md mx-auto">
            <Layers className="h-12 w-12 text-accent-purple/50 mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-slate-200 mb-2">Belum Ada Modul Penjelajahan</h3>
            <p className="text-sm text-slate-400 font-sans">
              Saat ini belum ada tautan atau modul penjelajahan yang dipublikasikan oleh admin.
            </p>
          </Card>
        ) : filteredLinks.length === 0 ? (
          <Card glowColor="yellow" className="text-center p-12">
            <Search className="h-10 w-10 text-accent-yellow mx-auto mb-3" />
            <h3 className="font-display font-bold text-slate-100 text-lg">Tidak Ada Modul Ditemukan</h3>
            <p className="text-sm text-slate-400 mt-1 mb-4">
              Tidak ada tautan yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setSelectedCategory("Semua Penjelajahan"); }}>
              Reset Pencarian
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredLinks.map((item, index) => {
                const isInternal = item.url.startsWith("/");

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      glowColor={index % 3 === 0 ? "cyan" : index % 3 === 1 ? "purple" : "yellow"}
                      className="h-full flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-slate-950/80 border border-card-border/60 group-hover:border-accent-cyan/50 group-hover:scale-110 transition duration-300">
                            {renderIcon(item.icon_key)}
                          </div>
                          
                          <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-slate-900 border border-card-border/40 text-slate-300 tracking-wider">
                            {item.category}
                          </span>
                        </div>

                        <h3 className="font-display font-extrabold text-lg text-slate-100 group-hover:text-accent-cyan transition duration-300 mb-2 leading-snug">
                          {item.label}
                        </h3>

                        {item.description && (
                          <p className="text-xs text-slate-400 font-sans leading-relaxed mb-6 line-clamp-3">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-card-border/20 mt-auto">
                        {isInternal ? (
                          <Link
                            href={item.url}
                            className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-accent-cyan hover:text-black border border-card-border/50 hover:border-accent-cyan text-slate-200 text-xs font-bold transition duration-300 flex items-center justify-between group-hover:shadow-[0_0_15px_rgba(125,249,255,0.3)] cursor-pointer touch-manipulation active:scale-[0.98]"
                          >
                            <span>Akses Fitur</span>
                            <Rocket className="h-4 w-4 text-accent-cyan group-hover:text-black transition" />
                          </Link>
                        ) : (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-accent-cyan hover:text-black border border-card-border/50 hover:border-accent-cyan text-slate-200 text-xs font-bold transition duration-300 flex items-center justify-between group-hover:shadow-[0_0_15px_rgba(125,249,255,0.3)] cursor-pointer touch-manipulation active:scale-[0.98]"
                          >
                            <span>Buka Tautan</span>
                            <ExternalLink className="h-4 w-4 text-accent-cyan group-hover:text-black transition opacity-70 group-hover:opacity-100" />
                          </a>
                        )}
                      </div>

                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </main>

      <footer className="w-full py-8 text-center text-xs text-slate-500 font-mono border-t border-card-border/20 mt-16 bg-background/50">
        &copy; {new Date().getFullYear()} IMO 2026. Mission Control Grid Menu.
      </footer>
    </div>
  );
}
