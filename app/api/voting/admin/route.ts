import { NextRequest } from "next/server";
import { hashNim } from "@/lib/voting/crypto.mjs";
import { validateElection, validateCandidates, validateNamedVoter } from "@/lib/voting/admin-input.mjs";
import { requireVotingAdmin, photoUrl, rateLimit } from "@/lib/voting/server";
import { errorResponse, json, readJson, requireSameOrigin, uuid, VotingError, votingSecret } from "@/lib/voting/security";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { db } = await requireVotingAdmin();
    const { data: elections, error } = await db.from("voting_elections").select("id,title,year,status,opens_at,closes_at,is_current").order("created_at", { ascending: false });
    if (error) throw new VotingError(503, "Data pemilihan belum tersedia.");
    const selectedId = request.nextUrl.searchParams.get("election");
    const election = elections.find((item) => selectedId ? item.id === selectedId : process.env.VOTING_ELECTION_ID ? item.id === process.env.VOTING_ELECTION_ID : item.is_current) || (selectedId ? null : elections[0]) || null;
    if (!election) return json({ elections, election: null, candidates: [], eligibleVoters: 0, totalVotes: 0 });
    const [candidates, voters, votes] = await Promise.all([
      db.from("voting_candidates").select("id,election_id,number,name,tagline,vision,mission,photo_key,accent,is_active").eq("election_id", election.id).order("number"),
      db.from("voting_eligible_voters").select("id", { count: "exact", head: true }).eq("election_id", election.id).eq("enabled", true),
      db.from("voting_votes").select("id", { count: "exact", head: true }).eq("election_id", election.id),
    ]);
    if (candidates.error || voters.error || votes.error) throw new VotingError(503, "Ringkasan pemilihan belum tersedia.");
    return json({ elections, election, candidates: candidates.data.map((candidate) => ({ ...candidate, photoUrl: photoUrl(candidate.photo_key, candidate.id) })), eligibleVoters: voters.count || 0, totalVotes: votes.count || 0 });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const { db, user } = await requireVotingAdmin();
    await rateLimit("admin-write", user.id, 30, 60);
    const body = await readJson(request, 2 * 1024 * 1024);
    let rpc: string;
    let args: Record<string, unknown>;
    try {
      if (body.action === "save-election") {
        const config = validateElection(body.election);
        rpc = "voting_manage_election";
        args = { p_id: body.id ? uuid(body.id) : null, p_config: config };
      } else if (body.action === "save-candidate") {
        const electionId = uuid(body.electionId);
        const [candidate] = validateCandidates([body.candidate], electionId);
        // Photos use the dedicated image endpoint; metadata edits cannot attach arbitrary objects.
        delete (candidate as Partial<typeof candidate>).photo_key;
        rpc = "voting_manage_candidate";
        args = { p_id: body.id ? uuid(body.id) : null, p_election_id: electionId, p_candidate: candidate };
      } else if (body.action === "import-voters") {
        const electionId = uuid(body.electionId);
        if (!Array.isArray(body.voters) || !body.voters.length || body.voters.length > 10000) throw new Error("Impor harus berisi 1–10.000 NIM.");
        const seen = new Set<string>();
        const secret = votingSecret();
        const voters = body.voters.map((row: unknown) => {
          const { nim, name } = validateNamedVoter(row);
          if (seen.has(nim)) throw new Error("Daftar mengandung NIM duplikat.");
          seen.add(nim);
          const nimSuffix = nim.length >= 4 ? nim.slice(-4) : nim;
          return { nim_hash: hashNim(nim, secret), access_code_hash: hashNim(nim, secret), nim_suffix: nimSuffix, voter_name: name };
        });
        rpc = "voting_import_named_voters";
        args = { p_election_id: electionId, p_voters: voters };
      } else if (body.action === "reset-voters") {
        const electionId = uuid(body.electionId);
        rpc = "voting_reset_voters";
        args = { p_election_id: electionId, p_admin_id: user.id };
      } else throw new Error("Aksi tidak dikenal.");
    } catch (error) {
      if (error instanceof VotingError) throw error;
      throw new VotingError(400, error instanceof Error ? error.message : "Data tidak valid.");
    }
    const { data, error } = await db.rpc(rpc, args);
    if (error) throw new VotingError(error.code === "23505" ? 409 : 503, error.code === "23505" ? "Nomor kandidat atau data pemilihan sudah digunakan." : "Perubahan belum dapat disimpan. Periksa kembali status sebelum mengulangi.");
    if (data?.status !== "ok") throw new VotingError(409, ({ name_conflict: "NIM sudah terdaftar dengan nama berbeda. Periksa data sebelum mengimpor kembali.", locked: "Kandidat dan daftar NIM hanya bisa diubah dalam draft sebelum ada suara.", missing: "Pemilihan atau kandidat tidak ditemukan.", incomplete: "Siapkan minimal dua kandidat aktif dan daftar NIM sebelum membuka voting.", duplicate: "Sebagian NIM sudah memiliki kode akses berbeda. Daftar belum diimpor.", invalid: "Data pemilihan tidak valid.", open: "Tutup pemilihan terlebih dahulu melalui pengaturan panitia sebelum mereset data pemilih.", has_votes: "Pemilihan masih memiliki suara tercatat. Lakukan reset voting terlebih dahulu sebelum menghapus data pemilih.", forbidden: "Akses reset data pemilih ditolak." } as Record<string, string>)[data?.status] || "Perubahan ditolak.");
    return json(data);
  } catch (error) { return errorResponse(error); }
}
