"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  ShieldCheck, 
  Camera, 
  Compass, 
  Milestone, 
  Radio, 
  Clock, 
  MapPin, 
  ChevronRight,
  Quote,
  Flame,
  Zap
} from "lucide-react";
import { HomePhotoSlot } from "@/components/SiteConfigProvider";

export function parseGDriveMedia(rawUrl: string) {
  if (!rawUrl) return { isGDrive: false, previewUrl: "", directImgUrl: "" };
  const trimmed = rawUrl.trim();

  // Match file id from various Google Drive URL patterns
  let fileId = "";
  const matchFile = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile && matchFile[1]) {
    fileId = matchFile[1];
  } else {
    const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) {
      fileId = matchId[1];
    } else if (trimmed.includes("drive.google.com") && trimmed.includes("/d/")) {
      const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (matchD && matchD[1]) fileId = matchD[1];
    }
  }

  if (fileId) {
    return {
      isGDrive: true,
      fileId,
      previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      directImgUrl: `https://lh3.googleusercontent.com/d/${fileId}=w1200`,
    };
  }

  return {
    isGDrive: false,
    previewUrl: trimmed,
    directImgUrl: trimmed,
  };
}

interface HomePhotoSpotlightProps {
  slots?: HomePhotoSlot[];
  sectionTitle?: string;
  sectionSubtitle?: string;
}

