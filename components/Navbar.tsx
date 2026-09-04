"use client";

import React, { useState, useRef } from "react";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Rocket,
  BookOpen,
  Compass,
  CheckCircle2,
  QrCode,
  FileEdit,
  Users,
  Lock
} from "lucide-react";
import ImoLogo from "./ImoLogo";
import { useSiteConfig } from "@/components/SiteConfigProvider";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { config } = useSiteConfig();

  // Optimized Zero-Re-render Mouse Spotlight
  const navRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    navRef.current.style.setProperty("--mouse-x", `${x}px`);
    navRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  const navigation = [
    { name: "Panduan", label: "Panduan & Artikel", href: "/guide", icon: BookOpen },
    { name: "Penjelajahan", label: "Pusat Hub", href: "/hub", icon: Compass },
    { name: "Status Tugas", label: "Scanner Drive", href: "/info", icon: CheckCircle2 },
    { name: "ID Card", label: "Generator Card", href: "/id-card", icon: QrCode },
    { name: "Auto Form", label: "Doc Generator", href: "/documents", icon: FileEdit },
    { name: "Kontak", label: "Pendamping", href: "/contact", icon: Users },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="sticky top-4 md:top-6 z-[100] w-full px-4 sm:px-6 lg:px-8 pointer-events-none flex justify-center">
      <nav 
        ref={navRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-full max-w-5xl rounded-full touch-manipulation select-none pointer-events-auto transition-transform duration-300 overflow-hidden border border-white/20 backdrop-blur-xl bg-slate-950/75 shadow-[0_12px_32px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)] will-change-transform"
      >
        {/* Apple Glass Specular Top Sheen */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] via-transparent to-black/[0.2] pointer-events-none rounded-full" />

        {/* Dynamic Cursor Spotlight Beam (Zero-Re-Render via CSS Variables) */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300 z-0"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(320px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.16), rgba(125, 249, 255, 0.08) 40%, transparent 80%)`,
          }}
        />

        {/* Dynamic Cursor Border Glow (Zero-Re-Render via CSS Variables) */}
        <div
          className="pointer-events-none absolute -inset-[1px] rounded-full z-10 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(200px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.8), rgba(125, 249, 255, 0.5) 40%, transparent 80%)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />

        <div className="mx-auto px-4 sm:px-6 relative z-20">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Brand */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2.5 group touch-manipulation">
                <div className="p-1.5 rounded-xl bg-accent-cyan/10 border border-accent-cyan/40 group-hover:border-accent-cyan group-hover:shadow-[0_0_20px_rgba(125,249,255,0.6)] transition duration-300 backdrop-blur-md">
                  <Rocket className="h-5 w-5 text-accent-cyan group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <div className="flex items-center space-x-2">
                  <ImoLogo height={38} className="h-8 md:h-9 filter drop-shadow-[0_0_15px_rgba(255,255,255,1)]" />
                  <span className="font-display font-semibold text-accent-purple text-base md:text-lg tracking-tight glow-text-purple">
                    {config.siteYear || "2026"}
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const isLocked = config.lockedPages?.some((p) => {
                  if (!p.isLocked || !p.path) return false;
                  const target = p.path.trim().toLowerCase();
                  const current = item.href.toLowerCase();
                  return current === target || current.startsWith(target + "/");
                });

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-300 cursor-pointer border ${
                      active
                        ? "bg-white/20 border-white/30 text-accent-cyan shadow-[0_4px_16px_rgba(125,249,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] glow-text-cyan scale-[1.03]"
                        : "border-transparent text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 hover:shadow-[0_4px_12px_rgba(255,255,255,0.08)]"
                    }`}
                  >
                    {isLocked && (
                      <span className="absolute top-1 right-2 flex h-2 w-2" title="Sektor Terkunci">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]"></span>
                      </span>
                    )}
                    <Icon
                      className={`h-4.5 w-4.5 transition-all duration-300 group-hover:scale-110 ${
                        active ? "text-accent-cyan drop-shadow-[0_0_10px_rgba(125,249,255,0.9)]" : isLocked ? "text-rose-300/80 group-hover:text-rose-300" : "text-slate-300 group-hover:text-accent-cyan"
                      }`}
                    />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider mt-0.5 flex items-center space-x-1">
                      <span>{item.name}</span>
                      {isLocked && <Lock className="h-2.5 w-2.5 text-rose-400 inline" />}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="inline-flex items-center justify-center p-2 rounded-2xl text-slate-200 hover:text-accent-cyan hover:bg-white/10 active:bg-white/20 focus:outline-none transition-colors border border-white/20 touch-manipulation cursor-pointer z-50 backdrop-blur-md"
                aria-label="Main menu"
              >
                {isOpen ? <X className="h-5 w-5 text-accent-cyan" /> : <Menu className="h-5 w-5 text-slate-200" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isOpen && (
          <div className="md:hidden relative z-[110] border-t border-white/20 animate-in slide-in-from-top duration-300">
            <div className="p-4 grid grid-cols-3 gap-2 bg-[#020510]/95 backdrop-blur-3xl">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const isLocked = config.lockedPages?.some((p) => {
                  if (!p.isLocked || !p.path) return false;
                  const target = p.path.trim().toLowerCase();
                  const current = item.href.toLowerCase();
                  return current === target || current.startsWith(target + "/");
                });

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all touch-manipulation cursor-pointer border text-center ${
                      active
                        ? "bg-white/20 text-accent-cyan border-white/30 shadow-[0_4px_16px_rgba(125,249,255,0.2)]"
                        : "bg-transparent text-slate-300 border-transparent hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {isLocked && (
                      <span className="absolute top-2 right-2 flex h-2 w-2" title="Sektor Terkunci">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]"></span>
                      </span>
                    )}
                    <Icon className={`h-5 w-5 mb-1.5 ${active ? "text-accent-cyan" : isLocked ? "text-rose-400" : "text-slate-300"}`} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider line-clamp-1 flex items-center space-x-0.5">
                      <span>{item.name}</span>
                      {isLocked && <Lock className="h-2 w-2 text-rose-400 inline ml-0.5" />}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}

