"use client";

import React, { useEffect, useState } from "react";

interface ImoLogoProps {
  className?: string;
  height?: number;
}

export default function ImoLogo({ className = "", height = 36 }: ImoLogoProps) {
  const [logoSrc, setLogoSrc] = useState<string>("/Brighton.svg");

  useEffect(() => {
    // 1. Check window global cache if set by ThemeProvider
    if (typeof window !== "undefined" && (window as any).__IMO_LOGO_URL__) {
      setLogoSrc((window as any).__IMO_LOGO_URL__);
    }

    // 2. Listen for real-time theme updates
    const handleThemeLoaded = (e: CustomEvent) => {
      if (e.detail?.logoUrl) {
        setLogoSrc(e.detail.logoUrl);
      }
    };

    window.addEventListener("imo-theme-loaded", handleThemeLoaded as EventListener);
    return () => {
      window.removeEventListener("imo-theme-loaded", handleThemeLoaded as EventListener);
    };
  }, []);

  return (
    <img
      src={logoSrc || "/Brighton.svg"}
      alt="IMO Logo"
      style={{ height: `${height}px`, width: "auto" }}
      className={`inline-block filter drop-shadow-[0_0_12px_rgba(125,249,255,0.4)] ${className}`}
      onError={() => setLogoSrc("/Brighton.svg")}
    />
  );
}
