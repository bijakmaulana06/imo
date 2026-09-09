import { NextRequest } from "next/server";
import { requireVotingAdmin, rateLimit } from "@/lib/voting/server";
import { errorResponse, uuid, VotingError } from "@/lib/voting/security";
import { buildVotingReport, type VotingReport } from "@/lib/voting/report";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const { db, user } = await requireVotingAdmin();
    await rateLimit("admin-report", user.id, 10, 60);
    const electionId = uuid(request.nextUrl.searchParams.get("election"));
    const { data, error } = await db.rpc("voting_report_snapshot", { p_election_id: electionId });
    if (error) throw new VotingError(503, "Rekap belum dapat dibuat. Coba kembali.");
    if (!data) throw new VotingError(404, "Pemilihan tidak ditemukan.");
    const buffer = await buildVotingReport(data as VotingReport);
    return new Response(new Uint8Array(buffer), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="rekap-pemilihan-${new Date().toISOString().slice(0,10)}.docx"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch(error) { return errorResponse(error); }
}
