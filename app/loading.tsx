import React from "react";

export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#020510]">
      <div className="h-full bg-accent-cyan animate-[shimmer_1s_infinite] shadow-[0_0_10px_rgba(125,249,255,0.8)]" />
    </div>
  );
}
