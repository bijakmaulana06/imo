"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Disc3, Sparkles, X } from "lucide-react";

interface AudioPlayerContextType {
  isPlaying: boolean;
  isMuted: boolean;
  userChoice: "play" | "muted" | null;
  toggleMute: () => void;
  togglePlay: () => void;
  playWithFadeIn: () => void;
  muteAudio: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  isPlaying: false,
  isMuted: false,
  userChoice: null,
  toggleMute: () => {},
  togglePlay: () => {},
  playWithFadeIn: () => {},
  muteAudio: () => {},
});

export const useAudioPlayer = () => useContext(AudioPlayerContext);

export default function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const { config } = useSiteConfig();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [userChoice, setUserChoice] = useState<"play" | "muted" | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Load user choice from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("imo_audio_user_choice") as "play" | "muted" | null;
    if (saved) {
      setUserChoice(saved);
      if (saved === "play") {
        setIsMuted(false);
      } else {
        setIsMuted(true);
      }
    } else {
      // First visit: default to muted/off, show prompt after brief delay
      setIsMuted(true);
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (typeof window === "undefined" || !config.musicPlayerEnabled || !config.musicUrl) return;

    if (!audioRef.current) {
      const audio = new Audio(config.musicUrl);
      audio.loop = true;
      audio.volume = 0;
      audio.muted = true; // Default muted
      audioRef.current = audio;
    } else if (audioRef.current.src !== config.musicUrl) {
      audioRef.current.src = config.musicUrl;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [config.musicUrl, config.musicPlayerEnabled]);

  // Fade-in logic
  const fadeIn = async (audio: HTMLAudioElement) => {
    try {
      audio.volume = 0;
      audio.muted = false;
      setIsMuted(false);
      await audio.play();
      setIsPlaying(true);

      const fadeDuration = 3500; // 3.5 seconds smooth intro
      const interval = 50;
      const steps = fadeDuration / interval;
      let currentStep = 0;

      const fadeInterval = setInterval(() => {
        currentStep++;
        if (audio) {
          audio.volume = Math.min(1, currentStep / steps);
        }
        if (currentStep >= steps) {
          clearInterval(fadeInterval);
        }
      }, interval);
    } catch (error) {
      console.warn("Autoplay blocked by browser policy:", error);
      setIsPlaying(false);
    }
  };

  // Trigger smooth play
  const playWithFadeIn = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("imo_audio_user_choice", "play");
    }
    setUserChoice("play");
    setShowPrompt(false);
    if (audioRef.current) {
      fadeIn(audioRef.current);
    }
  };

  // Trigger mute / disable
  const muteAudio = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("imo_audio_user_choice", "muted");
    }
    setUserChoice("muted");
    setShowPrompt(false);
    setIsMuted(true);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Attempt auto-fade-in if user previously allowed
  useEffect(() => {
    if (!config.musicPlayerEnabled || !audioRef.current || userChoice !== "play" || isPlaying) return;
    fadeIn(audioRef.current);
  }, [config.musicPlayerEnabled, userChoice]);

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      audioRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.muted = false;
        setIsMuted(false);
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
        if (audioRef.current.volume === 0) {
          audioRef.current.volume = 1;
        }
      }
    }
  };

  // If globally disabled, just pass children
  if (!config.musicPlayerEnabled) {
    return <>{children}</>;
  }

  return (
    <AudioPlayerContext.Provider
      value={{
        isPlaying,
        isMuted,
        userChoice,
        toggleMute,
        togglePlay,
        playWithFadeIn,
        muteAudio,
      }}
    >
      {children}

      {/* --- INTRO AUDIO PROMPT MODAL / BANNER AT PAGE START --- */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[92%] max-w-md pointer-events-auto"
          >
            <div className="relative p-5 rounded-3xl border border-white/25 bg-slate-950/85 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.3)] overflow-hidden font-sans">
              {/* Apple Specular sheen */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.14] via-transparent to-black/[0.3] pointer-events-none rounded-[inherit]" />

              <button
                onClick={() => setShowPrompt(false)}
                className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition z-20"
                title="Tutup Opsi"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10 flex items-start space-x-3.5">
                {/* Vinyl Preview Icon */}
                <div className="relative w-12 h-12 rounded-full bg-black border border-white/20 shadow-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {config.musicAlbumArt ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={config.musicAlbumArt}
                      alt="Art"
                      className="w-full h-full object-cover animate-[spin_6s_linear_infinite]"
                    />
                  ) : (
                    <Disc3 className="w-6 h-6 text-accent-cyan animate-[spin_6s_linear_infinite]" />
                  )}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#020510] rounded-full border border-white/30" />
                </div>

                <div className="flex-1 pr-4">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-cyan">
                      Audio Latar Belakang
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Aktifkan Musik Penjelajahan?
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                    {config.musicTitle} • {config.musicArtist}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="relative z-10 grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-white/10">
                <button
                  onClick={playWithFadeIn}
                  className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-accent-cyan/20 to-accent-purple/20 hover:from-accent-cyan/30 hover:to-accent-purple/30 border border-accent-cyan/50 text-accent-cyan text-xs font-bold transition shadow-[0_0_20px_rgba(125,249,255,0.2)] active:scale-[0.98]"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>🔊 Putar Musik</span>
                </button>
                <button
                  onClick={muteAudio}
                  className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white text-xs font-bold transition active:scale-[0.98]"
                >
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  <span>🔇 Matikan</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AudioPlayerContext.Provider>
  );
}

