"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  Users
} from "lucide-react";
import ImoLogo from "./ImoLogo";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Panduan", label: "Panduan & Artikel", href: "/guide", icon: BookOpen },
    { name: "Penjelajahan", label: "Pusat Hub", href: "/hub", icon: Compass },
    { name: "Status Tugas", label: "Scanner Drive", href: "/info", icon: CheckCircle2 },
    { name: "ID Card", label: "Generator Card", href: "/id-card", icon: QrCode },
    { name: "Auto Form", label: "Doc Generator", href: "/documents", icon: FileEdit },
    { name: "Kontak LO", label: "Pendamping", href: "/contact", icon: Users },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-[100] relative w-full glass border-b border-card-border/60 bg-[#020510]/90 backdrop-blur-2xl touch-manipulation select-none">
      {/* Top Accent Laser Line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-accent-cyan to-transparent shadow-[0_0_10px_rgba(125,249,255,0.8)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2.5 group touch-manipulation">
              <div className="p-1.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 group-hover:border-accent-cyan group-hover:shadow-[0_0_15px_rgba(125,249,255,0.5)] transition duration-300">
                <Rocket className="h-5 w-5 text-accent-cyan group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="flex items-center space-x-2">
                <ImoLogo height={38} className="h-8 md:h-9 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                <span className="font-display font-black text-accent-purple text-base md:text-lg tracking-wider glow-text-purple">2026</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links with Icon & Small Text Underneath */}
          <div className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer border ${
                    active
                      ? "bg-accent-cyan/15 border-accent-cyan/50 text-accent-cyan shadow-[0_0_15px_rgba(125,249,255,0.3)] glow-text-cyan"
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 hover:border-card-border/40"
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110 ${
                      active ? "text-accent-cyan drop-shadow-[0_0_8px_rgba(125,249,255,0.8)]" : "text-slate-400 group-hover:text-accent-cyan"
                    }`}
                  />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider mt-1">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-accent-cyan hover:bg-slate-900/80 active:bg-slate-800 focus:outline-none transition-colors border border-slate-700/80 touch-manipulation cursor-pointer z-50"
              aria-label="Main menu"
            >
              {isOpen ? <X className="h-5 w-5 text-accent-cyan" /> : <Menu className="h-5 w-5 text-slate-200" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Compact Grid with Icon & Text) */}
      {isOpen && (
        <div className="md:hidden relative z-[110] glass border-t border-card-border/60 animate-in slide-in-from-top duration-300">
          <div className="p-4 grid grid-cols-3 gap-2 bg-[#020510]/98 backdrop-blur-2xl">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all touch-manipulation cursor-pointer border text-center ${
                    active
                      ? "bg-accent-cyan/20 text-accent-cyan border-accent-cyan/60 shadow-[0_0_15px_rgba(125,249,255,0.3)]"
                      : "bg-slate-950/60 text-slate-300 border-card-border/40 hover:bg-slate-900 hover:text-accent-cyan"
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1.5 ${active ? "text-accent-cyan" : "text-slate-400"}`} />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider line-clamp-1">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
