"use client";

import { useId, useRef, useState, type PointerEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import s from "./voting.module.css";

/** Completion happens on release, never on crossing the threshold alone. */
export default function SwipeAction({ label, busyLabel, disabled, busy, onComplete }: {
  label: string; busyLabel: string; disabled?: boolean; busy: boolean; onComplete: () => Promise<void>;
}) {
  const hint = useId();
  const reduced = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; start: number; distance: number; offset: number } | null>(null);
  const locked = useRef(false);
  const [offset, setOffset] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [armed, setArmed] = useState(false);

  function reset() { gesture.current = null; setOffset(0); setProgress(0); setDragging(false); setArmed(false); }
  async function complete() {
    if (locked.current || busy || disabled) return;
    locked.current = true;
    try { await onComplete(); } finally { locked.current = false; reset(); }
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    current.offset = Math.max(0, Math.min(current.distance, event.clientX - current.start));
    setOffset(current.offset); setProgress(current.offset / current.distance);
  }

  return <div className={s.swipeControl}>
    <div ref={track} className={s.swipeTrack} data-ready={progress >= .94} data-busy={busy}>
      <motion.div className={s.swipeFill} animate={{ scaleX: busy ? 1 : progress }} transition={{ duration: dragging || reduced ? 0 : .35 }} />
      <span className={s.swipeLabel} aria-hidden="true" style={{ opacity: dragging ? Math.max(.12, 1 - progress * 1.5) : 1 }}>{busy ? busyLabel : label}</span>
      <span className={s.swipeEnd} aria-hidden="true"><Check size={18} /></span>
      <motion.button type="button" className={s.swipeHandle} aria-label={label} aria-describedby={hint} disabled={disabled || busy}
        animate={{ x: offset }} transition={dragging || reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 28 }}
        onPointerDown={(event) => {
          if (event.button !== 0 || gesture.current || locked.current || !track.current) return;
          const distance = track.current.clientWidth - event.currentTarget.offsetWidth - 12;
          if (distance <= 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          gesture.current = { id: event.pointerId, start: event.clientX, distance, offset: 0 };
          setDragging(true); setArmed(false);
        }}
        onPointerMove={move}
        onPointerUp={(event) => {
          if (gesture.current?.id !== event.pointerId) return;
          const done = gesture.current.offset / gesture.current.distance >= .94;
          gesture.current = null; setDragging(false);
          if (done) void complete(); else reset();
        }}
        onPointerCancel={reset} onLostPointerCapture={() => { if (gesture.current) reset(); }}
        onClick={(event) => {
          // Keyboard and assistive-technology activation has no pointer click count.
          if (event.detail !== 0) return;
          if (armed) void complete(); else setArmed(true);
        }}
        onKeyDown={(event) => { if (event.repeat && ["Enter", " "].includes(event.key)) event.preventDefault(); if (event.key === "Escape") reset(); }}
        onBlur={() => setArmed(false)}>
        {busy ? <LoaderCircle size={20} className={s.spin} /> : progress >= .94 ? <Check size={20} /> : <ArrowRight size={21} />}
      </motion.button>
    </div>
    <p id={hint} className={s.swipeHint} aria-live="polite">{armed ? "Tekan Enter atau Spasi sekali lagi untuk mengonfirmasi." : "Geser panah sampai ujung, lalu lepaskan. Keyboard: Enter atau Spasi dua kali."}</p>
  </div>;
}
