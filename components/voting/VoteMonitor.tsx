"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDownToLine, ArrowLeft, ArrowUpRight, Activity, Check, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { useVotingRealtime, type VotingRealtimeStatus } from "@/hooks/useVotingRealtime";
import type { MonitorSnapshot } from "@/lib/voting/types";
import styles from "./monitor.module.css";

type MonitorError = { status: number; message: string };
const number = new Intl.NumberFormat("id-ID");
const percent = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const clock = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta",
});
const shortClock = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
});

function AnimatedValue({ value, decimal = false }: { value: number; decimal?: boolean }) {
  const reduced = useReducedMotion();
  const count = useMotionValue(0);
  const display = useTransform(count, current => decimal ? percent.format(current) : number.format(Math.round(current)));
  useEffect(() => {
    const animation = animate(count, value, { duration: reduced ? 0 : .85, ease: [ .22, 1, .36, 1 ] });
    return () => animation.stop();
  }, [value, count, reduced]);
  return <><span className={styles.srOnly}>{decimal ? percent.format(value) : number.format(value)}</span><motion.strong className={styles.animatedValue} aria-hidden="true">{display}</motion.strong></>;
}

function MonitorPortrait({ name, photoUrl, number: candidateNumber }: { name: string; photoUrl: string | null; number: number }) {
  const [failed, setFailed] = useState(false);
  return <span className={styles.candidatePortrait}>
    {photoUrl && !failed ? (
      // eslint-disable-next-line @next/next/no-img-element -- Same server-validated photo URL as the candidate profile.
      <img src={photoUrl} alt={`Foto ${name}`} loading="lazy" onError={() => setFailed(true)} />
    ) : <span aria-hidden="true">{name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span>}
    <small>{String(candidateNumber).padStart(2, "0")}</small>
  </span>;
}

const connectionLabels: Record<VotingRealtimeStatus, string> = {
  connecting: "Menghubungkan",
  live: "Live",
  reconnecting: "Menghubungkan ulang",
  offline: "Koneksi terputus",
  unconfigured: "Realtime belum tersedia",
};

function safeTime(value: string, short = false) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? (short ? shortClock : clock).format(date) : "—";
}

