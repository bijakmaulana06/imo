"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Cpu, Database, Compass, CheckCircle2 } from "lucide-react";
import Button from "./Button";
import ImoLogo from "./ImoLogo";

interface LaunchSequenceProps {
  onLaunch: () => void;
}

export default function LaunchSequence({ onLaunch }: LaunchSequenceProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const steps = [
    { text: "Initializing quantum core...", icon: <Cpu className="h-4 w-4 text-accent-cyan" /> },
    { text: "Establishing uplink to Supabase postgres database...", icon: <Database className="h-4 w-4 text-accent-purple" /> },
    { text: "Calibrating astronomical coordinates for IMO 2026...", icon: <Compass className="h-4 w-4 text-accent-yellow" /> },
    { text: "Spacecraft engine checkout: OK!", icon: <CheckCircle2 className="h-4 w-4 text-green-400" /> },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsReady(true);
          return 100;
        }
        const increment = Math.floor(Math.random() * 25) + 15;
        return Math.min(prev + increment, 100);
      });
    }, 120);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress < 25) {
      setCurrentStep(0);
    } else if (progress < 55) {
      setCurrentStep(1);
    } else if (progress < 85) {
      setCurrentStep(2);
    } else {
      setCurrentStep(3);
    }
  }, [progress]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020510] text-slate-100 overflow-hidden font-sans select-none">
      {/* Deep space radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(12,20,40,0.5),rgba(2,5,16,1))] z-0" />
      
      {/* Nebula clouds */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-accent-cyan/[0.03] rounded-full filter blur-[120px] animate-cosmic-pulse z-0" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-accent-purple/[0.04] rounded-full filter blur-[100px] animate-cosmic-pulse z-0" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center text-center">
        
        {/* Animated Rocket Badge */}
        <motion.div
          animate={{
            y: [0, -12, 0],
            rotate: [0, 3, -3, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 5,
            ease: "easeInOut",
          }}
          className="h-20 w-20 bg-gradient-to-tr from-accent-purple/10 to-accent-cyan/10 border border-white/[0.08] rounded-2xl flex items-center justify-center mb-10 relative shadow-[0_0_40px_rgba(125,249,255,0.08)]"
        >
          <Rocket className="h-9 w-9 text-accent-cyan" />
          <div className="absolute inset-0 rounded-2xl border border-accent-cyan/10 animate-cosmic-pulse" />
        </motion.div>

        {/* Brand/Event Title */}
        <div className="flex items-center justify-center space-x-3 mb-3">
          <ImoLogo height={60} className="h-14 filter drop-shadow-[0_0_20px_rgba(255,255,255,1)]" />
          <span className="font-display font-black text-4xl text-accent-purple glow-text-purple filter drop-shadow-[0_0_25px_rgba(180,140,255,0.9)]">2026</span>
        </div>
        <p className="text-xs text-accent-cyan/60 font-display tracking-[0.25em] uppercase mb-12 font-semibold">
          Innovative Minds Outclass
        </p>

        {/* Status Steps */}
        <div className="w-full h-20 mb-8 bg-slate-950/80 backdrop-blur-md rounded-xl p-4 border border-card-border/60 text-left flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center space-x-3"
            >
              {steps[currentStep].icon}
              <span className="text-xs text-slate-300 font-mono tracking-wide">
                {steps[currentStep].text}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-slate-950 rounded-full h-1 mb-3 overflow-hidden border border-slate-900">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-purple via-accent-cyan to-accent-cyan shadow-[0_0_12px_rgba(125,249,255,0.6)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>

        {/* Progress percentage label */}
        <div className="w-full flex justify-between text-[10px] font-mono text-slate-500 tracking-wider mb-14">
          <span>SYSTEM UPLINK</span>
          <span className="text-slate-400">{progress}%</span>
        </div>

        {/* Action Button & Skip Option */}
        <AnimatePresence>
          {isReady ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="w-full"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={onLaunch}
                className="w-full shadow-[0_0_40px_rgba(125,249,255,0.4)]"
              >
                Mulai Penjelajahan
              </Button>
            </motion.div>
          ) : (
            <button
              onClick={onLaunch}
              className="text-xs font-mono text-slate-500 hover:text-accent-cyan underline underline-offset-4 transition cursor-pointer"
            >
              [ Lewati Introduksi ]
            </button>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
