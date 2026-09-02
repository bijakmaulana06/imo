"use client";

import React, { createContext, useContext } from "react";

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
  isMuted: true,
  userChoice: "muted",
  toggleMute: () => {},
  togglePlay: () => {},
  playWithFadeIn: () => {},
  muteAudio: () => {},
});

export const useAudioPlayer = () => useContext(AudioPlayerContext);

export default function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
