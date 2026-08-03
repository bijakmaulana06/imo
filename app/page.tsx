"use client";

import React, { useRef, useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import StarfieldBackground from "@/components/StarfieldBackground";
import ImoLogo from "@/components/ImoLogo";
import { Link } from "next-view-transitions";
import { Rocket, Sparkles, BookOpen, Compass, Contact, ArrowRight, ChevronDown, ClipboardCheck, IdCard, FileText } from "lucide-react";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import { motion, useScroll, useTransform } from "framer-motion";

function HomeNodeCard({ node }: { node: any }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <Link href={node.href} className="block group w-full">
      <motion.div 
        ref={cardRef}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          boxShadow: `0 12px 36px ${node.shadowColor}, inset 0 1px 1px rgba(255,255,255,0.3)`,
        }}
        className="relative flex flex-col items-center glass p-5 sm:p-7 md:p-8 rounded-[28px] sm:rounded-[32px] md:rounded-[36px] transition-transform duration-300 text-center cursor-pointer overflow-hidden border border-white/20 backdrop-blur-xl bg-slate-950/80 will-change-transform w-full"
      >
        {/* Specular White Sheen Overlay (Apple Glass Surface) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] via-transparent to-black/[0.3] pointer-events-none rounded-[inherit]" />

        {/* Dynamic Cursor Spotlight Beam (Zero-Re-Render via CSS Variables) */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-0"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.16), ${node.shadowColor} 50%, transparent 80%)`,
          }}
        />

        {/* Dynamic Cursor Border Glow (Zero-Re-Render via CSS Variables) */}
        <div
          className="pointer-events-none absolute -inset-[1px] rounded-[inherit] z-10 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(200px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.85), ${node.shadowColor} 55%, transparent 80%)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />
        
        {/* Icon Container - Apple Squircle */}
        <div className={`h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-[18px] sm:rounded-[22px] ${node.colorClasses.bg} border ${node.colorClasses.border} flex items-center justify-center ${node.colorClasses.text} mb-4 sm:mb-5 shadow-xl relative overflow-hidden group-hover:scale-105 transition-transform duration-300 z-20 backdrop-blur-md`}>
          <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {node.icon}
        </div>
        
        <h3 className="font-display font-bold text-lg sm:text-xl md:text-2xl text-white tracking-tight mb-2 z-20 group-hover:text-accent-cyan transition-colors line-clamp-2 px-1">
          {node.title}
        </h3>
        
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed mb-5 z-20 max-w-[240px] line-clamp-3 px-1">
          {node.desc}
        </p>

        {/* Action Button Pill */}
        <div className={`flex items-center text-[11px] sm:text-xs font-mono font-bold ${node.colorClasses.text} uppercase tracking-wider mt-auto z-20 bg-slate-950/80 backdrop-blur-md px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-white/15 group-hover:border-white/35 group-hover:bg-slate-900/90 shadow-lg transition-all`}>
          <span>Akses Node</span>
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 transform group-hover:translate-x-1.5 transition-transform" />
        </div>
      </motion.div>
    </Link>
  );
}

