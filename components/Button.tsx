import React from "react";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "galaxy";
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
  target?: string;
  rel?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  href,
  target,
  rel,
  ...props
}: ButtonProps) {
  const sizes = {
    sm: "px-4 py-2 text-xs font-mono font-bold tracking-wider",
    md: "px-6.5 py-3 text-sm font-mono font-extrabold tracking-widest",
    lg: "px-8.5 py-4 text-base font-mono font-black tracking-widest",
  };

  const variants = {
    primary:
      "bg-[linear-gradient(110deg,#07142e,45%,#1c3870,55%,#07142e)] bg-[length:200%_100%] animate-shimmer text-accent-cyan border border-accent-cyan/60 hover:border-accent-cyan hover:shadow-[0_0_35px_rgba(125,249,255,0.6)] glow-text-cyan",
    secondary:
      "bg-[linear-gradient(110deg,#160b2e,45%,#3a1a68,55%,#160b2e)] bg-[length:200%_100%] animate-shimmer text-accent-purple border border-accent-purple/60 hover:border-accent-purple hover:shadow-[0_0_35px_rgba(180,140,255,0.6)] glow-text-purple",
    outline:
      "border-2 border-accent-cyan/50 text-accent-cyan bg-slate-950/80 hover:bg-accent-cyan/15 hover:border-accent-cyan hover:shadow-[0_0_25px_rgba(125,249,255,0.4)]",
    galaxy:
      "bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-yellow text-black border border-white/60 hover:shadow-[0_0_40px_rgba(180,140,255,0.8)] hover:scale-105 font-black",
  };

  const commonClasses = `group relative inline-flex items-center justify-center uppercase transition-all duration-300 font-mono active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer rounded-2xl overflow-hidden touch-manipulation select-none ${variants[variant]} ${sizes[size]} ${className}`;

  const innerContent = (
    <>
      {/* Galaxy Cosmic Particle Accents */}
      <span className="absolute top-1 left-3 w-1 h-1 rounded-full bg-white animate-ping opacity-75 pointer-events-none" />
      <span className="absolute bottom-1 right-4 w-1 h-1 rounded-full bg-accent-cyan animate-pulse opacity-80 pointer-events-none" />

      {/* Sci-Fi Corner Brackets */}
      <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-accent-cyan rounded-tl-md opacity-70 group-hover:opacity-100 group-hover:shadow-[0_0_10px_#7df9ff] transition-all pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-accent-cyan rounded-br-md opacity-70 group-hover:opacity-100 group-hover:shadow-[0_0_10px_#7df9ff] transition-all pointer-events-none" />

      {/* Top Laser Border Trace */}
      <span className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Button Content */}
      <span className="relative z-10 flex items-center pointer-events-none">{children}</span>
    </>
  );

  if (href) {
    if (href.startsWith("http") || target === "_blank") {
      return (
        <a href={href} target={target} rel={rel || "noopener noreferrer"} className={commonClasses}>
          {innerContent}
        </a>
      );
    }
    return (
      <Link href={href} className={commonClasses}>
        {innerContent}
      </Link>
    );
  }

  return (
    <button className={commonClasses} {...props}>
      {innerContent}
    </button>
  );
}
