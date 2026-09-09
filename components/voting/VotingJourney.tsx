"use client";

import { Fragment, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, ArrowUpRight, Fingerprint, ShieldCheck, X } from "lucide-react";
import type { Candidate, ElectionSnapshot } from "@/lib/voting/types";
import { useVotingRealtime } from "@/hooks/useVotingRealtime";
import VotingBooth from "./VotingBooth";
import CandidateDetails from "./CandidateDetails";
import ScrollChapter from "./ScrollChapter";
import s from "./voting.module.css";
import j from "./journey.module.css";

const OrbitalScene = dynamic(() => import("./OrbitalScene"), { ssr: false });
const subscribeHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

function CandidatePortrait({ candidate, index, onInspect, reduced }: { candidate: Candidate; index: number; onInspect: () => void; reduced: boolean }) {
  const host = useRef<HTMLElement>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const { scrollYProgress } = useScroll({ target: host, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 85, damping: 28 });
  const y = useTransform(progress, [0, .5, 1], [30, 0, -35]);
  const rotateY = useTransform(progress, [0, .5, 1], [38, 0, -32]);
  const scale = useTransform(progress, [0, .5, 1], [.76, 1, .82]);
  const captionY = useTransform(progress, [0, .4, .65, 1], [90, 0, 0, -65]);
  const depth = useTransform(progress, [0, .4, .65, 1], [-240, 0, 0, 180]);
  return <article ref={host} className={j.candidate} data-reverse={index % 2 === 1} data-reduced={reduced}>
    <div className={j.candidateHold}><div className={j.candidateStage}>
      <span className={j.giantNumber} aria-hidden="true">{String(candidate.number).padStart(2, "0")}</span>
      <motion.div className={j.portraitStage} style={reduced ? {} : { y, z: depth, rotateY, scale, transformPerspective: 1400 }}>
        <button className={j.portrait} onClick={onInspect} aria-label={`Lihat profil ${candidate.name}`} aria-haspopup="dialog">
          {candidate.photoUrl && failed !== candidate.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Photo URLs are supplied by the voting API.
            <img src={candidate.photoUrl} alt={`Potret ${candidate.name}`} loading="lazy" onError={() => setFailed(candidate.photoUrl)} />
          ) : <span className={j.initials}>{candidate.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span>}
          <span className={j.portraitVeil} aria-hidden="true" />
          <span className={j.portraitHint}>KENALI LEBIH DEKAT <ArrowUpRight size={20} /></span>
        </button>
        <span className={j.orbitCaption} aria-hidden="true">DIFFERENT MINDS. ONE SHARED FUTURE.</span>
      </motion.div>
      <motion.div className={j.candidateCopy} style={reduced ? {} : { y: captionY }}>
        <span className={j.label}>CALON {String(candidate.number).padStart(2, "0")} <i /> KETUA ANGKATAN</span>
        <h3>{candidate.name}</h3><p>{candidate.tagline || "Sebuah gagasan untuk perjalanan kita selanjutnya."}</p>
        <button onClick={onInspect} className={j.textButton}>Jelajahi visi & misi <span><ArrowUpRight size={21} /></span></button>
        <span className={j.candidateFoot}>SATU ANGKATAN. BERAGAM GAGASAN.</span>
      </motion.div>
    </div><span className={j.sceneIndex} aria-hidden="true">THE CANDIDATES / {String(index + 1).padStart(2, "0")}<i />SCROLL TO DISCOVER</span></div>
  </article>;
}

