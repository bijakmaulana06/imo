import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { createClient as createAuthClient } from "@/utils/supabase/server";
import { hashNim, normalizeNim } from "@/lib/voting/crypto.mjs";
import type { Candidate, Election, ElectionSnapshot, MonitorSnapshot, VoterSession } from "./types";
import { clientAddressHash, configuredOrigin, digest, newSessionToken, sessionToken, userAgentHash, uuid, VotingError, votingSecret } from "./security";

export function isVotingConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VOTING_SECRET && process.env.VOTING_SECRET.length >= 32);
}

/** The service-role key is deliberately required, with no anon-key fallback. */
export function votingDb() {
  if (!isVotingConfigured()) throw new VotingError(503, "Layanan voting belum dikonfigurasi oleh panitia.");
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function requireVotingAdmin() {
  if (!isVotingConfigured() || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new VotingError(503, "Layanan monitoring belum dikonfigurasi oleh panitia.");
  const auth = await createAuthClient();
  // getUser verifies with Supabase Auth. Editable user_metadata is never an authorization source.
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user) throw new VotingError(401, "Masuk dengan akun panitia untuk membuka monitoring.");
  const db = votingDb();
  const { data: admin, error: adminError } = await db.from("voting_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (adminError) throw new VotingError(503, "Daftar akses monitoring belum tersedia.");
  if (!admin) throw new VotingError(403, "Akun ini tidak memiliki akses monitoring voting.");
  return { db, user };
}

type ElectionRow = { id: string; title: string; year: string; status: Election["status"]; opens_at: string | null; closes_at: string | null };
type CandidateRow = { id: string; election_id: string; number: number; name: string; tagline: string; vision: string; mission: string[]; photo_key: string | null; accent: string };

export function photoUrl(key: string | null, candidateId?: string): string | null {
  const base = process.env.R2_PUBLIC_URL;
  if (!key || !/^[a-zA-Z0-9][a-zA-Z0-9/_\-.]{0,400}$/.test(key) || key.split("/").some((part) => !part || part === "." || part === "..")) return null;
  if (process.env.R2_DELIVERY_MODE === "proxy" && candidateId) return `/api/voting/photo/${candidateId}?v=${digest(key).slice(0, 16)}`;
  if (!base) return null;
  try {
    const url = new URL(base);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
    return `${url.href.replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;
  } catch {
    return null;
  }
}

export async function getElectionSnapshot(): Promise<ElectionSnapshot> {
  if (!isVotingConfigured()) return { configured: false, election: null, candidates: [], message: "Panitia sedang menyiapkan pemilihan. Voting dibuka setelah konfigurasi dan daftar pemilih siap." };
  const db = votingDb();
  let query = db.from("voting_elections").select("id,title,year,status,opens_at,closes_at");
  query = process.env.VOTING_ELECTION_ID ? query.eq("id", uuid(process.env.VOTING_ELECTION_ID)) : query.eq("is_current", true);
  const { data, error } = await query.maybeSingle();
  if (error) throw new VotingError(503, "Data pemilihan belum tersedia. Hubungi panitia.");
  if (!data) return { configured: true, election: null, candidates: [], message: "Belum ada pemilihan yang dijadwalkan." };
  const row = data as ElectionRow;
  const election: Election = { id: row.id, title: row.title, year: row.year, status: row.status, opensAt: row.opens_at, closesAt: row.closes_at };
  const { data: candidateRows, error: candidateError } = await db.from("voting_candidates").select("id,election_id,number,name,tagline,vision,mission,photo_key,accent").eq("election_id", row.id).eq("is_active", true).order("number");
  if (candidateError) throw new VotingError(503, "Data kandidat belum tersedia.");
  const candidates: Candidate[] = (candidateRows as CandidateRow[]).map((candidate) => ({
    id: candidate.id, electionId: candidate.election_id, number: candidate.number, name: candidate.name,
    tagline: candidate.tagline, vision: candidate.vision, mission: candidate.mission,
    photoUrl: photoUrl(candidate.photo_key, candidate.id), accent: /^#[0-9a-f]{6}$/i.test(candidate.accent) ? candidate.accent : "#bfa276",
  }));
  return { configured: true, election, candidates };
}

export async function rateLimit(scope: string, key: string, max: number, seconds: number) {
  const { data, error } = await votingDb().rpc("voting_rate_limit", { p_key: `${scope}:${key}`, p_limit: max, p_window_seconds: seconds });
  if (error) throw new VotingError(503, "Verifikasi keamanan sementara tidak tersedia.");
  if (data !== true) throw new VotingError(429, "Terlalu banyak percobaan. Tunggu beberapa saat sebelum mencoba lagi.");
}

export async function limitRequest(request: NextRequest, scope: string, max = 60) {
  await rateLimit(scope, "global", max * 10, 60);
  const address = clientAddressHash(request);
  if (address) await rateLimit(scope, address, max, 60);
}

type SessionResult = { status: string; election_id?: string; nim_suffix?: string; expires_at?: string; has_voted?: boolean; receipt?: string | null };

async function sessionView(data: SessionResult, token: string, request: NextRequest): Promise<VoterSession> {
  const { data: voterName, error } = await votingDb().rpc("voting_session_name", { p_token_hash: digest(token), p_user_agent_hash: userAgentHash(request) });
  if (error) throw new VotingError(503, "Nama pemilih belum dapat diverifikasi. Coba kembali.");
  return { verified: true, voterName: voterName || undefined, electionId: data.election_id, nimMasked: `••••${data.nim_suffix || ""}`, expiresAt: data.expires_at, hasVoted: Boolean(data.has_voted), ...(data.receipt ? { receipt: data.receipt } : {}) };
}

function requireRpcSuccess(data: SessionResult | null) {
  if (!data || data.status === "unavailable") throw new VotingError(503, "Pemilihan belum tersedia.");
  if (data.status === "closed") throw new VotingError(409, "Pemilihan belum dibuka atau sudah berakhir.");
  if (data.status === "invalid") throw new VotingError(401, "NIM tidak terdaftar atau tidak memiliki hak suara.");
  if (data.status === "expired") throw new VotingError(401, "Sesi berakhir. Silakan verifikasi NIM kembali.");
  if (data.status === "candidate") throw new VotingError(400, "Kandidat tidak tersedia untuk pemilihan ini.");
  if (data.status !== "ok") throw new VotingError(503, "Permintaan voting belum dapat diproses.");
}

export async function startVoterSession(request: NextRequest, body: Record<string, unknown>) {
  await limitRequest(request, "verify", 30);
  let nim: string;
  try {
    nim = normalizeNim(body.nim);
  } catch {
    throw new VotingError(400, "Masukkan NIM terdaftar dengan benar.");
  }
  const electionId = uuid(body.electionId);
  const secret = votingSecret();
  const nimHash = hashNim(nim, secret);
  await rateLimit("nim", `${electionId}:${nimHash}`, 6, 15 * 60);
  const token = newSessionToken();
  const { data, error } = await votingDb().rpc("voting_start_session", {
    p_election_id: electionId, p_nim_hash: nimHash, p_access_code_hash: "",
    p_token_hash: digest(token), p_user_agent_hash: userAgentHash(request),
  });
  if (error) throw new VotingError(503, "Verifikasi pemilih sementara tidak tersedia.");
  requireRpcSuccess(data as SessionResult | null);
  return { session: await sessionView(data as SessionResult, token, request), token };
}

export async function getVoterSession(request: NextRequest): Promise<VoterSession> {
  const token = sessionToken(request);
  if (!token || !isVotingConfigured()) return { verified: false };
  const { data, error } = await votingDb().rpc("voting_session_info", { p_token_hash: digest(token), p_user_agent_hash: userAgentHash(request) });
  if (error) throw new VotingError(503, "Status sesi sementara tidak tersedia.");
  if (!data || (data as SessionResult).status !== "ok") return { verified: false };
  return sessionView(data as SessionResult, token, request);
}

export async function deleteVoterSession(request: NextRequest) {
  const token = sessionToken(request);
  if (!token || !isVotingConfigured()) return;
  const { error } = await votingDb().from("voting_sessions").delete().eq("token_hash", digest(token));
  if (error) throw new VotingError(503, "Sesi belum dapat diakhiri. Silakan coba kembali.");
}

export async function castVote(request: NextRequest, body: Record<string, unknown>) {
  const token = sessionToken(request);
  if (!token) throw new VotingError(401, "Verifikasi NIM sebelum memberikan suara.");
  const electionId = uuid(body.electionId);
  const candidateId = uuid(body.candidateId);
  await rateLimit("vote", digest(token), 15, 60);
  const { data, error } = await votingDb().rpc("voting_cast_vote", {
    p_election_id: electionId, p_candidate_id: candidateId, p_token_hash: digest(token), p_user_agent_hash: userAgentHash(request),
  });
  if (error) throw new VotingError(503, "Suara belum dapat dikonfirmasi. Periksa status sesi sebelum mencoba kembali.");
  const result = data as SessionResult | null;
  // Retried requests after a network failure return the existing receipt without changing the vote.
  requireRpcSuccess(result);
  if (!result?.receipt) throw new VotingError(503, "Tanda terima belum tersedia. Periksa status sesi.");
  return { receipt: result.receipt };
}

export async function getMonitorSnapshot(): Promise<MonitorSnapshot> {
  const { db } = await requireVotingAdmin();
  const snapshot = await getElectionSnapshot();
  if (!snapshot.election) return { election: null, candidates: [], eligibleVoters: 0, totalVotes: 0, results: [], timeline: [], updatedAt: new Date().toISOString() };
  const { data, error } = await db.rpc("voting_monitor_snapshot", { p_election_id: snapshot.election.id });
  if (error || !data) throw new VotingError(503, "Data monitoring sementara tidak tersedia.");
  const totals = data as { eligible_voters: number; total_votes: number; results: { candidate_id: string; votes: number }[]; timeline: { time: string; votes: number }[]; updated_at: string };
  return {
    election: snapshot.election, candidates: snapshot.candidates, eligibleVoters: Number(totals.eligible_voters), totalVotes: Number(totals.total_votes),
    results: totals.results.map((result) => ({ candidateId: result.candidate_id, votes: Number(result.votes) })),
    timeline: totals.timeline.map((point) => ({ time: point.time, votes: Number(point.votes) })), updatedAt: totals.updated_at,
  };
}
