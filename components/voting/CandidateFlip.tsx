"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import s from "./voting.module.css";

export default function CandidateFlip({ children, number, inline = false }: { children: ReactNode; number: number; inline?: boolean }) {
  const reduced = useReducedMotion();
  const Frame = inline ? "span" : "div";
  const Surface = inline ? motion.span : motion.div;
  return <Frame className={s.flipStage}>
    <Surface className={s.flipInner} initial={reduced ? false : { rotateY: 180 }} animate={{ rotateY: 0 }} transition={{ duration: .95, ease: [.22, .8, .25, 1] }}>
      <Frame className={s.flipFront}>{children}</Frame>
      <Frame className={s.flipBack} aria-hidden="true"><span>THE NEXT CHAPTER</span><strong>{String(number).padStart(2, "0")}</strong><span>KENALI PILIHANMU</span></Frame>
    </Surface>
  </Frame>;
}
