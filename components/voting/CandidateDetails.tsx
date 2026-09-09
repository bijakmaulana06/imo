"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import type { Candidate } from "@/lib/voting/types";
import s from "./voting.module.css";
import CandidateFlip from "./CandidateFlip";

export default function CandidateDetails({ candidate, onClose }: {
  candidate: Candidate; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement as HTMLElement | null;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previous; trigger?.focus({ preventScroll: true }); };
  }, []);
  return <motion.dialog ref={dialog} className={`${s.dialog} ${s.profileDialog}`} aria-labelledby="profile-title"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    transition={{ duration: reduced ? .1 : .25 }}
    onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <CandidateFlip number={candidate.number}><div className={s.profileGrid}>
      <button autoFocus className={`${s.iconButton} ${s.profileClose}`} onClick={onClose} aria-label="Tutup profil kandidat"><X size={22} /></button>
      <div className={s.profilePortrait}>
        {candidate.photoUrl && !failed ? /* eslint-disable-next-line @next/next/no-img-element */
          <img src={candidate.photoUrl} alt={candidate.name} onError={() => setFailed(true)} /> : <span className={s.profileInitials}>{candidate.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span>}
        <div className={s.profileIdentity}><span>CALON KETUA ANGKATAN</span><strong>{String(candidate.number).padStart(2, "0")}</strong></div>
      </div>
      <div className={s.profileCopy}>
        <span className={s.eyebrow}>MEET YOUR NEXT LEADER</span>
        <h2 id="profile-title">{candidate.name}</h2>
        <p className={s.profileTagline}>{candidate.tagline}</p>
        <motion.div initial={reduced ? false : { opacity: 0, y: 20, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: reduced ? 0 : .4, duration: .5 }}>
          <span className={s.eyebrow}>01 / VISI</span><p className={s.profileVision}>{candidate.vision || "Visi kandidat akan diumumkan."}</p>
          <span className={s.eyebrow}>02 / MISI</span>
          <ol className={s.profileMissions}>{candidate.mission.map((mission, index) => <motion.li key={index} initial={reduced ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduced ? 0 : .22 + Math.min(index, 6) * .055 }}><span>{String(index + 1).padStart(2, "0")}</span>{mission}</motion.li>)}</ol>
          {!candidate.mission.length && <p className={s.profileVision}>Misi kandidat akan diumumkan.</p>}
          <button className={s.primaryButton} onClick={onClose}>Kembali ke kandidat<ArrowRight size={17} /></button>
        </motion.div>
      </div>
    </div></CandidateFlip>
  </motion.dialog>;
}
