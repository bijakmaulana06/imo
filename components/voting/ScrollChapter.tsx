"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import j from "./journey.module.css";

/** Native scrolling drives a held scene; links and reduced motion remain direct. */
export default function ScrollChapter({
  children,
  id,
  reduced,
  className = "",
  isLast = false
}: {
  children: ReactNode;
  id: string;
  reduced: boolean;
  className?: string;
  isLast?: boolean;
}) {
  const host = useRef<HTMLElement>(null);
  const isTerminal = isLast || id === "ruang";
  const { scrollYProgress } = useScroll({ target: host, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 30 });

  // Standard chapter with entrance, hold, and exit transforms
  const zStandard = useTransform(p, [0, .35, .65, 1], [-280, 0, 0, 180]);
  const rotateXStandard = useTransform(p, [0, .35, .65, 1], [14, 0, 0, -9]);
  const opacityStandard = useTransform(p, [0, .22, .8, 1], [.4, 1, 1, .2]);
  const filterStandard = useTransform(p, [0, .22, .8, 1], ["blur(5px)", "blur(0px)", "blur(0px)", "blur(5px)"]);

  // Terminal chapter (#ruang): preserve exact entrance curve, settled at rest without any exit blur/fade
  const zTerminal = useTransform(p, [0, 1], [-280, 0]);
  const rotateXTerminal = useTransform(p, [0, 1], [14, 0]);
  const opacityTerminal = useTransform(p, [0, 0.63, 1], [.4, 1, 1]);
  const filterTerminal = useTransform(p, [0, 0.63, 1], ["blur(5px)", "blur(0px)", "blur(0px)"]);

  const z = isTerminal ? zTerminal : zStandard;
  const rotateX = isTerminal ? rotateXTerminal : rotateXStandard;
  const opacity = isTerminal ? opacityTerminal : opacityStandard;
  const filter = isTerminal ? filterTerminal : filterStandard;

  return <section id={id} ref={host} className={`${j.scrollChapter} ${isTerminal ? j.lastChapter : ""}`} data-reduced={reduced}>
    <div className={j.chapterSticky}><motion.div className={`${j.chapterContent} ${className}`} style={reduced ? {} : { z, rotateX, opacity, filter }}>
      {children}
    </motion.div><span className={j.sceneIndex} aria-hidden="true">IMO / {id.toUpperCase()}<i />SCROLL TO EXPLORE</span></div>
  </section>;
}
