"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import { createClient } from "@/utils/supabase/client";
import { Search, AlertCircle, Users, ExternalLink } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
    </svg>
  );
}
import { useSiteConfig } from "@/components/SiteConfigProvider";

interface ContactPerson {
  id: string;
  name: string;
  role: string;
  group_name: string;
  whatsapp: string;
  instagram?: string;
  photo_url?: string;
  sort_order: number;
}

export default function ContactPage() {
  const { config } = useSiteConfig();
  const supabase = createClient();
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from("contact_persons")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (!fetchErr && data) {
        setContacts(data);
      }
    } catch (err: any) {
      console.warn("Error fetching LO contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.group_name.toLowerCase().includes(searchLower) ||
      contact.name.toLowerCase().includes(searchLower) ||
      contact.role.toLowerCase().includes(searchLower)
    );
  });

  const getWhatsAppLink = (num: string) => {
    let cleaned = num.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    return `https://wa.me/${cleaned}`;
  };

  return (
    <div className="relative min-h-screen flex flex-col z-0 bg-[#020510]">
      <StarfieldBackground />
      <Navbar />

      <main className="flex-grow py-12 px-4 max-w-6xl mx-auto w-full relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-wider bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-cyan bg-clip-text text-transparent mb-4">
            {config.contactHeroTitle || "KONTAK"}
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto font-sans leading-relaxed">
            {config.contactHeroSubtitle || "Temukan pemandu orbit Anda. Cari berdasarkan nama kelompok atau nama pendamping untuk menghubungi langsung."}
          </p>
        </div>

        <div className="max-w-md mx-auto mb-12 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari kelompok atau nama kontak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950/80 border border-card-border/50 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-accent-cyan/60 transition-all font-sans"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass rounded-2xl p-6 animate-pulse flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-slate-800 mb-4" />
                <div className="h-5 bg-slate-800 rounded-md w-2/3 mb-2" />
                <div className="h-4 bg-slate-800 rounded-md w-1/2 mb-4" />
                <div className="h-10 bg-slate-800 rounded-full w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Card glowColor="yellow" className="text-center p-8 max-w-md mx-auto">
            <AlertCircle className="h-10 w-10 text-accent-yellow mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-slate-100 mb-2">Sinyal Pemandu Terputus</h3>
            <p className="text-sm text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchContacts}
              className="px-5 py-2 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan text-accent-cyan text-xs font-bold rounded-full uppercase tracking-wider transition"
            >
              Coba Lagi
            </button>
          </Card>
        ) : contacts.length === 0 ? (
          <Card glowColor="purple" className="text-center py-16 max-w-md mx-auto">
            <Users className="h-12 w-12 text-accent-purple/50 mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-slate-200 mb-2">Belum Ada Kontak</h3>
            <p className="text-sm text-slate-400 font-sans">
              Saat ini belum ada data kontak atau pendamping kelompok yang ditambahkan oleh panitia.
            </p>
          </Card>
        ) : filteredContacts.length === 0 ? (
          <Card glowColor="purple" className="text-center py-16 max-w-md mx-auto">
            <Users className="h-12 w-12 text-accent-purple mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-slate-200 mb-2">Kontak Tidak Ditemukan</h3>
            <p className="text-sm text-slate-400 font-sans">
              Kelompok atau nama kontak &quot;{searchQuery}&quot; tidak ditemukan dalam daftar radar kami.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="group relative rounded-[32px] p-6 sm:p-7 flex flex-col items-center text-center justify-between transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-white/[0.14] hover:border-white/[0.28] backdrop-blur-2xl bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/[0.45] shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.45)] will-change-transform"
              >
                {/* Specular Apple Glass Sheen Reflection */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] via-transparent to-transparent pointer-events-none rounded-[32px]" />

                {/* Subtle Ambient Radial Light */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-44 h-44 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none group-hover:bg-accent-cyan/15 transition-all duration-500" />

                <div className="flex flex-col items-center relative z-10 w-full">
                  {/* Apple-style Circular Avatar */}
                  <div className="relative mb-4 group-hover:scale-105 transition-transform duration-300">
                    <div className="relative h-24 w-24 rounded-full overflow-hidden p-1 bg-gradient-to-b from-white/30 via-white/10 to-white/5 shadow-[0_8px_25px_rgba(0,0,0,0.5)] ring-1 ring-white/20">
                      {contact.photo_url ? (
                        <img
                          src={contact.photo_url}
                          alt={contact.name}
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 rounded-full text-slate-400 font-mono text-xs uppercase tracking-wider">
                          <Users className="w-6 h-6 text-slate-500 mb-0.5" />
                          <span>Astro</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Refined Apple-style Pill Badge */}
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wider uppercase mb-3 bg-white/[0.07] border border-white/[0.14] text-slate-200 shadow-sm backdrop-blur-md">
                    {contact.group_name}
                  </span>

                  {/* Name & Role */}
                  <h3 className="font-display font-extrabold text-xl text-white tracking-wide mb-1">
                    {contact.name}
                  </h3>

                  <p className="text-[11px] text-slate-400 font-mono tracking-widest uppercase mb-6">
                    {contact.role}
                  </p>
                </div>

                {/* Actions: WhatsApp & Instagram Buttons */}
                <div className="w-full space-y-2.5 mt-auto relative z-10">
                  {/* WhatsApp Button with Official Theme & Logo */}
                  <a
                    href={getWhatsAppLink(contact.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2.5 py-3 rounded-2xl font-sans text-xs font-bold tracking-wide transition-all duration-300 bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-black border border-[#25D366]/40 hover:border-[#25D366] shadow-[0_4px_16px_rgba(37,211,102,0.15)] hover:shadow-[0_8px_25px_rgba(37,211,102,0.45)] group/wa cursor-pointer"
                  >
                    <WhatsAppIcon className="h-4.5 w-4.5 text-[#25D366] group-hover/wa:text-black transition-colors" />
                    <span>WhatsApp</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover/wa:opacity-100 transition-opacity ml-0.5" />
                  </a>

                  {/* Instagram Button */}
                  {contact.instagram && contact.instagram.trim() && (
                    <a
                      href={`https://instagram.com/${contact.instagram.replace(/^@/, "").trim()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center space-x-2.5 py-2.5 rounded-2xl font-sans text-xs font-bold tracking-wide transition-all duration-300 bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-amber-500/15 hover:from-purple-600 hover:via-pink-600 hover:to-amber-500 text-pink-300 hover:text-white border border-pink-500/35 hover:border-transparent shadow-[0_4px_16px_rgba(236,72,153,0.15)] hover:shadow-[0_8px_25px_rgba(236,72,153,0.45)] group/ig cursor-pointer"
                    >
                      <InstagramIcon className="h-4 w-4 text-pink-400 group-hover/ig:text-white transition-colors flex-shrink-0" />
                      <span className="truncate">@{contact.instagram.replace(/^@/, "").trim()}</span>
                      <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover/ig:opacity-100 transition-opacity ml-0.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      <footer className="w-full py-8 text-center text-xs text-slate-500 font-mono border-t border-card-border/20 mt-16 bg-background/50">
        &copy; {new Date().getFullYear()} IMO 2026. Navigational Uplink Center.
      </footer>
    </div>
  );
}
