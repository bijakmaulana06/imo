import React from "react";

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
  const colorMap = {
    cyan: {
      shadow: "hover:shadow-[0_0_35px_rgba(125,249,255,0.25)] hover:border-accent-cyan/60",
      corner: "border-accent-cyan",
      cornerGlow: "group-hover:shadow-[0_0_10px_rgba(125,249,255,0.8)]",
      topLine: "from-transparent via-accent-cyan/70 to-transparent",
      badge: "bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan",
    },
    purple: {
      shadow: "hover:shadow-[0_0_35px_rgba(180,140,255,0.25)] hover:border-accent-purple/60",
      corner: "border-accent-purple",
      cornerGlow: "group-hover:shadow-[0_0_10px_rgba(180,140,255,0.8)]",
      topLine: "from-transparent via-accent-purple/70 to-transparent",
      badge: "bg-accent-purple/10 border-accent-purple/30 text-accent-purple",
    },
    yellow: {
      shadow: "hover:shadow-[0_0_35px_rgba(255,209,102,0.25)] hover:border-accent-yellow/60",
      corner: "border-accent-yellow",
      cornerGlow: "group-hover:shadow-[0_0_10px_rgba(255,209,102,0.8)]",
      topLine: "from-transparent via-accent-yellow/70 to-transparent",
      badge: "bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow",
    },
  };

  const currentTheme = colorMap[glowColor];

  return (
    <div
      className={`group relative rounded-2xl glass p-6 border border-card-border/50 backdrop-blur-xl transition-all duration-500 transform hover:-translate-y-1.5 ${currentTheme.shadow} ${className}`}
      {...props}
    >
      {/* Sci-Fi Background Grid Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(125,249,255,0.03)_1px,transparent_1px)] [background-size:16px_16px] rounded-2xl pointer-events-none" />

      {/* Top Accent Laser Line */}
      <div
        className={`absolute top-0 left-4 right-4 h-[1.5px] bg-gradient-to-r ${currentTheme.topLine} opacity-40 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* HUD Sci-Fi Corner Brackets */}
      {showHudCorners && (
        <>
          <span
            className={`absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 rounded-tl-sm transition-all duration-300 ${currentTheme.corner} opacity-60 group-hover:opacity-100 ${currentTheme.cornerGlow}`}
          />
          <span
            className={`absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 rounded-tr-sm transition-all duration-300 ${currentTheme.corner} opacity-60 group-hover:opacity-100 ${currentTheme.cornerGlow}`}
          />
          <span
            className={`absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 rounded-bl-sm transition-all duration-300 ${currentTheme.corner} opacity-60 group-hover:opacity-100 ${currentTheme.cornerGlow}`}
          />
          <span
            className={`absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 rounded-br-sm transition-all duration-300 ${currentTheme.corner} opacity-60 group-hover:opacity-100 ${currentTheme.cornerGlow}`}
          />
        </>
      )}

      {/* Card Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