export default function VotingJourney() {
  const motionPreference = useReducedMotion();
  const hydrated = useSyncExternalStore(subscribeHydration, clientReady, serverReady);
  const reduced = hydrated && !!motionPreference;
  const hero = useRef<HTMLElement>(null);
  const [intro, setIntro] = useState(true);
  const [snapshot, setSnapshot] = useState<ElectionSnapshot | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [roomOpen, setRoomOpen] = useState(false);
  const [profile, setProfile] = useState<Candidate | null>(null);
  const [now, setNow] = useState(0);
  const [voted, setVoted] = useState(false);
  const { scrollYProgress } = useScroll();
  const sceneJourney = useTransform(scrollYProgress, [0, 1], [0, 0.947]);
  const { scrollYProgress: heroProgress } = useScroll({ target: hero, offset: ["start start", "end end"] });
  const smooth = useSpring(heroProgress, { stiffness: 65, damping: 26 });
  const titleScale = useTransform(smooth, [0, .65], [1, 1.65]);
  const titleZ = useTransform(smooth, [0, .65], [0, 160]);
  const titleOpacity = useTransform(smooth, [0, .16, .48], [1, 1, 0]);
  const secondOpacity = useTransform(smooth, [.4, .62, .96], [0, 1, 1]);
  const secondY = useTransform(smooth, [.4, .8], [90, 0]);
  const refresh = useCallback(async () => {
    try { const res = await fetch("/api/voting/election", { cache: "no-store" }); if (!res.ok) throw new Error(); setSnapshot(await res.json()); setFetchError(""); }
    catch { setFetchError("Informasi pemilihan belum dapat diperbarui. Periksa koneksi lalu coba lagi."); }
  }, []);
  const connection = useVotingRealtime(refresh);
  useEffect(() => { const timer = setTimeout(() => setIntro(false), reduced ? 100 : 1350); return () => clearTimeout(timer); }, [reduced]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const election = snapshot?.election;
  const isScheduled = !!election?.opensAt && now < Date.parse(election.opensAt);
  const isEnded = election?.status === "closed" || (!!election?.closesAt && now >= Date.parse(election.closesAt));
  const canVote = !!snapshot?.configured && election?.status === "open" && !isScheduled && !isEnded && !fetchError;
  const status = !snapshot ? "MEMUAT PEMILIHAN" : !election || !snapshot.configured ? "PERSIAPAN PEMILIHAN" : isEnded ? "PEMILIHAN SELESAI" : canVote ? "PEMILIHAN DIBUKA" : "SEGERA DIMULAI";
  const remaining = election?.closesAt && canVote ? Math.max(0, Date.parse(election.closesAt) - now) : null;
  const deadline = remaining !== null ? [Math.floor(remaining / 86400000), Math.floor(remaining / 3600000) % 24, Math.floor(remaining / 60000) % 60] : null;
  return <div className={`${s.experience} ${j.world}`}>
    <a className={s.skipLink} href="#kandidat">Lewati ke kandidat</a>
    <AnimatePresence>{intro && <motion.div className={j.curtain} initial={{ opacity: 1 }} exit={{ opacity: 0, filter: reduced ? "none" : "blur(15px)" }} transition={{ duration: .65 }} aria-hidden="true"><span className={j.introOrbit} /><span>IMO / THE NEXT CHAPTER</span><button onClick={() => setIntro(false)} tabIndex={-1}>Lewati intro <ArrowRight size={14} /></button></motion.div>}</AnimatePresence>
    <motion.div className={s.scrollProgress} style={{ scaleX: scrollYProgress }} />
    <header className={j.nav}><Link href="/" className={j.brand} aria-label="Kembali ke beranda IMO">imo<span>.</span><small>THE NEXT<br />CHAPTER</small></Link><nav aria-label="Navigasi pemilihan"><a href="#kandidat">Para kandidat</a><Link href="/voting/monitor">Live monitor <ArrowUpRight size={13} /></Link></nav><button className={j.navEntry} disabled={!canVote} onClick={() => setRoomOpen(true)} aria-label="Masuk ruang pemilihan"><Fingerprint size={17} /><span>Masuk ruang pemilihan</span><ArrowUpRight size={15} /></button></header>
    <aside className={j.chapterRail} aria-label="Bab perjalanan"><a href="#awal" aria-label="Bab 1: awal">01</a><i /><a href="#kandidat" aria-label="Bab 2: kandidat">02</a><i /><a href="#ruang" aria-label="Bab 3: suaramu">03</a></aside>
    <div className={j.continuousScene}><div className={j.worldMist} /><OrbitalScene reducedMotion={reduced} progress={smooth} journey={sceneJourney} /></div>
    <main>
      <section id="awal" ref={hero} className={j.heroJourney} data-reduced={reduced}><div className={j.heroSticky}>
        <div className={j.heroGlow} aria-hidden="true" /><div className={j.coordinates} aria-hidden="true">IMO {election?.year || "2026"}<span>COLLECTIVE FUTURE / 001</span></div>
        <div className={j.sceneFallback} aria-hidden="true" />
        {!reduced && <span className={j.dragHint} aria-hidden="true">GESER UNTUK MEMUTAR ORBIT</span>}
        <motion.div className={j.heroWords} style={reduced ? {} : { scale: titleScale, z: titleZ, opacity: titleOpacity }}><span className={j.label}>PEMILIHAN KETUA ANGKATAN / {election?.year || "2026"}</span><h1>Satu<br /><em>suara.</em></h1><p>Begitu kecil untuk dunia.<br />Begitu berarti untuk kita.</p></motion.div>
        {!reduced && <motion.div className={j.secondWords} style={{ opacity: secondOpacity, y: secondY }} aria-hidden="true"><span className={j.label}>YOUR VOICE SHAPES WHAT COMES NEXT</span><h2>Arah<br /><em>baru.</em></h2><p>Sebuah masa depan.<br />Dimulai dari pilihanmu.</p></motion.div>}
        <div className={j.heroBottom}><a href="#kandidat">Jelajahi kandidat <span><ArrowDown size={17} /></span></a><span>SCROLL UNTUK MEMULAI PERJALANAN</span><span className={j.status}><i data-live={canVote} />{status}</span></div>
      </div></section>
      <ScrollChapter id="manifesto" reduced={reduced} className={j.manifesto}><span className={j.label}>01 / THE COLLECTIVE FUTURE</span><motion.h2 initial={reduced ? false : { opacity: .15, y: 60, rotateX: 20 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true, amount: .5 }} transition={{ duration: 1 }}>Kita bukan sekadar<br />memilih <em>seseorang.</em><br /><span>Kita memilih</span> <em>arah.</em></motion.h2><div><span className={j.manifestoStar} aria-hidden="true">✳</span><p>Untuk gagasan yang didengar.<br />Untuk langkah yang berani.<br />Untuk angkatan yang tumbuh, bersama.</p></div></ScrollChapter>
      <section id="kandidat" className={j.gallery}>
        <div className={j.galleryHeading}><span className={j.label}>02 / THE PEOPLE BEHIND THE IDEAS</span><h2>Kenali sosoknya.<br /><em>Rasakan gagasannya.</em></h2><p>Setiap pemimpin membawa sebuah cerita.<br />Temukan yang sejalan dengan harapanmu.</p></div>
        {fetchError && <div className={j.notice} role="alert"><span>{fetchError}</span><button onClick={() => void refresh()}>Coba lagi</button></div>}
        {snapshot?.candidates.length ? (
          <>
            {snapshot.candidates.map((item, index) => (
              <CandidatePortrait key={item.id} candidate={item} index={index} reduced={reduced} onInspect={() => setProfile(item)} />
            ))}
            <div className={j.afterCandidates}>
              <span className={j.label}>SUDAH MENEMUKAN PILIHANMU?</span>
              <h2>Sekarang, giliran <em>suaramu.</em></h2>
              <button className={j.entryButton} disabled={!canVote} onClick={() => setRoomOpen(true)}>
                <Fingerprint size={22} />
                <span>{canVote ? "Masuk ruang pemilihan" : isEnded ? "Pemilihan telah selesai" : "Ruang pemilihan belum dibuka"}</span>
                <ArrowUpRight size={21} />
              </button>
              <p>Verifikasi NIM untuk memilih dan mengonfirmasi kandidat.</p>
            </div>
          </>
        ) : (
          <div className={j.emptyGallery}><span className={j.emptyOrbit} aria-hidden="true">?</span><h3>Cerita berikutnya<br /><em>sedang disiapkan.</em></h3><p>Profil resmi kandidat akan muncul setelah diumumkan panitia.</p></div>
        )}
        <div className={j.galleryEnd}><ShieldCheck size={17} /><p>Pilihan ada di tanganmu.<br />Verifikasi NIM terlebih dahulu untuk masuk ke ruang pemilihan.</p><a href="#ruang" aria-label="Lanjut ke ruang pemilihan"><ArrowDown size={22} /></a></div>
      </section>
      <ScrollChapter id="alur" reduced={reduced} className={j.process}><div><span className={j.label}>03 / MAKE IT COUNT</span><h2>Langkah kecil.<br /><em>Dampak besar.</em></h2></div><ol>{[["Kenali kandidatnya.", "Baca visi, pahami misinya. Temukan sosok yang sejalan dengan harapanmu."], ["Pastikan identitasmu.", "Masukkan NIM terdaftar. Verifikasi untuk membuka ruang pemilihan."], ["Percayakan suaramu.", "Pilih kandidat, lalu geser untuk mengonfirmasi. Satu NIM, satu suara yang berarti."]].map(([title, body], index) => <motion.li key={title} initial={reduced ? false : { opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .6 }} transition={{ duration: .6 }}><span>0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div></motion.li>)}</ol></ScrollChapter>
      <ScrollChapter id="ruang" reduced={reduced} isLast className={j.entry}><div className={j.entryHalo} aria-hidden="true" /><span className={j.label}>THE NEXT CHAPTER STARTS WITH YOU</span><h2>Masa depan kita.<br /><em>Ada di suaramu.</em></h2><p>Masuk dengan NIM. Tentukan pilihan.<br />Jadilah bagian dari arah yang baru.</p><button className={j.entryButton} disabled={!canVote} onClick={() => setRoomOpen(true)}><Fingerprint size={22} /><span>{canVote ? "Masuk ruang pemilihan" : isEnded ? "Pemilihan telah selesai" : "Ruang pemilihan belum dibuka"}</span><ArrowUpRight size={21} /></button>{deadline && <div className={j.deadline} aria-label="Waktu voting tersisa">{deadline.map((value, index) => <span key={index}><strong>{String(value).padStart(2, "0")}</strong>{["HARI", "JAM", "MENIT"][index]}</span>)}</div>}<small><ShieldCheck size={13} /> Satu NIM. Satu suara. Satu masa depan.</small></ScrollChapter>
    </main>
    <nav className={j.floatingNav} aria-label="Navigasi perjalanan"><a href="#awal" aria-label="Kembali ke awal"><span aria-hidden="true">&#10035;</span></a><a href="#kandidat">Kandidat</a><button disabled={!canVote} onClick={() => setRoomOpen(true)}><Fingerprint size={16} /> Buka bilik suara</button><a href="#ruang" aria-label="Lanjut ke bab suaramu"><ArrowDown size={18} /></a></nav>
    <div className={j.connection}><i data-live={connection === "live"} />{connection === "live" ? "TERHUBUNG" : connection === "offline" ? "OFFLINE" : connection === "unconfigured" ? "PERSIAPAN" : "MENGHUBUNGKAN"}</div>
    {voted && !roomOpen && <div className={s.voteToast} role="status"><ShieldCheck size={17} /> Suaramu sudah tercatat.<button onClick={() => setVoted(false)} aria-label="Tutup pemberitahuan"><X size={15} /></button></div>}
    <AnimatePresence>{profile && <CandidateDetails key={profile.id} candidate={profile} onClose={() => setProfile(null)} />}</AnimatePresence>
    {roomOpen && election && <VotingBooth key={election.id} candidates={snapshot?.candidates ?? []} election={election} onClose={() => setRoomOpen(false)} onVoted={() => { setVoted(true); void refresh(); }} />}
  </div>;
}
