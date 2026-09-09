"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, CheckCheck, Fingerprint, LoaderCircle, LockKeyhole, LogOut, ShieldCheck, X } from "lucide-react";
import type { Candidate, Election, VoterSession } from "@/lib/voting/types";
import s from "./voting.module.css";
import SwipeAction from "./SwipeAction";
import CandidateFlip from "./CandidateFlip";

const headers = { "Content-Type": "application/json", "X-Voting-Request": "1" };

function BallotVisual({ candidate, selected = false, reduced }: { candidate: Candidate; selected?: boolean; reduced: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return <CandidateFlip number={candidate.number} inline><span className={s.ballotVisual}>
    {candidate.photoUrl && failedUrl !== candidate.photoUrl ? (
      // eslint-disable-next-line @next/next/no-img-element -- Uses the same server-provided R2 photo as the public profile.
      <img className={s.ballotPhoto} src={candidate.photoUrl} alt={`Foto ${candidate.name}`} onError={() => setFailedUrl(candidate.photoUrl)} />
    ) : <span className={s.ballotInitials} aria-label={`Foto ${candidate.name} belum tersedia`}>{candidate.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span>}
    <span className={s.ballotFade} aria-hidden="true" />
    <span className={s.ballotChoiceNumber}>{String(candidate.number).padStart(2, "0")}</span>
    <span className={s.ballotVisualIcon} aria-hidden="true">{selected ? <Check size={19} /> : <ArrowRight size={19} />}</span>
    <motion.span className={s.ballotInformation} initial={reduced ? false : { opacity: 0, y: 12, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: .55, delay: reduced ? 0 : .38 }}>
      <span className={s.ballotCaption}>{selected ? "PILIHANMU" : "CALON KETUA ANGKATAN"}</span>
      <strong>{candidate.name}</strong>
      {candidate.tagline && <span className={s.ballotTagline}>{candidate.tagline}</span>}
    </motion.span>
  </span></CandidateFlip>;
}

export default function VotingBooth({ candidates, election, onClose, onVoted }: {
  candidates: Candidate[]; election: Election; onClose: () => void; onVoted: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const identityForm = useRef<HTMLFormElement>(null);
  const inFlight = useRef(false);
  const reduced = useReducedMotion();
  const [session, setSession] = useState<VoterSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [nim, setNim] = useState("");
  const [receipt, setReceipt] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const needsNameConfirmation = !!session?.voterName && !identityConfirmed;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const candidate = candidates.find(item => item.id === selectedId) ?? null;
  const stage = loading ? "loading" : receipt ? "receipt" : session?.verified ? needsNameConfirmation ? "name" : candidate ? "confirm" : "choose" : "identity";

  useEffect(() => {
    if (stage === "loading") return;
    if (dialog.current) dialog.current.scrollTop = 0;
    const target = stage === "identity" ? dialog.current?.querySelector<HTMLInputElement>('input[name="nim"]') : dialog.current?.querySelector<HTMLElement>('#booth-title');
    if (target) { if (stage !== "identity") target.tabIndex = -1; target.focus({ preventScroll: true }); }
  }, [stage]);

  useEffect(() => {
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const abort = new AbortController();
    fetch("/api/voting/session", { cache: "no-store", signal: abort.signal }).then(async (res) => {
      if (!res.ok) throw new Error("Sesi belum dapat diperiksa. Coba lagi.");
      const data: VoterSession = await res.json();
      const matchesElection = data.electionId === election.id;
      setSession(matchesElection ? data : { verified: false });
      if (matchesElection && data.hasVoted) setReceipt(data.receipt || "Tercatat");
    }).catch((err) => { if (!abort.signal.aborted) setError(err.message); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => { abort.abort(); document.body.style.overflow = previous; };
  }, [election.id]);

  useEffect(() => {
    if (!session?.expiresAt || !session.verified || receipt) return;
    const expiry = Date.parse(session.expiresAt);
    const tick = () => {
      const seconds = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) { setSession({ verified: false }); setIdentityConfirmed(false); setSelectedId(null); setError("Sesi berakhir. Verifikasi kembali untuk melanjutkan."); }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session, receipt]);

  async function verify(event?: FormEvent) {
    event?.preventDefault();
    if (busy || inFlight.current || !identityForm.current?.reportValidity()) return;
    inFlight.current = true;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/voting/session", { method: "POST", headers, body: JSON.stringify({ nim, electionId: election.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verifikasi belum berhasil.");
      setSession(data); setNim(""); setSelectedId(null);
      if (data.hasVoted) setReceipt(data.receipt || "Tercatat");
    } catch (err) { setError(err instanceof Error ? err.message : "Koneksi terputus. Coba kembali."); }
    finally { inFlight.current = false; setBusy(false); }
  }

  async function vote() {
    if (needsNameConfirmation || busy || inFlight.current || !candidate || !session?.verified || session.hasVoted || receipt) return;
    inFlight.current = true;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/voting/vote", { method: "POST", headers, body: JSON.stringify({ candidateId: candidate.id, electionId: election.id }) });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { setSession({ verified: false }); setIdentityConfirmed(false); setSelectedId(null); }
        throw new Error(data.error || "Suara belum dapat dikirim.");
      }
      setReceipt(data.receipt); onVoted();
    } catch (err) {
      // A response may be lost after a successful commit. Recover the receipt before offering a retry.
      try {
        const check = await fetch("/api/voting/session", { cache: "no-store" });
        if (check.ok) {
          const current: VoterSession = await check.json();
          if (current.electionId === election.id && current.hasVoted && current.receipt) { setReceipt(current.receipt); onVoted(); return; }
        }
      } catch { /* Keep the original error when recovery is offline. */ }
      setError(err instanceof Error ? err.message : "Koneksi terputus. Periksa koneksi lalu coba lagi.");
    } finally { inFlight.current = false; setBusy(false); }
  }

  async function logout() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/voting/session", { method: "DELETE", headers });
      if (!res.ok) throw new Error("Sesi belum dapat diakhiri.");
      setSession({ verified: false }); setIdentityConfirmed(false); setSelectedId(null);
    } catch (err) { setError(err instanceof Error ? err.message : "Koneksi terputus."); }
    finally { setBusy(false); }
  }

  return (
    <dialog ref={dialog} className={`${s.dialog} ${s.roomDialog}`} data-stage={stage} aria-labelledby="booth-title" onCancel={(event) => { if (busy) event.preventDefault(); else onClose(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div className={s.booth}>
        <div className={s.roomAtmosphere} aria-hidden="true"><i /><span>YOUR VOICE.<br />OUR FUTURE.</span><strong>{stage === "receipt" ? "03" : stage === "confirm" || stage === "choose" ? "02" : "01"}</strong><small>THE NEXT CHAPTER / IMO</small></div>
        <div className={s.boothTop}><span><LockKeyhole size={13} /> BILIK SUARA</span><button className={s.iconButton} onClick={onClose} disabled={busy} aria-label="Tutup bilik suara"><X size={20} /></button></div>
        <div className={s.boothJourney} aria-label="Tahapan voting">{["Identitas", "Pilihan", "Tercatat"].map((label, i) => <span key={label} data-active={i <= (receipt ? 2 : session?.verified ? 1 : 0)}><i>{i + 1}</i>{label}</span>)}</div>
        <motion.div key={stage} initial={reduced ? false : { opacity: 0, y: 18, filter: "blur(5px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: .4 }}>
        {loading ? <div className={s.boothLoading}><LoaderCircle className={s.spin} /><h2 id="booth-title">Memeriksa sesi…</h2></div> : receipt ? (
          <div className={s.success}>
            <motion.div className={s.successIcon} initial={reduced ? false : { scale: .4, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 180, damping: 13 }}><CheckCheck size={32} /></motion.div>
            <span className={s.eyebrow}>YOUR VOICE. OUR FUTURE.</span>
            <h2 id="booth-title">Suaramu telah<br /><em>menjadi bagian.</em></h2>
            <p>Suara untuk pemilihan ini sudah tercatat. Terima kasih telah ikut menentukan arah angkatan.</p>
            <div className={s.receipt}><span>TANDA TERIMA</span><code>{receipt}</code></div>
            <p className={s.formHint}>Simpan tanda terima ini. Pilihanmu tidak ditampilkan pada halaman monitoring.</p>
            <button className={s.primaryButton} onClick={onClose}>Kembali ke perjalanan <ArrowRight size={17} /></button>
          </div>
        ) : session?.verified ? (
          <>
            <div className={s.verifiedBadge}><ShieldCheck size={14} /> NIM {session.nimMasked} terverifikasi <span>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span></div>
            {needsNameConfirmation ? <>
              <h2 id="booth-title">Pastikan<br /><em>ini namamu.</em></h2>
              <p className={s.boothIntro}>Nama yang terdaftar untuk NIM ini:</p><p className={s.voterName}>{session.voterName}</p>
              <p className={s.formHint}>Jika nama tidak sesuai, gunakan NIM lain atau hubungi panitia sebelum melanjutkan.</p>
              <button className={s.primaryButton} disabled={busy} onClick={() => setIdentityConfirmed(true)}>Ya, ini nama saya <ArrowRight size={17} /></button>
            </> : candidate ? <>
            <h2 id="booth-title">Satu pilihan.<br /><em>Satu komitmen.</em></h2>
            <p className={s.boothIntro}>Pastikan ini calon yang ingin kamu percayakan untuk memimpin perjalanan kita.</p>
            <div className={s.ballotCandidate}><BallotVisual key={candidate.id} candidate={candidate} selected reduced={!!reduced} /></div>
            <p className={s.confirmLabel}>Dengan menggeser sampai ujung, saya mengonfirmasi pilihan ini. Suara yang dikirim tidak dapat diubah.</p>
            {error && <p className={s.formError} role="alert">{error}</p>}
            <SwipeAction label="Geser untuk kirim suara" busyLabel="Mencatat suaramu…" busy={busy} onComplete={vote} />
            <button className={s.logout} onClick={() => { setSelectedId(null); setError(""); }} disabled={busy}>Kembali ke daftar kandidat</button>
            </> : <>
              <h2 id="booth-title">Selamat datang.<br /><em>Tentukan arahmu.</em></h2>
              <p className={s.boothIntro}>{session.voterName ? `Selamat datang, ${session.voterName}.` : "NIM terverifikasi. Nama belum dilengkapi oleh panitia."} Pilih kandidat, lalu konfirmasi dengan swipe. Suara belum dikirim saat kamu memilih kandidat.</p>
              <div className={s.ballotChoices}>{candidates.map((item, index) => <motion.button type="button" key={item.id} className={s.ballotChoice} aria-label={`Pilih ${item.name}`} disabled={busy} onClick={() => { setSelectedId(item.id); setError(""); }} initial={reduced ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduced ? 0 : Math.min(index, 6) * .06 }} whileTap={reduced ? {} : { scale: .98 }}><BallotVisual candidate={item} reduced={!!reduced} /></motion.button>)}</div>
              {!candidates.length && <p className={s.boothIntro}>Kandidat belum tersedia. Silakan kembali setelah pengumuman panitia.</p>}
              {error && <p className={s.formError} role="alert">{error}</p>}
            </>}
            <button className={s.logout} onClick={logout} disabled={busy}><LogOut size={13} /> Gunakan NIM lain</button>
          </>
        ) : (
          <form ref={identityForm} onSubmit={(event) => event.preventDefault()}>
            <Fingerprint size={32} className={s.boothFingerprint} />
            <h2 id="booth-title">Ini suaramu.<br /><em>Pastikan itu kamu.</em></h2>
            <p className={s.boothIntro}>Masukkan NIM terdaftar kamu untuk masuk ke bilik suara.</p>
            <label className={s.field}>Nomor Induk Mahasiswa<input autoFocus name="nim" autoComplete="username" placeholder="Masukkan NIM kamu" value={nim} onChange={(event) => setNim(event.target.value)} required maxLength={64} disabled={busy} /></label>
            {error && <p className={s.formError} role="alert">{error}</p>}
            <SwipeAction label="Geser untuk verifikasi" busyLabel="Memverifikasi NIM…" busy={busy} disabled={!nim.trim()} onComplete={() => verify()} />
            <p className={s.formHint}><ShieldCheck size={13} /> Sesi aman selama 15 menit. Satu NIM, satu suara.</p>
          </form>
        )}
        </motion.div>
      </div>
    </dialog>
  );
}
