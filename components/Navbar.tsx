"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Rocket } from "lucide-react";
import ImoLogo from "./ImoLogo";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Summary Tugas", href: "/info" },
    { name: "Pusat Penjelajahan", href: "/hub" },
    { name: "ID Card Generator", href: "/id-card" },
    { name: "LO Contact", href: "/contact" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-[100] relative w-full glass border-b border-card-border/60 bg-[#152137]/90 backdrop-blur-2xl touch-manipulation select-none">
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
                <ImoLogo height={38} className="h-9 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                <span className="font-display font-black text-accent-purple text-lg tracking-wider glow-text-purple">2026</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all duration-300 touch-manipulation cursor-pointer ${
                    isActive(item.href)
                      ? "text-accent-cyan bg-accent-cyan/15 border border-accent-cyan/50 shadow-[0_0_15px_rgba(125,249,255,0.3)] glow-text-cyan"
                      : "text-slate-300 hover:text-accent-cyan hover:bg-slate-900/60"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className="inline-flex items-center justify-center p-2.5 rounded-xl text-slate-300 hover:text-accent-cyan hover:bg-slate-900/80 active:bg-slate-800 focus:outline-none transition-colors border border-slate-700/80 touch-manipulation cursor-pointer z-50"
              aria-label="Main menu"
            >
              {isOpen ? <X className="h-6 w-6 text-accent-cyan" /> : <Menu className="h-6 w-6 text-slate-200" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden relative z-[110] glass border-t border-card-border/60 animate-in slide-in-from-top duration-300">
          <div className="px-4 pt-3 pb-6 space-y-2.5 bg-[#020510]/98 backdrop-blur-2xl">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3.5 rounded-xl text-sm font-mono font-bold tracking-wider uppercase transition-all touch-manipulation active:scale-[0.98] ${
                  isActive(item.href)
                    ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/60 glow-text-cyan shadow-[0_0_15px_rgba(125,249,255,0.3)]"
                    : "text-slate-200 bg-slate-900/40 hover:bg-slate-900/80 hover:text-accent-cyan border border-slate-800/60"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
