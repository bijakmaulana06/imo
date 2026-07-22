"use client";

import React, { useState, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ImoLogo from "@/components/ImoLogo";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import {
  Download,
  Upload,
  User,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Palette,
  CreditCard,
  Image as ImageIcon,
} from "lucide-react";

type ColorTheme = "cyan" | "purple" | "gold" | "emerald";

export default function IdCardGeneratorPage() {
  const [fullName, setFullName] = useState<string>("Budi Santoso");
  const [nim, setNim] = useState<string>("2026010042");
  const [group, setGroup] = useState<string>("Kelompok 1");
  const [major, setMajor] = useState<string>("Informatika / STEI");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [colorTheme, setColorTheme] = useState<ColorTheme>("cyan");
  const [showHologram, setShowHologram] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran foto maksimal 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExportPng = useCallback(async () => {
    if (!cardRef.current) return;
    setIsExporting(true);

    try {
      await new Promise((res) => setTimeout(res, 200));

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 0.95,
        skipFonts: true,
      });

      const link = document.createElement("a");
      const safeName = fullName.trim().replace(/[^a-zA-Z0-9]/g, "_") || "IMO_Participant";
      link.download = `ID_CARD_IMO2026_${safeName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Gagal mengunduh ID Card secara otomatis. Silakan ambil tangkapan layar (screenshot) kartu identitas Anda.");
    } finally {
      setIsExporting(false);
    }
  }, [fullName]);

  const themeStyles = {
    cyan: {
      border: "border-accent-cyan/60",
      glow: "shadow-[0_0_40px_rgba(125,249,255,0.3)]",
      badgeBg: "bg-accent-cyan/15 border-accent-cyan/40 text-accent-cyan",
      textGlow: "glow-text-cyan text-accent-cyan",
      gradient: "from-accent-cyan/20 via-slate-950 to-slate-950",
      accentBg: "bg-accent-cyan text-black",
    },
    purple: {
      border: "border-accent-purple/60",
      glow: "shadow-[0_0_40px_rgba(180,140,255,0.3)]",
      badgeBg: "bg-accent-purple/15 border-accent-purple/40 text-accent-purple",
      textGlow: "glow-text-purple text-accent-purple",
      gradient: "from-accent-purple/20 via-slate-950 to-slate-950",
      accentBg: "bg-accent-purple text-black",
    },
    gold: {
      border: "border-accent-yellow/60",
      glow: "shadow-[0_0_40px_rgba(255,209,102,0.3)]",
      badgeBg: "bg-accent-yellow/15 border-accent-yellow/40 text-accent-yellow",
      textGlow: "glow-text-yellow text-accent-yellow",
      gradient: "from-accent-yellow/20 via-slate-950 to-slate-950",
      accentBg: "bg-accent-yellow text-black",
    },
    emerald: {
      border: "border-emerald-500/60",
      glow: "shadow-[0_0_40px_rgba(16,185,129,0.3)]",
      badgeBg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
      textGlow: "text-emerald-400",
      gradient: "from-emerald-500/20 via-slate-950 to-slate-950",
      accentBg: "bg-emerald-400 text-black",
    },
  };

  const currentTheme = themeStyles[colorTheme];

  const qrPayload = JSON.stringify({
    org: "IMO 2026",
    name: fullName,
    nim: nim,
    group: group,
    hash: `IMO-${nim}-${group.replace(/\s+/g, "")}`,
  });

  return (
    <div className="relative min-h-screen flex flex-col z-0 overflow-hidden bg-[#020510] text-slate-100 font-sans">
      <StarfieldBackground />
      <Navbar />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-12 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full border border-accent-cyan/30 bg-accent-cyan/5 text-accent-cyan text-xs font-bold uppercase tracking-wider mb-4">
            <CreditCard className="h-4 w-4" />
            <span>100% Client-Side Engine</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black tracking-wider text-slate-100 mb-3">
            ID CARD GENERATOR
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Buat & kustomisasi Kartu Identitas Resmi IMO 2026 secara instan. Pemrosesan dilakukan **100% di perangkat Anda** tanpa mengunggah berkas ke server.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-6">
            <Card glowColor="purple">
              <h3 className="font-display font-bold text-lg text-slate-100 mb-4 flex items-center space-x-2 border-b border-card-border/30 pb-3">
                <User className="h-5 w-5 text-accent-cyan" />
                <span>Informasi Peserta</span>
              </h3>

              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-slate-400 uppercase font-mono tracking-wider mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-card-border/50 text-slate-100 text-sm focus:outline-none focus:border-accent-cyan/60"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-mono tracking-wider mb-1.5">
                    NIM / Nomor Peserta
                  </label>
                  <input
                    type="text"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    placeholder="Contoh: 2026010042"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-card-border/50 text-slate-100 text-sm focus:outline-none focus:border-accent-cyan/60 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase font-mono tracking-wider mb-1.5">
                      Kelompok
                    </label>
                    <select
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-card-border/50 text-slate-100 text-sm focus:outline-none focus:border-accent-cyan/60"
                    >
                      {[...Array(20)].map((_, i) => (
                        <option key={i} value={`Kelompok ${i + 1}`}>
                          Kelompok {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase font-mono tracking-wider mb-1.5">
                      Program Studi / Fakultas
                    </label>
                    <input
                      type="text"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="Contoh: Informatika"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-card-border/50 text-slate-100 text-sm focus:outline-none focus:border-accent-cyan/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-mono tracking-wider mb-1.5">
                    Foto Profil (Maks. 5MB)
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex-grow flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-950 border border-dashed border-card-border/60 hover:border-accent-cyan text-slate-300 text-xs font-semibold cursor-pointer transition">
                      <Upload className="h-4 w-4 text-accent-cyan" />
                      <span>{photoUrl ? "Ganti Foto Profil" : "Unggah Foto dari Perangkat"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    {photoUrl && (
                      <button
                        onClick={() => setPhotoUrl(null)}
                        className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold hover:bg-rose-500 hover:text-white transition"
                        title="Hapus foto"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card glowColor="cyan">
              <h3 className="font-display font-bold text-lg text-slate-100 mb-4 flex items-center space-x-2 border-b border-card-border/30 pb-3">
                <Palette className="h-5 w-5 text-accent-purple" />
                <span>Kustomisasi Tampilan</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 uppercase font-mono tracking-wider mb-2">
                    Skema Warna Kartu:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "cyan", label: "Cyan Neon", color: "bg-accent-cyan" },
                      { id: "purple", label: "Nebula Purple", color: "bg-accent-purple" },
                      { id: "gold", label: "Gold Horizon", color: "bg-accent-yellow" },
                      { id: "emerald", label: "Emerald Cyber", color: "bg-emerald-400" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setColorTheme(t.id as ColorTheme)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition cursor-pointer ${
                          colorTheme === t.id
                            ? "border-accent-cyan bg-slate-900 shadow-[0_0_15px_rgba(125,249,255,0.3)]"
                            : "border-card-border/40 bg-slate-950/60 hover:bg-slate-900"
                        }`}
                      >
                        <div className={`h-4 w-4 rounded-full ${t.color} mb-1.5`} />
                        <span className="text-[10px] text-slate-300 font-mono">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="font-bold text-slate-200 block">Stempel Hologram IMO</span>
                    <span className="text-[11px] text-slate-400">Tampilkan efek watermark hologram otentikasi.</span>
                  </div>
                  <button
                    onClick={() => setShowHologram(!showHologram)}
                    className={`w-12 h-6 rounded-full p-1 transition duration-300 cursor-pointer ${
                      showHologram ? "bg-accent-cyan" : "bg-slate-800"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-slate-950 transition transform ${
                        showHologram ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-6 flex flex-col items-center space-y-6">
            <div className="w-full flex items-center justify-between px-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                <Sparkles className="h-4 w-4 text-accent-cyan" />
                <span>Pratinjau Kartu Real-Time</span>
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Ready to Render
              </span>
            </div>

            <div className="w-full flex justify-center overflow-x-auto p-2">
              <div
                ref={cardRef}
                className={`relative w-[340px] sm:w-[380px] h-[580px] sm:h-[620px] rounded-3xl bg-slate-950 border-2 ${currentTheme.border} ${currentTheme.glow} ${currentTheme.gradient} bg-gradient-to-b flex flex-col justify-between p-6 overflow-hidden select-none shadow-2xl transition-all duration-300`}
              >
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                {showHologram && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(125,249,255,0.1),transparent_60%)] pointer-events-none flex items-center justify-center">
                    <div className="opacity-10 rotate-45 select-none pointer-events-none text-center">
                      <ShieldCheck className="h-48 w-48 text-accent-cyan mx-auto mb-2" />
                      <span className="font-display font-black text-2xl tracking-widest text-slate-100 uppercase">
                        OFFICIAL PARTICIPANT
                      </span>
                    </div>
                  </div>
                )}

                <div className="relative z-10 flex items-center justify-between border-b border-card-border/40 pb-4">
                  <div className="flex items-center space-x-2">
                    <ImoLogo height={32} />
                    <span className="font-display font-extrabold text-accent-purple text-base">2026</span>
                  </div>
                  <span className={`text-[9px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-full border ${currentTheme.badgeBg}`}>
                    MEMBER PASS
                  </span>
                </div>

                <div className="relative z-10 my-auto flex flex-col items-center text-center py-2">
                  <div className={`relative h-28 w-28 sm:h-32 sm:w-32 rounded-2xl p-1 bg-slate-900 border-2 ${currentTheme.border} shadow-[0_0_25px_rgba(0,0,0,0.8)] overflow-hidden mb-4`}>
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Foto Profil"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-600">
                        <ImageIcon className="h-10 w-10 mb-1 opacity-50" />
                        <span className="text-[10px] font-mono">Belum ada foto</span>
                      </div>
                    )}
                    
                    <div className="absolute bottom-1 right-1 p-1 rounded-full bg-slate-950 border border-accent-cyan/60 text-accent-cyan shadow-md">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <h2 className="font-display font-black text-lg sm:text-xl text-slate-100 tracking-wide uppercase leading-snug line-clamp-1">
                    {fullName || "NAMA PESERTA"}
                  </h2>
                  <p className="text-xs font-mono font-bold text-slate-400 tracking-wider mb-2">
                    NIM: {nim || "2026000000"}
                  </p>

                  <div className="flex flex-wrap gap-1.5 justify-center">
                    <span className={`text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border ${currentTheme.badgeBg}`}>
                      {group}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300">
                      {major || "Program Studi"}
                    </span>
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-card-border/40 flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-card-border/30">
                  <div className="text-left space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">AUTHENTICATION</span>
                    <span className="text-[10px] font-mono font-bold text-accent-cyan block">IMO-VERIFIED-PASS</span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase block">IMO 2026 OFFICIAL BADGE</span>
                  </div>

                  <div className="p-1.5 rounded-xl bg-white border border-slate-700 shadow-md">
                    <QRCodeSVG
                      value={qrPayload}
                      size={54}
                      bgColor={"#FFFFFF"}
                      fgColor={"#050810"}
                      level={"M"}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full max-w-[380px]">
              <button
                onClick={handleExportPng}
                disabled={isExporting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-cyan hover:opacity-95 text-black font-display font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(125,249,255,0.4)] transition duration-300 flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Merekam Gambar (100% Client)...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    <span>Unduh ID Card (High-Res PNG)</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center font-mono mt-2">
                *Diproses 100% di browser Anda (Android Chrome & iOS Safari Support).
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-8 text-center text-xs text-slate-500 font-mono border-t border-card-border/20 mt-16 bg-background/50">
        &copy; {new Date().getFullYear()} IMO 2026. Client-Side ID Card Engine.
      </footer>
    </div>
  );
}
