"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Disc3 } from "lucide-react";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import { useAudioPlayer } from "@/components/AudioPlayerProvider";

export default function NowPlayingNavbar() {
  const { config } = useSiteConfig();
  const { isPlaying, isMuted, toggleMute, togglePlay } = useAudioPlayer();

  if (!config.musicPlayerEnabled || !config.musicUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.9 }}
        className="flex items-center"
      >
        <div className="relative group flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/20 backdrop-blur-xl bg-slate-950/75 shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          {/* Apple Glass Specular Sheen */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] via-transparent to-black/[0.2] pointer-events-none rounded-full" />
          
          {/* Album Art / Vinyl */}
          <div 
            className="relative flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black border border-white/10 shadow-[0_0_10px_rgba(0,0,0,0.5)] overflow-hidden cursor-pointer flex items-center justify-center"
            onClick={togglePlay}
            title={isPlaying ? "Pause Music" : "Play Music"}
          >
            {/* Spinning image */}
            {config.musicAlbumArt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.musicAlbumArt}
                alt="Album Art"
                className={`w-full h-full object-cover transition-all duration-300 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : 'opacity-70'}`}
                style={{ animationPlayState: isPlaying && !isMuted ? 'running' : 'paused' }}
              />
            ) : (
              <Disc3 className={`w-5 h-5 text-slate-400 ${isPlaying && !isMuted ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
            )}
            
            {/* Center hole of the vinyl */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 md:w-2.5 md:h-2.5 bg-[#020510] rounded-full border border-white/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
            
            {/* Vinyl grooves overlay (concentric circles) */}
            <div className="absolute inset-0 rounded-full border border-white/5 opacity-50" style={{ transform: 'scale(0.8)' }} />
            <div className="absolute inset-0 rounded-full border border-white/5 opacity-50" style={{ transform: 'scale(0.6)' }} />
          </div>

          {/* Track Info */}
          <div className="flex flex-col justify-center min-w-[70px] md:min-w-[90px] max-w-[100px] md:max-w-[120px] overflow-hidden z-10">
            <span className="text-[10px] md:text-xs font-bold text-slate-100 truncate w-full tracking-wide">
              {config.musicTitle || "Unknown Track"}
            </span>
            <span className="text-[9px] md:text-[10px] font-mono text-accent-cyan/80 truncate w-full">
              {config.musicArtist || "Unknown Artist"}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center pl-1 border-l border-white/10 z-10">
            <button
              onClick={toggleMute}
              className="p-1.5 md:p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent-cyan" />
              )}
            </button>
          </div>

          {/* Ambient Glow behind player when playing */}
          {isPlaying && !isMuted && (
             <div className="absolute inset-0 -z-10 rounded-full bg-accent-cyan/20 blur-xl opacity-30 animate-pulse pointer-events-none" />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
