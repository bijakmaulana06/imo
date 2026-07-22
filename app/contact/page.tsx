"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import { createClient } from "@/utils/supabase/client";
import { MessageSquare, Search, AlertCircle, Users, ExternalLink } from "lucide-react";

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

const DEFAULT_CONTACTS: ContactPerson[] = [
  { id: "1", name: "Siti Rahmawati", role: "Pendamping LO", group_name: "Kelompok 1", whatsapp: "081234567890", sort_order: 1 },
  { id: "2", name: "Ahmad Fauzi", role: "Pendamping LO", group_name: "Kelompok 2", whatsapp: "081298765432", sort_order: 2 },
  { id: "3", name: "Budi Pratama", role: "Pendamping LO", group_name: "Kelompok 3", whatsapp: "081311223344", sort_order: 3 },
  { id: "4", name: "Dina Lestari", role: "Pendamping LO", group_name: "Kelompok 4", whatsapp: "081355667788", sort_order: 4 },
  { id: "5", name: "Eko Wijaya", role: "Pendamping LO", group_name: "Kelompok 5", whatsapp: "081399001122", sort_order: 5 },
  { id: "6", name: "Fifi Nurhaliza", role: "Pendamping LO", group_name: "Kelompok 6", whatsapp: "081244556677", sort_order: 6 },
  { id: "7", name: "Gilang Ramadhan", role: "Pendamping LO", group_name: "Kelompok 7", whatsapp: "081288990011", sort_order: 7 },
  { id: "8", name: "Hany Permata", role: "Pendamping LO", group_name: "Kelompok 8", whatsapp: "081322334455", sort_order: 8 },
  { id: "9", name: "Indra Kusuma", role: "Pendamping LO", group_name: "Kelompok 9", whatsapp: "081366778899", sort_order: 9 },
  { id: "10", name: "Jasmine Putri", role: "Pendamping LO", group_name: "Kelompok 10", whatsapp: "081200112233", sort_order: 10 },
];

export default function ContactPage() {
  const supabase = createClient();
  const [contacts, setContacts] = useState<ContactPerson[]>(DEFAULT_CONTACTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchContacts = async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from("contact_persons")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (!fetchErr && data && data.length > 0) {
        setContacts(data);
      }
    } catch (err: any) {
      console.warn("Using default LO contacts due to fetch error:", err);
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
            LO & PENDAMPING KELOMPOK
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto font-sans leading-relaxed">
            Temukan pemandu orbit Anda. Cari berdasarkan nama kelompok atau nama LO untuk menghubungi langsung.
          </p>
        </div>

        <div className="max-w-md mx-auto mb-12 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari kelompok atau nama LO..."
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
        ) : filteredContacts.length === 0 ? (
          <Card glowColor="purple" className="text-center py-16 max-w-md mx-auto">
            <Users className="h-12 w-12 text-accent-purple mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-slate-200 mb-2">LO Tidak Ditemukan</h3>
            <p className="text-sm text-slate-400 font-sans">
              Kelompok atau nama LO &quot;{searchQuery}&quot; belum terdaftar atau tidak ditemukan di server radar kami.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => (
              <Card
                key={contact.id}
                glowColor={contact.role.toUpperCase() === "LO" ? "cyan" : "purple"}
                className="flex flex-col items-center text-center justify-between"
              >
                <div className="flex flex-col items-center">
                  <div className={`relative h-22 w-22 rounded-full overflow-hidden mb-5 border p-0.5 bg-[#020510] ${
                    contact.role.toUpperCase() === "LO" ? "border-accent-cyan/50 shadow-[0_0_20px_rgba(125,249,255,0.2)]" : "border-accent-purple/50 shadow-[0_0_20px_rgba(180,140,255,0.2)]"
                  }`}>
                    {contact.photo_url ? (
                      <img
                        src={contact.photo_url}
                        alt={contact.name}
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-slate-900 rounded-full text-slate-500 font-mono text-xs uppercase">
                        Astro
                      </div>
                    )}
                  </div>

                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${
                    contact.role.toUpperCase() === "LO"
                      ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30"
                      : "bg-accent-purple/10 text-accent-purple border border-accent-purple/30"
                  }`}>
                    {contact.group_name}
                  </span>

                  <h3 className="font-display font-extrabold text-lg text-slate-100 tracking-wide mb-1">
                    {contact.name}
                  </h3>

                  <p className="text-xs text-slate-400 tracking-wider mb-6 uppercase font-mono">
                    {contact.role} Pendamping
                  </p>
                </div>

                <a
                  href={getWhatsAppLink(contact.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                    contact.role.toUpperCase() === "LO"
                      ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan hover:bg-accent-cyan hover:text-black hover:shadow-[0_0_20px_rgba(125,249,255,0.4)]"
                      : "bg-accent-purple/15 text-accent-purple border-accent-purple hover:bg-accent-purple hover:text-black hover:shadow-[0_0_20px_rgba(180,140,255,0.4)]"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Kirim Pesan</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                </a>
              </Card>
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
