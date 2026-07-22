import React from "react";

interface ImoLogoProps {
  className?: string;
  height?: number;
}

export default function ImoLogo({ className = "", height = 36 }: ImoLogoProps) {
  return (
    <img
      src="/Brighton.svg"
      alt="IMO Logo"
      style={{ height: `${height}px`, width: "auto" }}
      className={`inline-block filter drop-shadow-[0_0_12px_rgba(125,249,255,0.4)] ${className}`}
    />
  );
}
