"use client";

import React from "react";
import { useSiteConfig } from "@/components/SiteConfigProvider";

interface ImoLogoProps {
  className?: string;
  height?: number;
  src?: string;
}

export default function ImoLogo({ className = "", height = 36, src }: ImoLogoProps) {
  const { config } = useSiteConfig();
  const logoSrc = src || config.siteLogoUrl || "/Brighton.svg";

  return (
    <img
      src={logoSrc}
      alt={config.siteName || "IMO Logo"}
      style={{ height: `${height}px`, width: "auto" }}
      className={`inline-block filter drop-shadow-[0_0_12px_rgba(125,249,255,0.4)] ${className}`}
    />
  );
}
