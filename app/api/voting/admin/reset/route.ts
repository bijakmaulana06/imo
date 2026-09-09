import { NextRequest } from "next/server";
import { requireVotingAdmin, rateLimit } from "@/lib/voting/server";
import { errorResponse, json, readJson, requireSameOrigin, uuid, VotingError } from "@/lib/voting/security";

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const { db, user } = await requireVotingAdmin();
    await rateLimit("admin-reset", user.id, 5, 60);
    const body = await readJson(request, 4096);
    if (body.confirmation !== "RESET VOTING" || typeof body.title !== "string" || body.title.length > 160 || !Number.isSafeInteger(body.expectedVotes) || Number(body.expectedVotes) < 0) {
      throw new VotingError(400, "Lengkapi konfirmasi reset dan muat ulang ringkasan pemilihan.");
    }
    const { data, error } = await db.rpc("voting_reset_election", {
      p_election_id: uuid(body.electionId), p_admin_id: user.id,
      p_request_id: uuid(body.requestId), p_expected_votes: body.expectedVotes, p_title: body.title,
    });
    if (error) throw new VotingError(503, "Reset belum dapat dikonfirmasi. Coba kembali dengan permintaan yang sama.");
    if (data?.status !== "ok") throw new VotingError(409, ({ open: "Tutup pemilihan terlebih dahulu melalui pengaturan panitia.", stale: "Jumlah suara berubah. Muat ulang ringkasan sebelum reset.", confirmation: "Judul pemilihan berubah. Muat ulang ringkasan.", missing: "Pemilihan tidak ditemukan.", forbidden: "Akses reset ditolak." } as Record<string, string>)[data?.status] || "Reset ditolak.");
    return json(data);
  } catch (error) { return errorResponse(error); }
}
