"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, ShieldCheck } from "lucide-react";
import type { AdminSnapshot } from "@/lib/voting/admin-types";
import s from "./admin.module.css";

export default function VotingReset() {
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [accepted, setAccepted] = useState(false);
  const requestId = useRef<string | null>(null);
  async function load(id?: string) {
    setLoading(true); setError(""); setSnapshot(null); setConfirmation(""); setAccepted(false); requestId.current = null;
    try {
      const response = await fetch(`/api/voting/admin${id ? `?election=${encodeURIComponent(id)}` : ""}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ringkasan belum tersedia.");
      setSnapshot(data);
    } catch (error) { setError(error instanceof Error ? error.message : "Koneksi terputus."); }
    finally { setLoading(false); }
  }
  useEffect(() => { const timer = setTimeout(() => void load(new URLSearchParams(window.location.search).get("election") || undefined), 0); return () => clearTimeout(timer); }, []);
  const election = snapshot?.election;
  async function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!election || busy) return;
    setBusy(true); setError("");
    requestId.current ||= crypto.randomUUID();
    try {
      const response = await fetch("/api/voting/admin/reset", {
        method: "POST", headers: { "Content-Type": "application/json", "X-Voting-Request": "1" },
        body: JSON.stringify({ electionId: election.id, title: election.title, expectedVotes: snapshot.totalVotes, confirmation, requestId: requestId.current }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Reset belum dapat dikonfirmasi.");
      setSuccess(`${data.removedVotes} suara dihapus. Pemilihan kembali ke draft. Kandidat, foto, dan daftar NIM tetap tersimpan.`);
      setConfirmation(""); setAccepted(false);
    } catch (error) { setError(error instanceof Error ? error.message : "Koneksi terputus. Coba reset kembali untuk memeriksa hasil permintaan yang sama."); }
    finally { setBusy(false); }
  }
  return <div className={s.page}><header className={s.nav}><Link href="/admin/voting" className={s.brand}>imo<span>.</span></Link><Link href="/admin/voting"><ArrowLeft size={16} /> Kembali ke ruang panitia</Link></header><main className={`${s.main} ${s.resetMain}`}>
    <div className={s.heading}><span>AKSES PANITIA / RESET PEMILIHAN</span><h1>Mulai kembali<br /><em>dari nol.</em></h1><p>Reset hasil pemilihan yang sudah ditutup atau masih draft.</p></div>
    {error && <div className={s.error} role="alert">{error}<button className={s.secondary} disabled={busy || loading} onClick={() => void load(election?.id)}>Muat ulang ringkasan</button></div>}
    {loading ? <p role="status">Memuat ringkasan pemilihan…</p> : success ? <section className={s.panel}><ShieldCheck /><h2>Reset selesai</h2><p role="status">{success}</p><Link href="/admin/voting" className={s.primary}>Atur kembali pemilihan</Link></section> : snapshot && <section className={s.panel}>
      <label>Pemilihan yang akan direset<select disabled={busy} value={election?.id || ""} onChange={event => void load(event.target.value)}><option value="" disabled>Pilih pemilihan</option>{snapshot.elections.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      {election ? <><div className={s.resetSummary}><div><span>SUARA AKAN DIHAPUS</span><strong>{snapshot.totalVotes.toLocaleString("id-ID")}</strong></div><div><span>STATUS SAAT INI</span><strong>{election.status === "open" ? "Dibuka" : election.status === "closed" ? "Ditutup" : "Draft"}</strong></div></div>
      <h2>Yang terjadi setelah reset</h2><ul className={s.resetEffects}><li>Semua suara, tanda terima, dan rekap pemilihan ini dihapus permanen.</li><li>Semua sesi pemilih berakhir. NIM terdaftar bisa memilih kembali setelah voting dibuka.</li><li>Status menjadi draft dan jadwal dikosongkan. Kandidat, foto, dan daftar NIM dipertahankan.</li><li>Tindakan reset dicatat beserta akun panitia dan jumlah suara yang dihapus.</li></ul>
      <Link className={s.textLink} href="/voting/monitor">Buka monitoring untuk mengunduh rekap terlebih dahulu</Link>
      {election.status === "open" ? <p className={s.error}>Tutup pemilihan melalui pengaturan panitia sebelum melakukan reset.</p> : <form className={s.form} onSubmit={reset}>
        <label className={s.checkbox}><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} required disabled={busy} /> Saya memahami bahwa suara pada “{election.title}” akan dihapus permanen.</label>
        <label>Ketik RESET VOTING untuk mengonfirmasi<input value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} required disabled={busy} /></label>
        <button className={`${s.primary} ${s.resetButton}`} disabled={busy || !accepted || confirmation !== "RESET VOTING"}><RotateCcw size={16} />{busy ? "Memproses reset…" : "Reset pemilihan ini"}</button>
      </form>}</> : <p>Belum ada pemilihan untuk direset.</p>}
    </section>}
  </main></div>;
}
