"use client";
/* eslint-disable @next/next/no-img-element -- R2 hosts are configured server-side and photos are already resized on upload. */

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Download, ImagePlus, LoaderCircle, Lock, LockKeyhole, LogOut, Plus, RefreshCw, ShieldCheck, Trash2, Unlock, Upload } from "lucide-react";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import { createClient } from "@/utils/supabase/client";
import { parseNamedVoterExcel, validateNamedVoter, type NamedVoter } from "@/lib/voting/admin-input.mjs";
import type { AdminCandidate, AdminElection, AdminSnapshot } from "@/lib/voting/admin-types";
import * as XLSX from "xlsx";
import s from "./admin.module.css";

const headers = { "Content-Type": "application/json", "X-Voting-Request": "1" };

function localTime(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function downloadExcel(name: string, data: (string | number)[][]) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, name);
}
async function request(body: unknown) {
  const res = await fetch("/api/voting/admin", { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Perubahan belum dapat disimpan.");
  return data;
}

function ElectionForm({ election, onSave, busy }: { election: AdminElection | null; onSave: (body: unknown) => Promise<boolean>; busy: boolean }) {
  const [status, setStatus] = useState(election?.status || "draft");
  const [confirmed, setConfirmed] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSave({ action: "save-election", id: election?.id, election: {
      title: form.get("title"), year: form.get("year"), status,
      opens_at: form.get("opensAt") ? new Date(String(form.get("opensAt"))).toISOString() : null,
      closes_at: form.get("closesAt") ? new Date(String(form.get("closesAt"))).toISOString() : null,
      is_current: form.get("current") === "on",
    } });
  }
  return <form className={s.form} onSubmit={submit}><div className={s.formRow}><label>Judul pemilihan<input name="title" required maxLength={160} defaultValue={election?.title || "Pemilihan Ketua Angkatan IMO 2026"} /></label><label>Tahun<input name="year" required maxLength={20} defaultValue={election?.year || "2026"} /></label></div><div className={s.formRow}><label>Jadwal dibuka<input type="datetime-local" name="opensAt" defaultValue={localTime(election?.opens_at)} /></label><label>Jadwal ditutup<input type="datetime-local" name="closesAt" defaultValue={localTime(election?.closes_at)} /></label></div><p className={s.hint}>Jadwal menggunakan zona waktu perangkat. Kosongkan untuk mengatur buka/tutup secara manual.</p><label>Status<select value={status} onChange={(event) => { setStatus(event.target.value as AdminElection["status"]); setConfirmed(false); }}><option value="draft">Draft — siapkan data</option><option value="open" disabled={!election}>Dibuka — terima suara sesuai jadwal</option><option value="closed" disabled={!election}>Ditutup — hentikan penerimaan suara</option></select></label><label className={s.checkbox}><input type="checkbox" name="current" defaultChecked={election?.is_current ?? true} /> Tampilkan pemilihan ini di halaman voting</label>{status !== (election?.status || "draft") && <label className={s.checkbox}><input required type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> Saya sudah memeriksa data dan ingin mengubah status pemilihan.</label>}<button className={s.primary} disabled={busy}>{busy ? <LoaderCircle size={16} className={s.spin} /> : <Check size={16} />} {election ? "Simpan pengaturan" : "Buat pemilihan draft"}</button></form>;
}

function CandidateForm({ electionId, candidate, number, onSave, busy, onCancel }: { electionId: string; candidate: AdminCandidate | null; number: number; onSave: (body: unknown) => Promise<boolean>; busy: boolean; onCancel: () => void }) {
  const [name, setName] = useState(candidate?.name || "");
  const [tagline, setTagline] = useState(candidate?.tagline || "");
  const [missions, setMissions] = useState(candidate?.mission.length ? candidate.mission : [""]);
  const host = useRef<HTMLFormElement>(null);
  useEffect(() => { host.current?.scrollIntoView({ block: "center", behavior: "smooth" }); host.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus({ preventScroll: true }); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const success = await onSave({ action: "save-candidate", id: candidate?.id, electionId, candidate: {
      number: Number(form.get("number")), name: form.get("name"), tagline: form.get("tagline"), vision: form.get("vision"),
      mission: missions.map((item) => item.trim()).filter(Boolean),
      accent: candidate?.accent || "#c5b28c", is_active: form.get("active") === "on",
    } });
    if (success) onCancel();
  }
  return <form ref={host} className={s.candidateForm} onSubmit={submit} aria-label="Formulir kandidat">
    <div className={s.editorHeading}><div><h3>{candidate ? "Edit profil kandidat" : "Kenalkan kandidat baru"}</h3><p>Isi identitas, lalu ceritakan gagasannya. Pratinjau berubah saat kamu mengetik.</p></div><button type="button" className={s.secondary} onClick={onCancel} disabled={busy}>Batal</button></div>
    <div className={s.editorLayout}><div className={s.editorFields}>
      <fieldset disabled={busy}><legend>01 / Identitas kandidat</legend><div className={s.identityRow}><label>Nomor urut<input type="number" name="number" min={1} max={99} required defaultValue={candidate?.number || number} /></label><label>Nama lengkap *<input name="name" required maxLength={120} value={name} onChange={event => setName(event.target.value)} placeholder="Nama calon ketua angkatan" /></label></div><label>Slogan singkat <small>Opsional</small><input name="tagline" maxLength={240} value={tagline} onChange={event => setTagline(event.target.value)} placeholder="Contoh: Bersama, setiap gagasan berarti." /></label></fieldset>
      <fieldset disabled={busy}><legend>02 / Visi & misi</legend><label>Visi<textarea name="vision" rows={3} maxLength={3000} defaultValue={candidate?.vision} placeholder="Apa yang ingin diwujudkan untuk angkatan ini?" /></label><div className={s.missionEditor}><span>Misi</span><p>Tulis satu langkah nyata di setiap kolom.</p>{missions.map((value, index) => <div key={index}><label><span>Misi {index + 1}</span><textarea rows={2} maxLength={600} value={value} placeholder="Contoh: Membuka forum aspirasi setiap bulan." onChange={event => setMissions(items => items.map((item, i) => i === index ? event.target.value : item))} /></label><button type="button" className={s.secondary} aria-label={`Hapus misi ${index + 1}`} onClick={() => setMissions(items => items.filter((_, i) => i !== index))}>Hapus</button></div>)}<button type="button" className={s.secondary} disabled={missions.length >= 12} onClick={() => setMissions(items => [...items, ""])}><Plus size={14} /> Tambah misi</button></div></fieldset>
      <label className={s.checkbox}><input type="checkbox" name="active" defaultChecked={candidate?.is_active ?? true} disabled={busy} /> Tampilkan kandidat di halaman voting</label>
    </div><aside className={s.editorPreview}><span>PRATINJAU PROFIL</span><div className={s.previewPortrait}>{candidate?.photoUrl ? <img src={candidate.photoUrl} alt="Foto kandidat" /> : <ImagePlus size={40} />}</div><h3>{name || "Nama kandidat"}</h3><p>{tagline || "Slogan kandidat akan tampil di sini."}</p><small><ImagePlus size={16} /> {candidate ? "Ubah foto melalui tombol Foto pada daftar kandidat." : "Setelah disimpan, unggah foto melalui tombol Foto pada kandidat ini."}</small></aside></div>
    <div className={s.editorFooter}><span>Profil dapat diedit selama pemilihan masih draft.</span><button className={s.primary} disabled={busy}>{busy ? <LoaderCircle size={15} className={s.spin} /> : <Check size={15} />} {busy ? "Menyimpan..." : candidate ? "Simpan perubahan" : "Simpan kandidat"}</button></div>
  </form>;
}

export default function VotingAdmin() {
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState("");
  const [newElection, setNewElection] = useState(false);
  const [editing, setEditing] = useState<AdminCandidate | "new" | null>(null);
  const [voters, setVoters] = useState<NamedVoter[]>([]);
  const [imported, setImported] = useState(false);
  const [confirmResetVoters, setConfirmResetVoters] = useState(false);
  const votersElection = useRef("");
  const { config: siteConfig, refreshConfig: refreshSiteConfig } = useSiteConfig();
  const votingLock = siteConfig?.lockedPages?.find((p) => p.path === "/voting" || p.id === "voting");
  const isPageLocked = Boolean(votingLock?.isLocked);

  async function toggleVotingLock() {
    setBusy(true); setError(""); setNotice("");
    try {
      const currentPages = siteConfig?.lockedPages || [];
      const updated = currentPages.map((p) =>
        p.path === "/voting" || p.id === "voting" ? { ...p, isLocked: !isPageLocked } : p
      );
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteCoreConfig: { ...siteConfig, lockedPages: updated } }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status lock halaman voting.");
      await refreshSiteConfig();
      setNotice(isPageLocked ? "Akses publik ke halaman voting telah dibuka." : "Akses publik ke halaman voting telah dikunci (Lockdown aktif).");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status lock.");
    } finally {
      setBusy(false);
    }
  }
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/voting/admin${selected ? `?election=${encodeURIComponent(selected)}` : ""}`, { cache: "no-store" });
      if (!res.ok) { setAuth(res.status); const data = await res.json(); throw new Error(data.error || "Panel belum dapat dimuat."); }
      setSnapshot(await res.json()); setAuth(0); setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Koneksi terputus."); }
    finally { setLoading(false); }
  }, [selected]);
  useEffect(() => { const timer = setTimeout(() => void refresh(), 0); return () => clearTimeout(timer); }, [refresh]);
  useEffect(() => {
    if (!voters.length || imported) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [voters.length, imported]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
      if (error) throw new Error("Email atau kata sandi tidak sesuai.");
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Login belum berhasil."); }
    finally { setBusy(false); }
  }
  async function googleLogin() {
    setBusy(true); setError("");
    try {
      const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback?next=/admin/voting` } });
      if (error) throw error;
    } catch { setError("Login Google belum tersedia. Gunakan email dan kata sandi."); setBusy(false); }
  }
  async function logout() {
    setBusy(true);
    try { const { error } = await createClient().auth.signOut({ scope: "local" }); if (error) throw error; setSnapshot(null); setVoters([]); await refresh(); }
    catch { setError("Sesi belum dapat diakhiri. Coba lagi."); }
    finally { setBusy(false); }
  }
  async function save(body: unknown) {
    setBusy(true); setError(""); setNotice("");
    try { const result = await request(body); setNotice("Perubahan berhasil disimpan."); setNewElection(false); if ((body as { action: string }).action === "save-election") setSelected(result.id); await refresh(); return true; }
    catch (err) { setError(err instanceof Error ? err.message : "Koneksi terputus."); return false; }
    finally { setBusy(false); }
  }
  async function upload(candidateId: string, file?: File) {
    if (!file) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const form = new FormData(); form.append("candidateId", candidateId); form.append("file", file);
      const res = await fetch("/api/voting/admin/photo", { method: "POST", headers: { "X-Voting-Request": "1" }, body: form });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Foto belum dapat diunggah.");
      setNotice("Foto kandidat tersimpan di R2."); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Koneksi terputus."); }
    finally { setBusy(false); }
  }
  async function addManualVoter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!snapshot?.election || busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    try {
      const voter = validateNamedVoter({ nim: fields.get("nim"), name: fields.get("name") });
      if (await save({ action: "import-voters", electionId: snapshot.election.id, voters: [voter] })) form.reset();
    } catch (error) { setError(error instanceof Error ? error.message : "Periksa NIM dan nama."); }
  }
  async function readVoters(file?: File) {
    if (!file || !snapshot?.election) return;
    setError(""); setNotice("");
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error("File Excel maksimal 2 MB, berisi sampai 10.000 NIM.");
      const nims = parseNamedVoterExcel(await file.arrayBuffer());
      setVoters(nims); votersElection.current = snapshot.election.id; setImported(false);
    } catch (err) { setError(err instanceof Error ? err.message : "File Excel tidak valid."); }
  }
  async function importVoters() {
    if (!voters.length || !votersElection.current || imported) return;
    setBusy(true); setError("");
    try {
      const result = await request({ action: "import-voters", electionId: votersElection.current, voters });
      setNotice(`${result.added} NIM berhasil ditambahkan ke daftar pemilih; ${result.updated || 0} nama dilengkapi; ${result.existing} data identik sudah tercatat.`);
      setImported(true); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Impor belum berhasil. Coba ulangi permintaan."); }
    finally { setBusy(false); }
  }

  async function resetVoters() {
    if (!snapshot?.election || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request({ action: "reset-voters", electionId: snapshot.election.id });
      setNotice(`${result.removedVoters ?? snapshot.eligibleVoters} data pemilih berhasil dihapus dari database.`);
      setConfirmResetVoters(false);
      setVoters([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus data pemilih.");
    } finally {
      setBusy(false);
    }
  }

  const election = newElection ? null : snapshot?.election || null;
  const editable = !!election && election.status === "draft" && snapshot?.totalVotes === 0;
  const activeCandidates = snapshot?.candidates.filter((item) => item.is_active) || [];
  return <div className={s.page}><header className={s.nav}><Link href="/voting" className={s.brand}>imo<span>.</span><small>RUANG PANITIA</small></Link><div><Link href="/voting/monitor">Live monitor <ArrowUpRight size={14} /></Link>{snapshot && !auth && <button onClick={logout} disabled={busy}><LogOut size={14} /> Keluar</button>}</div></header><main className={s.main}>
    <div className={s.heading}><span>THE NEXT CHAPTER / ADMINISTRATION</span><h1>Di balik setiap <em>suara.</em></h1><p>Siapkan pemilihan. Kenalkan kandidat. Berikan ruang untuk setiap suara.</p></div>
    {error && <div className={s.error} role="alert">{error}</div>}{notice && <div className={s.notice} role="status"><ShieldCheck size={17} />{notice}</div>}
    {loading ? <div className={s.empty}><LoaderCircle className={s.spin} /><p>Memeriksa akses panitia…</p></div> : auth === 401 ? <section className={s.login}><LockKeyhole size={28} /><h2>Masuk sebagai panitia.</h2><p>Gunakan akun yang sudah terdaftar sebagai pengelola voting.</p><form onSubmit={login}><label>Email<input name="email" type="email" autoComplete="username" required /></label><label>Kata sandi<input name="password" type="password" autoComplete="current-password" required /></label><button className={s.primary} disabled={busy}>Masuk ke ruang panitia</button></form><button className={s.secondary} onClick={googleLogin} disabled={busy}>Lanjutkan dengan Google</button></section> : auth ? <div className={s.empty}><LockKeyhole /><h2>{auth === 403 ? "Akses khusus panitia." : "Panel belum tersedia."}</h2><p>{auth === 403 ? "Akun yang masuk belum memiliki izin pengelolaan voting." : "Periksa koneksi dan konfigurasi layanan, lalu coba lagi."}</p><button className={s.secondary} onClick={() => void refresh()}><RefreshCw size={15} /> Coba lagi</button>{auth === 403 && <button className={s.secondary} onClick={logout}>Keluar dari akun ini</button>}</div> : snapshot && <>
      <div className={s.toolbar}>
        <label>Pemilihan<select value={newElection ? "new" : election?.id || ""} disabled={busy || voters.length > 0} onChange={(event) => { setSelected(event.target.value); setNewElection(false); setEditing(null); setConfirmResetVoters(false); }}><option value="" disabled>Pilih pemilihan</option>{newElection && <option value="new">Draft baru</option>}{snapshot.elections.map((item) => <option key={item.id} value={item.id}>{item.title}{item.is_current ? " · tampil di web" : ""}</option>)}</select></label>
        <button className={s.secondary} onClick={() => { setNewElection(true); setEditing(null); setConfirmResetVoters(false); }} disabled={busy || voters.length > 0}><Plus size={16} /> Pemilihan baru</button>
        <button
          type="button"
          className={s.secondary}
          onClick={toggleVotingLock}
          disabled={busy}
          title={isPageLocked ? "Akses publik ke /voting sedang dikunci. Klik untuk membuka." : "Akses publik ke /voting terbuka. Klik untuk mengunci."}
          style={isPageLocked ? { borderColor: "#f43f5e", color: "#f87171" } : undefined}
        >
          {isPageLocked ? <Lock size={15} /> : <Unlock size={15} />}
          <span>Sektor Publik: {isPageLocked ? "Terkunci" : "Terbuka"}</span>
        </button>
        <Link className={s.secondary} href="/voting" target="_blank">Lihat halaman <ArrowUpRight size={15} /></Link>
      </div>
      {election && <div className={s.stats}><div><span>STATUS</span><strong>{election.status === "draft" ? "Persiapan" : election.status === "open" ? "Dibuka" : "Ditutup"}</strong></div><div><span>KANDIDAT AKTIF</span><strong>{activeCandidates.length}</strong></div><div><span>NIM TERDAFTAR</span><strong>{snapshot.eligibleVoters.toLocaleString("id-ID")}</strong></div><div><span>SUARA TERCATAT</span><strong>{snapshot.totalVotes.toLocaleString("id-ID")}</strong></div></div>}
      <div className={s.actions}>{election && <Link className={s.secondary} href={`/admin/voting/reset?election=${election.id}`}>Reset voting</Link>}</div><div className={s.columns}><section className={s.panel}><div className={s.panelHeading}><span>01</span><h2>{election ? "Pengaturan pemilihan" : "Mulai pemilihan baru"}</h2></div><ElectionForm key={election?.id || "new"} election={election} busy={busy} onSave={save} /></section><section className={s.panel}><div className={s.panelHeading}><span>CHECKLIST</span><h2>Sebelum membuka voting</h2></div><ul className={s.checklist}>{[
        { done: !!election, text: "Pemilihan dibuat dalam status draft" },
        { done: activeCandidates.length >= 2, text: "Minimal dua kandidat aktif" },
        { done: activeCandidates.length > 0 && activeCandidates.every((item) => item.photo_key && item.vision && item.mission.length), text: "Foto, visi, dan misi kandidat dilengkapi" },
        { done: snapshot.eligibleVoters > 0, text: "Daftar NIM sudah diimpor" },
      ].map((item) => <li key={item.text} className={item.done ? s.done : ""}><span>{item.done ? <Check size={13} /> : ""}</span>{item.text}</li>)}</ul><p className={s.hint}>Kandidat dan daftar pemilih terkunci setelah voting dimulai.</p><Link className={s.textLink} href="/voting/monitor">Buka monitoring realtime <ArrowUpRight size={15} /></Link></section></div>
      {election && <><section className={s.panel}><div className={s.panelHeading}><span>02</span><h2>Para kandidat</h2><button className={s.secondary} disabled={!editable || busy} onClick={() => setEditing("new")}><Plus size={15} /> Tambah kandidat</button></div>{!editable && <p className={s.hint}>Data kandidat terkunci. Hanya draft tanpa suara yang dapat diedit.</p>}<div className={s.candidateList}>{snapshot.candidates.map((item) => <article key={item.id}><div className={s.photo}>{item.photoUrl ? <img src={item.photoUrl} alt={item.name} /> : <ImagePlus size={26} />}</div><div className={s.candidateText}><small>NO. {String(item.number).padStart(2, "0")} · {item.is_active ? "AKTIF" : "DISEMBUNYIKAN"}</small><h3>{item.name}</h3><p>{item.tagline || "Tagline belum diisi"}</p></div><div className={s.candidateActions}><button className={s.secondary} disabled={!editable || busy} onClick={() => setEditing(item)}>Edit profil</button><label className={`${s.fileButton} ${!editable || busy ? s.disabled : ""}`}><Upload size={13} /> Foto<input aria-label={`Unggah foto ${item.name}`} type="file" accept="image/jpeg,image/png,image/webp" disabled={!editable || busy} onChange={(event) => { void upload(item.id, event.target.files?.[0]); event.target.value = ""; }} /></label></div></article>)}</div>{snapshot.candidates.length === 0 && !editing && <p className={s.emptyLine}>Belum ada kandidat. Tambahkan profil, lalu unggah foto dari perangkatmu.</p>}{editing && editable && <CandidateForm key={editing === "new" ? "new" : editing.id} electionId={election.id} candidate={editing === "new" ? null : editing} number={Math.max(0, ...snapshot.candidates.map((item) => item.number)) + 1} busy={busy} onSave={save} onCancel={() => setEditing(null)} />}</section>
      <section className={s.panel}><div className={s.panelHeading}><span>03</span><h2>Daftar pemilih</h2></div><p className={s.hint}>Tambahkan pemilih satu per satu atau unggah Excel dengan kolom <code>NIM</code> dan <code>NAMA</code>. Simpan NIM sebagai teks agar angka nol di depan tetap utuh. Nama ditampilkan kepada pemilih setelah verifikasi NIM. Nama lama yang sudah terisi tidak ditimpa. Data hanya dapat ditambahkan saat draft sebelum ada suara.</p><form className={s.manualVoter} onSubmit={addManualVoter} aria-label="Tambah pemilih manual"><h3>Tambah manual</h3><div className={s.formRow}><label>NIM<input name="nim" required maxLength={64} placeholder="Contoh: 0012345678" disabled={!editable || busy || voters.length > 0} /></label><label>Nama lengkap<input name="name" required maxLength={160} placeholder="Nama sesuai data mahasiswa" disabled={!editable || busy || voters.length > 0} /></label></div><button className={s.primary} disabled={!editable || busy || voters.length > 0}><Plus size={15} /> {busy ? "Menyimpan…" : "ADD pemilih"}</button></form><div className={s.actions}><button className={s.secondary} onClick={() => downloadExcel("template-pemilih.xlsx", [["NIM", "NAMA"], ["0012345678", "Nama Lengkap Pemilih"]])}><Download size={15} /> Template Excel</button><label className={`${s.fileButton} ${!editable || busy || voters.length ? s.disabled : ""}`}><Upload size={15} /> Pilih daftar NIM<input type="file" accept=".xlsx,.xls" disabled={!editable || busy || voters.length > 0} onChange={(event) => { void readVoters(event.target.files?.[0]); event.target.value = ""; }} /></label><button type="button" className={s.secondary} disabled={!editable || busy || snapshot.eligibleVoters === 0} onClick={() => setConfirmResetVoters(true)} style={snapshot.eligibleVoters > 0 && editable ? { borderColor: "#f43f5e66", color: "#f87171" } : undefined} title={!editable ? "Data pemilih hanya dapat direset saat pemilihan draft tanpa suara" : snapshot.eligibleVoters === 0 ? "Belum ada data pemilih" : "Hapus seluruh data pemilih untuk pemilihan ini"}><Trash2 size={15} /> Reset data pemilih</button></div>{confirmResetVoters && <div className={s.resetVotersBox} role="alertdialog" aria-label="Konfirmasi reset data pemilih"><h4>Hapus Seluruh Data Pemilih?</h4><p>Tindakan ini akan menghapus permanen <strong>{snapshot.eligibleVoters.toLocaleString("id-ID")} NIM</strong> dari database untuk pemilihan <em>&ldquo;{election.title}&rdquo;</em>. Pemilih yang dihapus tidak akan dapat masuk ke bilik suara kecuali didaftarkan ulang.</p><div className={s.actions}><button type="button" className={`${s.primary} ${s.dangerButton}`} disabled={busy} onClick={resetVoters}>{busy ? <LoaderCircle size={15} className={s.spin} /> : <Trash2 size={15} />} {busy ? "Menghapus data pemilih..." : "Ya, hapus semua pemilih"}</button><button type="button" className={s.secondary} disabled={busy} onClick={() => setConfirmResetVoters(false)}>Batal</button></div></div>}{voters.length > 0 && <div className={s.importBox}><h3>{voters.length.toLocaleString("id-ID")} NIM siap diimpor.</h3><p>Periksa pasangan NIM dan nama sebelum mengimpor.</p><div className={s.voterPreview}><table><thead><tr><th>NIM</th><th>NAMA</th></tr></thead><tbody>{voters.slice(0, 10).map(voter => <tr key={voter.nim}><td>{voter.nim}</td><td>{voter.name}</td></tr>)}</tbody></table>{voters.length > 10 && <small>Menampilkan 10 dari {voters.length} pemilih.</small>}</div><div className={s.actions}>{!imported && <button className={s.primary} onClick={importVoters} disabled={busy}><ShieldCheck size={15} /> Impor ke pemilihan</button>}<button className={s.secondary} disabled={busy} onClick={() => { setVoters([]); }}>{imported ? "Selesai, bersihkan dari layar" : "Batalkan persiapan"}</button></div>{imported && <p className={s.hint}>Impor berhasil. Pemilih dapat langsung memilih menggunakan NIM saat pemilihan dibuka.</p>}</div>}</section></>}
    </>}
    <footer className={s.footer}><Link href="/admin/dashboard"><ArrowLeft size={13} /> Dashboard utama</Link><span>IMO 2026 / THE NEXT CHAPTER</span></footer>
  </main></div>;
}
