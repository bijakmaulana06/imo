"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import StarfieldBackground from "@/components/StarfieldBackground";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ImoLogo from "@/components/ImoLogo";
import Link from "next/link";
import { Rocket, Sparkles, BookOpen, Compass, Contact, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col z-0 overflow-hidden bg-[#020510] text-slate-100 font-sans">
      {/* Three.js Photorealistic 3D Galaxy Background */}
      <StarfieldBackground />

      {/* Sticky Navbar */}
      <Navbar />

      {/* Main Hero & Welcome */}
      <main className="flex-grow flex flex-col items-center justify-center py-12 md:py-16 px-4 max-w-6xl mx-auto w-full relative z-10">
        
        {/* Mission Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(125,249,255,0.2)] animate-pulse">
          <Sparkles className="h-4.5 w-4.5" />
          <span>Innovative Minds Outclass</span>
        </div>

        {/* Main Welcome Heading */}
        <h1 className="text-4xl md:text-7xl font-display font-extrabold tracking-wider text-center mb-4 leading-tight flex flex-col items-center justify-center">
          <span className="text-2xl md:text-4xl text-slate-300 font-display uppercase tracking-widest mb-2 block">
            SELAMAT DATANG DI
          </span>
          <div className="flex items-center justify-center space-x-4 my-3">
            <ImoLogo height={110} className="h-20 md:h-32 filter drop-shadow-[0_0_25px_rgba(255,255,255,1)]" />
            <span className="text-accent-cyan font-display font-black text-5xl md:text-8xl glow-text-cyan filter drop-shadow-[0_0_35px_rgba(125,249,255,0.9)] tracking-wider">
              2026
            </span>
          </div>
        </h1>

        {/* Sub-tagline from Brand Guidelines */}
        <p className="text-accent-cyan font-display text-sm md:text-base font-semibold italic tracking-wider text-center mb-6 glow-text-cyan">
          &ldquo;Different Minds, Different Stories, One Generation Chasing Glories.&rdquo;
        </p>

        {/* Tagline */}
        <p className="text-slate-300 text-center text-base md:text-lg max-w-3xl mx-auto leading-relaxed mb-10 font-sans">
          Persiapkan diri Anda untuk lepas landas! Ini adalah portal penjelajahan resmi bagi seluruh Mahasiswa Baru. Temukan semua petunjuk arah, jadwal navigasi, dan koordinat LO Anda di sini.
        </p>

        {/* CTAs */}
        <div className="flex justify-center mb-16">
          <Button href="/hub" variant="primary" size="lg" className="shadow-[0_0_35px_rgba(125,249,255,0.5)]">
            <span>Mulai Penjelajahan</span>
            <Rocket className="h-4.5 w-4.5 ml-2" />
          </Button>
        </div>

        {/* Feature Showcase Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full">
          <Link href="/info" className="block">
            <Card glowColor="cyan" className="h-full flex flex-col justify-between cursor-pointer">
              <div>
                <div className="h-12 w-12 rounded-xl bg-accent-cyan/15 border border-accent-cyan/40 flex items-center justify-center text-accent-cyan mb-5 shadow-[0_0_15px_rgba(125,249,255,0.3)]">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="font-display font-extrabold text-xl text-slate-100 tracking-wide mb-3">
                  Summary Tugas Kelompok
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6 font-sans">
                  Periksa kelengkapan pengumpulan tugas kelompok Anda yang terverifikasi otomatis dari repositori Google Drive IMO 2026.
                </p>
              </div>
              <div className="flex items-center text-xs font-mono font-bold text-accent-cyan uppercase tracking-wider group mt-auto">
                <span>Cek Status Tugas</span>
                <ArrowRight className="h-4 w-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/id-card" className="block">
            <Card glowColor="purple" className="h-full flex flex-col justify-between cursor-pointer">
              <div>
                <div className="h-12 w-12 rounded-xl bg-accent-purple/15 border border-accent-purple/40 flex items-center justify-center text-accent-purple mb-5 shadow-[0_0_15px_rgba(180,140,255,0.3)]">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="font-display font-extrabold text-xl text-slate-100 tracking-wide mb-3">
                  ID Card Generator
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6 font-sans">
                  Kustomisasi & unduh tanda pengenal resmi IMO 2026. Diproses instan murni pada perangkat Android/iOS Anda untuk menjaga keamanan data.
                </p>
              </div>
              <div className="flex items-center text-xs font-mono font-bold text-accent-purple uppercase tracking-wider group mt-auto">
                <span>Generate Sekarang</span>
                <ArrowRight className="h-4 w-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/contact" className="block">
            <Card glowColor="yellow" className="h-full flex flex-col justify-between cursor-pointer">
              <div>
                <div className="h-12 w-12 rounded-xl bg-accent-yellow/15 border border-accent-yellow/40 flex items-center justify-center text-accent-yellow mb-5 shadow-[0_0_15px_rgba(255,209,102,0.3)]">
                  <Contact className="h-6 w-6" />
                </div>
                <h3 className="font-display font-extrabold text-xl text-slate-100 tracking-wide mb-3">
                  Hubungi LO
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6 font-sans">
                  Kehilangan arah dalam perjalanan luar angkasa ini? Hubungi LO/Pendamping kelompok Anda secara langsung melalui satu tombol WhatsApp.
                </p>
              </div>
              <div className="flex items-center text-xs font-mono font-bold text-accent-yellow uppercase tracking-wider group mt-auto">
                <span>Cari LO</span>
                <ArrowRight className="h-4 w-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        </div>

      </main>

      <footer className="w-full py-8 text-center text-xs text-slate-500 font-mono border-t border-card-border/20 mt-16 bg-background/50 relative z-10">
        &copy; {new Date().getFullYear()} IMO 2026. Made with Astro-Physics & Next.js.
      </footer>
    </div>
  );
}
