"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import ImoLogo from "@/components/ImoLogo";
import RealisticBlackHole from "@/components/RealisticBlackHole";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  // 2-second gimmick timer for page transition loading screen
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 2000); // 2 seconds gimmick

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="relative w-full min-h-screen flex flex-col overflow-x-hidden">
      {/* 2-Second Realistic Black Hole Transition Overlay Gimmick */}
      <AnimatePresence mode="wait">
        {isNavigating && (
          <motion.div
            key="page-blackhole-curtain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(12px)" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-[999] bg-[#020510]/95 backdrop-blur-2xl flex flex-col items-center justify-center select-none"
          >
            {/* Top Glowing Laser Line */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-[#020510]">
              <div className="h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer shadow-[0_0_20px_#ffffff]" />
            </div>

            {/* Glass Card Container */}
            <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl glass border border-white/30 shadow-[0_0_80px_rgba(255,255,255,0.25)] max-w-sm w-full mx-4 text-center">
              
              {/* REALISTIC CANVAS BLACK HOLE */}
              <div className="mb-4">
                <RealisticBlackHole size={180} />
              </div>

              {/* Logo & Year */}
              <div className="flex items-center space-x-2 mb-2">
                <ImoLogo height={32} className="h-7 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                <span className="font-display font-black text-white text-base tracking-wider drop-shadow-[0_0_10px_#ffffff]">2026</span>
              </div>

              {/* Status Subtitle */}
              <span className="font-mono text-[10px] font-black text-white tracking-[0.25em] uppercase drop-shadow-[0_0_10px_#ffffff] animate-pulse block mb-4">
                REALISTIC SINGULARITY (2s)...
              </span>

              {/* 2-Second Timed Smooth Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-white/30 p-0.5 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.8, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-slate-400 via-white to-slate-400 rounded-full shadow-[0_0_15px_#ffffff]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Page Motion Container - Smooth 60fps Fade Entrance */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          delay: 0.08,
          ease: [0.25, 1, 0.5, 1]
        }}
        className="w-full flex-grow flex flex-col min-h-screen will-change-[opacity,transform]"
      >
        {children}
      </motion.div>
    </div>
  );
}
