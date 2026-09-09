import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest } from "next/server";
import { getR2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { votingDb, requireVotingAdmin } from "@/lib/voting/server";
import { errorResponse, uuid, VotingError } from "@/lib/voting/security";

export const runtime = "nodejs";

/** Serve only a database-owned candidate object, never a caller-supplied URL or R2 key. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const id = uuid((await context.params).id);
    const { data, error } = await votingDb().from("voting_candidates").select("photo_key,is_active").eq("id", id).maybeSingle();
    if (error) throw new VotingError(503, "Foto sementara belum tersedia.");
    if (!data?.photo_key) throw new VotingError(404, "Foto kandidat belum tersedia.");
    if (!data.is_active) await requireVotingAdmin();
    const object = await getR2Client().send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: data.photo_key }));
    if (!object.Body || (object.ContentLength || 0) > 6 * 1024 * 1024 || !["image/webp", "image/jpeg", "image/png"].includes(object.ContentType || "")) throw new VotingError(404, "Foto kandidat tidak tersedia.");
    const bytes = await object.Body.transformToByteArray();
    return new Response(new Uint8Array(bytes).buffer, { headers: {
      "Content-Type": object.ContentType!,
      "Content-Length": String(bytes.length),
      "Cache-Control": data.is_active ? "public, max-age=300, s-maxage=3600, stale-while-revalidate=3600" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    } });
  } catch (error) { return errorResponse(error); }
}
