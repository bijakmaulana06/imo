"use client";

import React, { useState, useRef } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: "cyan" | "purple" | "yellow";
  showHudCorners?: boolean;
  className?: string;
}

export default function Card({
  children,
  glowColor = "cyan",
  showHudCorners = true,
  className = "",
  ...props
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  const colorMap = {
    cyan: {
      shadow: "hover:shadow-[0_16px_40px_rgba(125,249,255,0.22)] hover:border-accent-cyan/60",
      corner: "border-accent-cyan",
      cornerGlow: "group-hover:shadow-[0_0_12px_rgba(125,249,255,0.8)]",
      topLine: "from-transparent via-accent-cyan/80 to-transparent",
      badge: "bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan",
      spotlight: "rgba(125, 249, 255, 0.12)",
      borderSpotlight: "rgba(125, 249, 255, 0.5)",
    },
    purple: {
      shadow: "hover:shadow-[0_16px_40px_rgba(180,140,255,0.22)] hover:border-accent-purple/60",
      corner: "border-accent-purple",
      cornerGlow: "group-hover:shadow-[0_0_12px_rgba(180,140,255,0.8)]",
      topLine: "from-transparent via-accent-purple/80 to-transparent",
      badge: "bg-accent-purple/10 border-accent-purple/30 text-accent-purple",
      spotlight: "rgba(180, 140, 255, 0.12)",
      borderSpotlight: "rgba(180, 140, 255, 0.5)",
    },
    yellow: {
      shadow: "hover:shadow-[0_16px_40px_rgba(255,209,102,0.22)] hover:border-accent-yellow/60",
      corner: "border-accent-yellow",
      cornerGlow: "group-hover:shadow-[0_0_12px_rgba(255,209,102,0.8)]",
      topLine: "from-transparent via-accent-yellow/80 to-transparent",
      badge: "bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow",
      spotlight: "rgba(255, 209, 102, 0.12)",
      borderSpotlight: "rgba(255, 209, 102, 0.5)",
    },
  };

  const currentTheme = colorMap[glowColor];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative rounded-[22px] sm:rounded-[28px] glass p-4 sm:p-6 md:p-7 border border-white/15 backdrop-blur-xl transition-transform duration-300 transform hover:-translate-y-1.5 overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] will-change-transform max-w-full ${currentTheme.shadow} ${className}`}
      {...props}
    >
      {/* Specular White Sheen Overlay (Apple Glass Look) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-black/[0.2] pointer-events-none rounded-[inherit]" />

      {/* Mouse Spotlight Ambient Glow (Zero-Re-Render via CSS Variables) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px] transition-opacity duration-300 z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${currentTheme.spotlight}, transparent 80%)`,
        }}
      />

      {/* Mouse Spotlight Border Glow (Zero-Re-Render via CSS Variables) */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-[28px] z-10 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(220px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.6), ${currentTheme.borderSpotlight} 50%, transparent 80%)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
        }}
      />

      {/* Subtle Background Grid Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:20px_20px] rounded-[28px] pointer-events-none" />

      {/* Top Accent Laser Line */}
      <div
        className={`absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r ${currentTheme.topLine} opacity-50 group-hover:opacity-100 transition-opacity duration-300 z-10`}
      />

      {/* HUD Sci-Fi Corner Brackets */}
      {showHudCorners && (
        <>
          <span
            className={`absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 rounded-tl-sm transition-all duration-300 ${currentTheme.corner} opacity-60 group-hover:opacity-100 ${currentTheme.cornerGlow} z-10`}
          />
          <span
            className={`absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 rounded-tr-sm transition-all duration-300 ${currentTheme.corner} opacity-60 group-hover:opacity-100 ${currentTheme.cornerGlow} z-10`}
          />
          <span
            className={`absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 rounded-bl-sm transition-all duration-300 ${currentTheme.corner} opacity-60 group-hover:opacity-100 ${currentTheme.cornerGlow} z-10`}
          />
          <span
            className={`absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 rounded-br-sm transition-all duration-300 ${currentTheme.corner} opacity-60 group-hover:opacity-100 ${currentTheme.cornerGlow} z-10`}
          />
        </>
      )}

      {/* Card Content */}
      <div className="relative z-20">{children}</div>
    </div>
  );
}