function VoteTimeline({ timeline }: { timeline: MonitorSnapshot["timeline"] }) {
  const gradientId = useId().replaceAll(":", "");
  const reduced = useReducedMotion();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const series = [...timeline].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  if (!series.length || !series.some((point) => point.votes > 0)) {
    return <div className={styles.emptyChart}><Activity size={25} strokeWidth={1} /><p>Menunggu suara pertama.</p><span>Aktivitas pemilihan akan muncul di sini.</span></div>;
  }
  const max = Math.max(1, ...series.map((point) => point.votes));
  const points = series.map((point, index) => ({
    x: series.length === 1 ? 340 : 46 + (index / (series.length - 1)) * 570,
    y: 159 - (point.votes / max) * 125,
  }));
  const line = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${points.at(-1)!.x} 159 L ${points[0].x} 159 Z`;
  const selectedIndex = Math.max(0, series.findIndex(point => point.time === selectedTime));
  const selected = series[selectedIndex];
  return (
    <>
      <div className={styles.chartReadout} aria-live="polite"><span>{safeTime(selected.time, true)} WIB</span><strong key={`${selected.time}-${selected.votes}`}>{number.format(selected.votes)} <small>suara masuk</small></strong></div>
      <svg viewBox="0 0 650 194" className={styles.chart} role="group" aria-label="Grafik interaktif suara per jam. Sentuh titik atau gunakan Tab untuk detail.">
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#cbb78c" stopOpacity=".22" /><stop offset="100%" stopColor="#cbb78c" stopOpacity="0" /></linearGradient></defs>
        {[0, 0.5, 1].map((ratio) => <g key={ratio}><line x1="46" x2="616" y1={159 - ratio * 125} y2={159 - ratio * 125} stroke="#ffffff12" strokeDasharray="3 6" /><text x="28" y={163 - ratio * 125} textAnchor="end" fill="#858785" fontSize="10">{number.format(Math.round(max * ratio))}</text></g>)}
        {series.length > 1 && <path d={area} fill={`url(#${gradientId})`} />}
        <motion.path d={line} initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} fill="none" stroke="#cbb78c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1={points[selectedIndex].x} x2={points[selectedIndex].x} y1="22" y2="159" stroke="#cbb78c55" strokeDasharray="3 5" />
        {points.map((point, index) => <g key={series[index].time} className={styles.chartPoint} tabIndex={0} role="button" aria-label={`${safeTime(series[index].time, true)} WIB: ${number.format(series[index].votes)} suara`} aria-pressed={index === selectedIndex} onPointerEnter={() => setSelectedTime(series[index].time)} onFocus={() => setSelectedTime(series[index].time)} onClick={() => setSelectedTime(series[index].time)} onKeyDown={event => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); setSelectedTime(series[index].time); } }}><circle cx={point.x} cy={point.y} r="15" fill="transparent" /><motion.circle cx={point.x} cy={point.y} animate={{ r: index === selectedIndex ? 6 : 3 }} transition={{ duration: reduced ? 0 : .2 }} fill="#cbb78c" stroke="#080a0c" strokeWidth="2" /></g>)}
        <text x="46" y="187" fill="#858785" fontSize="10">{safeTime(series[0].time, true)} WIB</text>
        {series.length > 1 && <text x="616" y="187" textAnchor="end" fill="#858785" fontSize="10">{safeTime(series.at(-1)!.time, true)} WIB</text>}
      </svg>
      <details className={styles.chartData}>
        <summary>Lihat data aktivitas</summary>
        <div><table><caption>Jumlah suara per jam (WIB)</caption><thead><tr><th scope="col">Waktu</th><th scope="col">Suara masuk</th></tr></thead><tbody>{series.map((point, index) => <tr key={`${point.time}-${index}`}><td>{safeTime(point.time, true)}</td><td>{number.format(point.votes)}</td></tr>)}</tbody></table></div>
      </details>
    </>
  );
}

function UnavailableState({ fault, loading, onRetry }: { fault: MonitorError | null; loading: boolean; onRetry: () => void }) {
  const title = !fault ? "Menyiapkan ruang pantau." : fault.status === 401 ? "Ruang khusus panitia." : fault.status === 403 ? "Akses panitia diperlukan." : fault.status === 503 ? "Pemilihan sedang disiapkan." : "Data belum dapat dimuat.";
  const description = !fault ? "Mengambil data pemilihan terbaru dengan koneksi aman." : fault.status === 401 ? "Masuk dengan akun admin untuk memantau perolehan suara secara realtime." : fault.status === 403 ? "Akun ini belum memiliki akses monitoring pemilihan. Hubungi administrator untuk mendapatkan akses." : fault.status === 503 ? "Database pemilihan belum siap. Data akan muncul setelah konfigurasi selesai." : fault.message;
  return (
    <section className={styles.unavailable} aria-live="polite" aria-busy={loading}>
      <div className={styles.stateIcon}>{loading ? <RefreshCw className={styles.spinning} size={25} strokeWidth={1} /> : <LockKeyhole size={25} strokeWidth={1} />}</div>
      <span className={styles.eyebrow}>{loading ? "Mengambil data" : "Monitoring pemilihan"}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {fault?.status === 401 || fault?.status === 403 ? <Link href="/admin/voting" className={styles.goldButton}>Masuk sebagai admin <ArrowUpRight size={15} /></Link> : fault ? <button className={styles.goldButton} type="button" onClick={onRetry} disabled={loading}>Coba lagi <RefreshCw size={14} className={loading ? styles.spinning : undefined} /></button> : null}
      <span className={styles.stateNote}><ShieldCheck size={13} /> Hanya data agregat. Identitas pemilih tetap privat.</span>
    </section>
  );
}

