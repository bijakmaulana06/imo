"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSiteConfig } from "@/components/SiteConfigProvider";

interface AudioPlayerContextType {
  isPlaying: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  togglePlay: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  isPlaying: false,
  isMuted: false,
  toggleMute: () => {},
  togglePlay: () => {},
});

export const useAudioPlayer = () => useContext(AudioPlayerContext);

export default function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const { config } = useSiteConfig();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Initialize audio element
  useEffect(() => {
    if (typeof window === "undefined" || !config.musicPlayerEnabled || !config.musicUrl) return;

    if (!audioRef.current) {
      const audio = new Audio(config.musicUrl);
      audio.loop = true;
      audio.volume = 0; // Start at 0 for fade-in
      audioRef.current = audio;
    } else if (audioRef.current.src !== config.musicUrl) {
      audioRef.current.src = config.musicUrl;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }

    // Cleanup
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
      await audio.play();
      setIsPlaying(true);
      setHasStarted(true);

      const fadeDuration = 3000; // 3 seconds
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
      console.warn("Autoplay blocked by browser. Waiting for user interaction.", error);
      setIsPlaying(false);
      // We rely on the user interaction listener below
    }
  };

  // Attempt autoplay on mount
  useEffect(() => {
    if (!config.musicPlayerEnabled || !audioRef.current || hasStarted) return;

    const audio = audioRef.current;
    
    // Attempt initial play
    fadeIn(audio);
    
    // Fallback: If autoplay fails, wait for ANY interaction
    const handleInteraction = () => {
      if (!hasStarted && audioRef.current) {
        fadeIn(audioRef.current);
      }
    };

    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("keydown", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
  }, [config.musicPlayerEnabled, hasStarted]);

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
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
        if (audioRef.current.volume === 0) {
            audioRef.current.volume = 1; // instantly restore volume if manually toggled
        }
      }
    }
  };

  // If globally disabled, do not render context functionality, just pass children
  if (!config.musicPlayerEnabled) {
    return <>{children}</>;
  }

  return (
    <AudioPlayerContext.Provider value={{ isPlaying, isMuted, toggleMute, togglePlay }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}