export default function HomePhotoSpotlight({
  slots = [],
  sectionTitle = "ALUR KISAH PENJELAJAHAN ORBIT",
  sectionSubtitle = "Rekam jejak kronologis dan narasi momentum penjelajahan Mahasiswa Baru IMO 2026 dari awal keberangkatan hingga puncak inovasi.",
}: HomePhotoSpotlightProps) {
  const [useIframeFallback, setUseIframeFallback] = useState<Record<string, boolean>>({});

  if (!slots || slots.length === 0) return null;

  return (
    <section className="w-full relative z-10 py-20 md:py-28 px-4 flex flex-col items-center select-none overflow-hidden font-sans">
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-gradient-to-b from-accent-cyan/10 via-accent-purple/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-accent-yellow/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto flex flex-col items-center relative">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-24 flex flex-col items-center max-w-3xl"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan text-xs font-mono font-bold uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(125,249,255,0.25)] animate-pulse">
            <Milestone className="h-4 w-4" />
            <span>ORBIT STORYLINE CHRONICLES</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-display font-black tracking-wider text-slate-100 uppercase mb-4 drop-shadow-[0_0_25px_rgba(255,255,255,0.35)] leading-tight">
            {sectionTitle}
          </h2>

          <p className="text-slate-400 text-xs md:text-base font-sans max-w-2xl text-center leading-relaxed">
            {sectionSubtitle}
          </p>

          <div className="flex items-center space-x-2 mt-4 text-[11px] font-mono text-accent-cyan/80">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-ping" />
            <span>IKUTI TAHAP PERJALANAN SECARA KRONOLOGIS</span>
          </div>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────────────────────
            STORYLINE TIMELINE CONTAINER (Alternating Zig-Zag with Central Cosmic Spine)
            ───────────────────────────────────────────────────────────────────────────── */}
        <div className="relative w-full">
          
          {/* Vertical Cosmic Timeline Spine (Central Neon Beam on Desktop, Left on Mobile) */}
          <div className="absolute top-8 bottom-8 left-4 md:left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-accent-cyan via-accent-purple to-accent-yellow shadow-[0_0_15px_rgba(125,249,255,0.6)] rounded-full z-0 opacity-60" />

          <div className="space-y-16 md:space-y-24 w-full">
            {slots.map((slot, index) => {
              const media = parseGDriveMedia(slot.gdriveUrl);
              const isIframeMode = useIframeFallback[slot.id || index];
              const isEven = index % 2 === 1; // 0 is odd (left photo), 1 is even (right photo)
              const stepNumber = String(index + 1).padStart(2, "0");

              return (
                <div 
                  key={slot.id || index}
                  className="relative flex flex-col md:flex-row items-center w-full"
                >
                  
                  {/* Central Milestone Orbital Node (Pin checkpoint on timeline) */}
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 top-0 md:top-1/2 md:-translate-y-1/2 z-30 flex items-center justify-center">
                    <motion.div 
                      initial={{ scale: 0.6, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="relative h-12 w-12 rounded-full bg-[#020510] border-2 border-accent-cyan shadow-[0_0_20px_rgba(125,249,255,0.6)] flex items-center justify-center text-accent-cyan font-mono font-black text-xs group cursor-default"
                    >
                      <span className="absolute -inset-1 rounded-full bg-accent-cyan/30 animate-ping opacity-75 pointer-events-none" />
                      <span className="relative z-10">{stepNumber}</span>
                    </motion.div>
                  </div>

                  {/* Desktop Layout: 2 Columns (Left & Right) with Central Spine */}
                  <div className={`w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 pl-14 md:pl-0 items-center ${isEven ? "md:direction-rtl" : ""}`}>
                    
                    {/* ── PHOTO FRAME COLUMN ── */}
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? 40 : -40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`w-full ${isEven ? "md:order-2" : "md:order-1"}`}
                    >
                      <div className="relative group bg-[#04091a]/90 border border-slate-800/90 hover:border-accent-cyan/60 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl transition-all duration-500 hover:shadow-[0_10px_40px_rgba(125,249,255,0.2)]">
                        
                        {/* Photo Display Window with Non-Interactive Shield */}
                        <div className="relative w-full aspect-[16/10] bg-black overflow-hidden select-none">
                          
                          {/* Futuristic HUD Viewfinder Corner Accents */}
                          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-accent-cyan/80 z-30 pointer-events-none" />
                          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-accent-cyan/80 z-30 pointer-events-none" />
                          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-accent-cyan/80 z-30 pointer-events-none" />
                          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-accent-cyan/80 z-30 pointer-events-none" />

                          {/* Top Badge Overlay */}
                          <div className="absolute top-3.5 left-3.5 z-30 pointer-events-none">
                            <span className="px-3 py-1 rounded-md bg-black/80 border border-accent-cyan/40 text-accent-cyan font-mono text-[10px] font-bold tracking-widest uppercase backdrop-blur-md shadow-lg flex items-center space-x-1.5">
                              <Zap className="h-3 w-3 text-accent-cyan animate-pulse" />
                              <span>STORY CHAPTER {stepNumber}</span>
                            </span>
                          </div>

                          {/* Media Content */}
                          {media.isGDrive ? (
                            isIframeMode ? (
                              <iframe
                                src={media.previewUrl}
                                title={slot.title}
                                className="w-full h-full border-0 pointer-events-none select-none scale-[1.03]"
                                loading="lazy"
                                allow="autoplay"
                              />
                            ) : (
                              <img
                                src={media.directImgUrl}
                                alt={slot.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 select-none pointer-events-none"
                                loading="lazy"
                                onError={() => {
                                  setUseIframeFallback((prev) => ({ ...prev, [slot.id || index]: true }));
                                }}
                              />
                            )
                          ) : (
                            <img
                              src={slot.gdriveUrl || "/placeholder.jpg"}
                              alt={slot.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 select-none pointer-events-none"
                              loading="lazy"
                            />
                          )}

                          {/* ─────────────────────────────────────────────────────────────
                              NON-INTERACTIVE GLASS SHIELD (Prevents Popouts & Clicks)
                              ───────────────────────────────────────────────────────────── */}
                          <div 
                            className="absolute inset-0 z-20 bg-transparent cursor-default pointer-events-auto select-none"
                            onContextMenu={(e) => e.preventDefault()}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => e.preventDefault()}
                          />

                          {/* Bottom Ambient Vignette */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#04091a] via-transparent to-transparent opacity-60 pointer-events-none z-10" />
                        </div>

                        {/* Photo Caption Footer Tag */}
                        <div className="px-5 py-3 bg-[#020510]/80 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="flex items-center space-x-1.5 text-slate-300 truncate">
                            <Camera className="h-3.5 w-3.5 text-accent-cyan" />
                            <span className="truncate">{slot.badge || `Momentum Fase 0${index + 1}`}</span>
                          </span>
                          <span className="text-accent-cyan/70 font-bold uppercase tracking-wider flex-shrink-0 ml-2">
                            LENS LOCKED
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* ── STORY NARRATIVE COLUMN ── */}
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                      className={`w-full flex flex-col justify-center space-y-4 ${isEven ? "md:order-1 md:text-right" : "md:order-2 md:text-left"}`}
                    >
                      {/* Story Tag / Phase Badge */}
                      <div className={`flex items-center space-x-2 ${isEven ? "md:justify-end" : "md:justify-start"}`}>
                        <span className="px-3.5 py-1 rounded-full bg-accent-purple/15 border border-accent-purple/40 text-accent-purple text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(180,140,255,0.2)]">
                          {slot.badge || `FASE PERJALANAN 0${index + 1}`}
                        </span>
                      </div>

                      {/* Story Headline */}
                      <h3 className="text-xl md:text-3xl font-display font-bold text-slate-100 tracking-tight leading-snug drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        {slot.title}
                      </h3>

                      {/* Story Description */}
                      <p className="text-slate-300 text-xs md:text-sm font-sans leading-relaxed font-normal">
                        {slot.description}
                      </p>

                      {/* Storyline Telemetry Card */}
                      <div className={`p-4 rounded-2xl bg-black/40 border border-slate-800/80 backdrop-blur-md flex items-center space-x-3 text-xs font-mono text-slate-400 ${isEven ? "md:flex-row-reverse md:space-x-reverse" : ""}`}>
                        <div className="h-8 w-8 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan flex-shrink-0">
                          <Compass className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                            {slot.coordinateLabel || `KOORDINAT ALUR ${stepNumber}`}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {slot.dateTag || "Status: Terverifikasi dalam Babad Penjelajahan IMO 2026"}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