export default function Home() {
  const { config } = useSiteConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const ALL_NODES: Record<string, any> = {
    guide: {
      id: "guide",
      title: config.guideHeroTitle || "Panduan",
      desc: config.guideHeroSubtitle || "Petunjuk arah dan panduan resmi.",
      href: "/guide",
      icon: <BookOpen className="h-6 w-6" />,
      colorClasses: { border: "border-teal-500/40", bg: "bg-teal-500/15", text: "text-teal-400" },
      shadowColor: "rgba(20,184,166,0.3)",
    },
    hub: {
      id: "hub",
      title: config.hubHeroTitle || "Pusat Penjelajahan",
      desc: config.hubHeroSubtitle || "Navigasi cepat ke semua modul.",
      href: "/hub",
      icon: <Rocket className="h-6 w-6" />,
      colorClasses: { border: "border-blue-500/40", bg: "bg-blue-500/15", text: "text-blue-400" },
      shadowColor: "rgba(59,130,246,0.3)",
    },
    info: {
      id: "info",
      title: config.homeCard1Title || "Summary Tugas",
      desc: config.homeCard1Desc || "Periksa kelengkapan pengumpulan tugas kelompok Anda secara real-time.",
      href: "/info",
      icon: <ClipboardCheck className="h-6 w-6" />,
      colorClasses: { border: "border-accent-cyan/40", bg: "bg-accent-cyan/15", text: "text-accent-cyan" },
      shadowColor: "rgba(125,249,255,0.3)",
    },
    idcard: {
      id: "idcard",
      title: config.homeCard2Title || "ID Card Generator",
      desc: config.homeCard2Desc || "Kustomisasi & unduh tanda pengenal resmi IMO 2026.",
      href: "/id-card",
      icon: <IdCard className="h-6 w-6" />,
      colorClasses: { border: "border-accent-purple/40", bg: "bg-accent-purple/15", text: "text-accent-purple" },
      shadowColor: "rgba(180,140,255,0.3)",
    },
    documents: {
      id: "documents",
      title: config.documentsHeroTitle || "Auto-Form",
      desc: config.documentsHeroSubtitle || "Isi formulir online dan buat dokumen PDF.",
      href: "/documents",
      icon: <FileText className="h-6 w-6" />,
      colorClasses: { border: "border-rose-500/40", bg: "bg-rose-500/15", text: "text-rose-400" },
      shadowColor: "rgba(244,63,94,0.3)",
    },
    contact: {
      id: "contact",
      title: config.homeCard3Title || "Hubungi LO",
      desc: config.homeCard3Desc || "Hubungi LO/Pendamping kelompok Anda secara langsung.",
      href: "/contact",
      icon: <Contact className="h-6 w-6" />,
      colorClasses: { border: "border-accent-yellow/40", bg: "bg-accent-yellow/15", text: "text-accent-yellow" },
      shadowColor: "rgba(255,209,102,0.3)",
    },
  };

  const orderArray = config.homeNodesOrder || ["guide", "hub", "info", "idcard", "documents", "contact"];
  
  const dynamicNodes = orderArray.map((id, index) => {
    const nodeDef = ALL_NODES[id];
    if (!nodeDef) return null;
    const x = isMobile ? ((index % 2 === 0) ? 42 : 58) : ((index % 2 === 0) ? 25 : 75);
    const totalNodes = orderArray.length;
    const ySpacing = totalNodes > 1 ? 85 / (totalNodes - 1) : 0;
    const y = 8 + (index * ySpacing);
    return { ...nodeDef, x, y, delay: index * 0.1 };
  }).filter(Boolean);

  const svgPathD = dynamicNodes.length > 0 
    ? `M ${dynamicNodes.map(n => `${n.x} ${n.y}`).join(" L ")}`
    : "";

  return (
    <div className="relative min-h-screen flex flex-col z-0 overflow-x-hidden bg-[#020510] text-slate-100 font-sans">
      {/* Three.js Photorealistic 3D Galaxy Background (UNTOUCHED AS REQUESTED) */}
      {config.enableStarfield && <StarfieldBackground />}

      {/* Sticky Navbar */}
      <Navbar />

      {/* Main Hero & Welcome (Full Screen) */}
      <main className="w-full relative z-10">
        
        {/* Section 1: Hero */}
        <section className="min-h-screen flex flex-col items-center justify-center pt-20 px-4 w-full relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center text-center z-20 pointer-events-none w-full max-w-4xl"
          >
            {/* Mission Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(125,249,255,0.2)]">
              <Sparkles className="h-4.5 w-4.5" />
              <span>{config.homeMissionBadge || "Innovative Minds Outclass"}</span>
            </div>

            {/* Main Welcome Heading */}
            <h1 className="text-4xl md:text-7xl font-display font-bold tracking-tight mb-4 leading-tight flex flex-col items-center">
              <span className="text-2xl md:text-4xl text-slate-300 font-display uppercase tracking-widest mb-2">
                SELAMAT DATANG DI
              </span>
              <div className="flex items-center justify-center space-x-4 my-3">
                <ImoLogo height={110} className="h-20 md:h-32 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                <span className="text-accent-cyan font-display font-bold text-5xl md:text-8xl glow-text-cyan tracking-tight">
                  {config.siteYear || "2026"}
                </span>
              </div>
            </h1>

            {/* Sub-tagline from Brand Guidelines */}
            <p className="text-accent-cyan font-display text-sm md:text-base font-semibold italic tracking-wider mb-6 glow-text-cyan">
              {config.homeTagline || '"Different Minds, Different Stories, One Generation Chasing Glories."'}
            </p>
            
            {/* Tagline */}
            <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10 font-sans">
              {config.homeDescription || "Persiapkan diri Anda untuk lepas landas! Ini adalah portal penjelajahan resmi bagi seluruh Mahasiswa Baru. Jelajahi node navigasi di bawah ini untuk memulai misi Anda."}
            </p>

            <div className="pointer-events-auto">
              <Link href="/hub" className="inline-block">
                <motion.button 
                  whileHover={{ scale: 1.03, boxShadow: "0 8px 30px rgba(125,249,255,0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 bg-white/15 border border-white/25 text-accent-cyan px-8 py-4 rounded-full font-semibold font-sans tracking-wide transition-all duration-300 hover:bg-white/20 apple-glass shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] cursor-pointer"
                >
                  <span>{config.homeCtaLabel || "Mulai Penjelajahan"}</span>
                  <Rocket className="h-5 w-5 ml-2" />
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-slate-400 flex flex-col items-center pointer-events-none"
          >
            <span className="text-xs font-mono uppercase tracking-widest mb-2">Scroll ke Bawah</span>
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </section>

        {/* Section 2: Constellation / Node Graph Map */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative">
          <motion.div 
            ref={containerRef}
            style={{ y: yParallax }}
            className="relative w-full max-w-5xl h-[1200px] md:h-[1500px] will-change-transform"
          >
            {/* Connecting SVG Lines (Constellation lines) */}
            <svg 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none" 
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0"
            >
              <motion.path 
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-150px" }}
                transition={{ duration: 2, ease: "easeInOut", delay: 0.1 }}
                d={svgPathD} 
                stroke="url(#constellation-gradient)" 
                strokeWidth="0.15" 
                fill="none" 
                strokeDasharray="0.5, 1" 
              />
              <defs>
                <linearGradient id="constellation-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7df9ff" />
                  <stop offset="50%" stopColor="#b48cff" />
                  <stop offset="100%" stopColor="#ff71ce" />
                </linearGradient>
              </defs>
            </svg>

            {/* Render Nodes */}
            {dynamicNodes.map((node: any, i: number) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ 
                  duration: 0.5, 
                  delay: node.delay, 
                  ease: "easeOut"
                }}
                className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-[270px] sm:max-w-[300px] will-change-transform"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <HomeNodeCard node={node} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      <footer className="w-full py-8 text-center text-xs text-slate-400 font-mono border-t border-white/10 bg-background/50 backdrop-blur-md relative z-10 mt-auto">
        &copy; {config.siteYear || "2026"} {config.siteName || "IMO 2026"}. {config.footerText || "Made with Astro-Physics & Next.js."}
      </footer>
    </div>
  );
}