export default function VoteMonitor() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  async function exportResults(snapshot: MonitorSnapshot) {
    if (!snapshot.election || exporting) return;
    setExporting(true); setExportError("");
    try {
      const response = await fetch(`/api/voting/report?election=${encodeURIComponent(snapshot.election.id)}`, { cache: "no-store" });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Rekap belum dapat diunduh."); }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `rekap-pemilihan-${new Date().toISOString().slice(0,10)}.docx`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setExportError(error instanceof Error ? error.message : "Koneksi terputus. Coba unduh kembali."); }
    finally { setExporting(false); }
  }

  const heading = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heading, offset: ["start start", "end start"] });
  const depth = useSpring(scrollYProgress, { stiffness: 65, damping: 26 });
  const orbitRotate = useTransform(depth, [0, 1], [-25, 55]);
  const orbitY = useTransform(depth, [0, 1], [0, 100]);
  const [snapshot, setSnapshot] = useState<MonitorSnapshot | null>(null);
  const [fault, setFault] = useState<MonitorError | null>(null);
  const [refreshing, setRefreshing] = useState(true);
  const reduced = useReducedMotion();
  const [sortBy, setSortBy] = useState<"number" | "votes">("number");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setRefreshing(true);
    try {
      const response = await fetch("/api/voting/monitor", { cache: "no-store", credentials: "same-origin", signal: controller.signal });
      if (!response.ok) {
        if ([401, 403, 503].includes(response.status)) setSnapshot(null);
        setFault({ status: response.status, message: "Koneksi ke data pemilihan terganggu. Pembaruan otomatis akan mencoba kembali." });
        return;
      }
      const data: MonitorSnapshot = await response.json();
      if (!controller.signal.aborted) {
        setSnapshot(data);
        setFault(null);
      }
    } catch {
      if (!controller.signal.aborted) setFault({ status: 0, message: "Tidak dapat terhubung. Periksa koneksi internet; data akan diperbarui saat koneksi kembali." });
    } finally {
      if (!controller.signal.aborted) setRefreshing(false);
    }
  }, []);

  useEffect(() => () => request.current?.abort(), []);

  const realtimeStatus = useVotingRealtime(() => void refresh());
  const live = realtimeStatus === "live" && Boolean(snapshot) && !fault;
  const connectionText = fault ? "Pembaruan tertunda" : connectionLabels[realtimeStatus];
  const turnout = snapshot && snapshot.eligibleVoters > 0 ? Math.min(100, snapshot.totalVotes / snapshot.eligibleVoters * 100) : 0;
  const remaining = snapshot ? Math.max(0, snapshot.eligibleVoters - snapshot.totalVotes) : 0;
  const electionStatus = snapshot?.election?.status;
  const resultMap = new Map(snapshot?.results.map((result) => [result.candidateId, result.votes]));
  const candidates = snapshot ? [...snapshot.candidates].sort((a, b) => (sortBy === "votes" ? (resultMap.get(b.id) ?? 0) - (resultMap.get(a.id) ?? 0) : 0) || a.number - b.number) : [];

  return (
    <div className={styles.monitor}>
      <a className={styles.skipLink} href="#monitor-content">Langsung ke data pemilihan</a>
      <header className={styles.nav}>
        <Link href="/voting" className={styles.brand} aria-label="IMO, kembali ke halaman pemilihan"><span>IMO<span className={styles.brandDot}>.</span></span><i /><span className={styles.brandChapter}>THE NEXT<br />CHAPTER</span></Link>
        <div className={styles.navRight}><Link href="/admin/voting" className={styles.privateLabel}><LockKeyhole size={12} /> KELOLA PEMILIHAN</Link><Link href="/voting" className={styles.backLink}><ArrowLeft size={14} /><span>Halaman pemilihan</span></Link></div>
      </header>

      <main id="monitor-content" className={styles.content}>
        <section ref={heading} className={styles.heading}>
          <motion.div className={styles.observatoryOrbit} style={reduced ? {} : { rotate: orbitRotate, y: orbitY }} aria-hidden="true"><i /><i /><i /></motion.div>
          <div><p className={styles.eyebrow}><span className={styles.tinyLine} /> THE ELECTION OBSERVATORY</p><h1>Setiap suara.<br /><em>Satu arah baru.</em></h1><p className={styles.intro}>Ruang pantau pemilihan ketua angkatan.</p></div>
          <div className={styles.headingAside}><span className={`${styles.connection} ${live ? styles.isLive : ""}`} role="status"><i />{connectionText}</span><span className={styles.electionLabel}>{snapshot?.election?.title || "PEMILIHAN KETUA ANGKATAN"}</span><span className={styles.lastUpdated}>{snapshot ? `Diperbarui ${safeTime(snapshot.updatedAt)} WIB` : "Menunggu data terverifikasi"}</span></div>
        </section>

        {!snapshot ? <UnavailableState fault={fault} loading={refreshing} onRetry={() => void refresh()} /> : <>
          {fault && <div className={styles.errorNotice} role="alert"><Activity size={16} /><span>{fault.message} Angka di bawah adalah data terakhir yang berhasil dimuat.</span><button type="button" onClick={() => void refresh()} disabled={refreshing}>Coba lagi</button></div>}

          <motion.section className={styles.metrics} initial={reduced ? false : { opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }} aria-label="Ringkasan partisipasi">
            <div className={styles.totalBlock}><div className={styles.sectionLabel}><span>01 / SUARA TERKUMPUL</span><span className={styles.verified}><ShieldCheck size={13} /> TERVERIFIKASI</span></div><div className={styles.totalNumber} aria-live="polite" aria-atomic="true"><AnimatedValue value={snapshot.totalVotes} /><span>suara</span></div><div className={styles.totalFoot}><span className={styles.statusDot} data-open={electionStatus === "open"} />{electionStatus === "open" ? "Pemilihan sedang berlangsung" : electionStatus === "closed" ? "Pemilihan telah ditutup" : electionStatus === "draft" ? "Pemilihan belum dibuka" : "Belum ada pemilihan aktif"}<span>{snapshot.election?.year || "—"}</span></div></div>
            <div className={styles.turnoutBlock}><span className={styles.sectionLabel}>02 / PARTISIPASI ANGKATAN</span><div className={styles.turnoutBody}><div className={styles.ring}><svg viewBox="0 0 128 128" aria-hidden="true"><circle cx="64" cy="64" r="55" fill="none" stroke="#ffffff0d" strokeWidth="3" /><circle cx="64" cy="64" r="55" fill="none" stroke="#cbb78c" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${turnout * 3.45575} 345.575`} transform="rotate(-90 64 64)" /></svg><div><strong>{snapshot.eligibleVoters ? <AnimatedValue value={turnout} decimal /> : "—"}<small>{snapshot.eligibleVoters ? "%" : ""}</small></strong><span>PARTISIPASI</span></div></div><div className={styles.turnoutLegend}><div><i /><span>Sudah memilih<strong><AnimatedValue value={snapshot.totalVotes} /></strong></span></div><div><i /><span>Belum memilih<strong><AnimatedValue value={remaining} /></strong></span></div></div></div><p className={styles.registered}>{snapshot.eligibleVoters ? <><strong>{number.format(snapshot.eligibleVoters)}</strong> mahasiswa dalam daftar pemilih</> : "Daftar pemilih belum tersedia"}</p></div>
          </motion.section>

          <div className={styles.lowerGrid}>
            <section className={styles.results} aria-labelledby="results-title">
              <div className={styles.panelHeader}><div><span className={styles.eyebrow}>THE CANDIDATES</span><h2 id="results-title">Perolehan suara</h2></div><span className={styles.smallCounter}>{String(candidates.length).padStart(2, "0")} KANDIDAT</span></div>
              <div className={styles.sortControls} role="group" aria-label="Urutkan kandidat">{([{ value: "number", label: "Nomor urut" }, { value: "votes", label: "Suara terbanyak" }] as const).map(option => <button key={option.value} type="button" aria-pressed={sortBy === option.value} onClick={() => setSortBy(option.value)}>{sortBy === option.value && <motion.span layoutId="monitor-sort" className={styles.sortIndicator} transition={{ duration: reduced ? 0 : .25 }} />}<span>{option.label}</span></button>)}</div>
              {candidates.length ? <ol className={styles.candidateList}>{candidates.map((candidate, index) => {
                const votes = resultMap.get(candidate.id) ?? 0;
                const share = snapshot.totalVotes ? votes / snapshot.totalVotes * 100 : 0;
                const expanded = expandedId === candidate.id;
                return <motion.li layout={!reduced} key={candidate.id} className={styles.candidate} initial={reduced ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ layout: { type: "spring", stiffness: 250, damping: 28 }, opacity: { delay: Math.min(index, 6) * .06 } }}>
                  <MonitorPortrait name={candidate.name} photoUrl={candidate.photoUrl} number={candidate.number} />
                  <div className={styles.candidateBody}>
                    <button type="button" className={styles.resultToggle} onClick={() => setExpandedId(expanded ? null : candidate.id)} aria-expanded={expanded} aria-controls={`result-${candidate.id}`}>
                      <span className={styles.candidateHeading}><span><strong className={styles.resultName}>{candidate.name}</strong><small>{expanded ? "Tutup rincian −" : "Lihat rincian +"}</small></span><span className={styles.voteCount}><AnimatedValue value={votes} /><span>{percent.format(share)}%</span></span></span>
                    </button>
                    <div className={styles.barTrack} role="meter" aria-label={`Perolehan ${candidate.name}`} aria-valuenow={Math.round(share * 10) / 10} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${number.format(votes)} suara, ${percent.format(share)} persen`}><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, share)}%` }} transition={{ duration: reduced ? 0 : .85, ease: [.22, 1, .36, 1] }} /></div>
                    <AnimatePresence initial={false}>{expanded && <motion.div id={`result-${candidate.id}`} className={styles.resultDetail} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduced ? 0 : .25 }}><p>{candidate.tagline || "Calon ketua angkatan"}</p><span>{number.format(votes)} dari {number.format(snapshot.totalVotes)} suara tercatat · {percent.format(share)}% perolehan.</span></motion.div>}</AnimatePresence>
                  </div>
                </motion.li>;
              })}</ol> : <p className={styles.emptyResults}>Kandidat belum ditambahkan untuk pemilihan ini.</p>}
              <p className={styles.resultNote}><Check size={12} />{electionStatus === "closed" ? "Rekap suara tersimpan setelah pemilihan ditutup." : "Perolehan sementara. Hasil akhir mengikuti penetapan panitia."}</p>
            </section>
            <section className={styles.activity} aria-labelledby="activity-title"><div className={styles.panelHeader}><div><span className={styles.eyebrow}>THE MOMENTUM</span><h2 id="activity-title">Aktivitas pemilihan</h2></div><Activity size={19} strokeWidth={1.3} className={styles.activityIcon} /></div><p className={styles.chartDescription}>Suara per jam · 24 jam terakhir · WIB</p><VoteTimeline timeline={snapshot.timeline} /><div className={styles.connectionNote}><span className={live ? styles.liveDot : styles.idleDot} /><span>{live ? "Terhubung ke pembaruan realtime." : "Pengecekan otomatis setiap 15 detik saat halaman aktif."}</span></div></section>
          </div>

          {exportError && <p role="alert">{exportError}</p>}<div className={styles.toolbar}><p><ShieldCheck size={15} /> Identitas dan pilihan individu tidak ditampilkan.</p><div><button className={styles.subtleButton} type="button" onClick={() => void refresh()} disabled={refreshing}><RefreshCw size={13} className={refreshing ? styles.spinning : undefined} />{refreshing ? "Memperbarui" : "Perbarui"}</button><button className={styles.exportButton} type="button" disabled={exporting} onClick={() => void exportResults(snapshot)}><ArrowDownToLine size={14} /> {exporting ? "Menyiapkan Word…" : "Unduh rekap Word"}</button></div></div>
        </>}
      </main>
      <footer className={styles.footer}><span>IMO<span className={styles.brandDot}>.</span> <span>THE NEXT CHAPTER</span></span><p>Satu angkatan. Satu masa depan.</p><Link href="/admin/dashboard">Dashboard admin <ArrowUpRight size={12} /></Link></footer>
    </div>
  );
}
