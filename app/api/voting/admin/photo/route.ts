import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import sharp from "sharp";
import { photoUrl, rateLimit, requireVotingAdmin } from "@/lib/voting/server";
import { errorResponse, json, requireSameOrigin, uuid, VotingError } from "@/lib/voting/security";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 6 * 1024 * 1024 + 32 * 1024;

async function boundedMultipart(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) throw new VotingError(415, "Unggah foto menggunakan formulir multipart.");
  const reader = request.body?.getReader();
  if (!reader) throw new VotingError(400, "Foto belum disertakan.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new VotingError(413, "Ukuran foto maksimal 6 MB.");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try {
    return await new Response(Buffer.concat(chunks), { headers: { "Content-Type": contentType } }).formData();
  } catch { throw new VotingError(400, "Formulir unggahan tidak valid."); }
}

function r2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !/^[a-f0-9]{32}$/i.test(accountId) || !accessKeyId || !secretAccessKey || !bucket || !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) || !photoUrl("voting/check.webp")) {
    throw new VotingError(503, "Penyimpanan foto R2 belum dikonfigurasi oleh panitia.");
  }
  return { bucket, client: new S3Client({ region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } }) };
}

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const { db, user } = await requireVotingAdmin();
    await rateLimit("photo", user.id, 10, 60);
    const { client, bucket } = r2Client();
    const form = await boundedMultipart(request);
    const candidateId = uuid(form.get("candidateId"));
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new VotingError(400, "Foto kandidat wajib disertakan.");
    if (file.size > 6 * 1024 * 1024) throw new VotingError(413, "Ukuran foto maksimal 6 MB.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new VotingError(415, "Gunakan foto JPEG, PNG, atau WebP.");
    const { data: candidate, error } = await db.from("voting_candidates").select("id,election_id").eq("id", candidateId).maybeSingle();
    if (error) throw new VotingError(503, "Kandidat belum dapat diperiksa.");
    if (!candidate) throw new VotingError(404, "Kandidat tidak ditemukan.");

    let output: Buffer;
    try {
      const input = Buffer.from(await file.arrayBuffer());
      const metadata = await sharp(input, { limitInputPixels: 24_000_000, failOn: "error" }).metadata();
      if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format) || (metadata.pages || 1) > 1) throw new Error("unsupported image");
      // Decoding and re-encoding validates actual image bytes and strips metadata/embedded payloads.
      output = await sharp(input, { limitInputPixels: 24_000_000, failOn: "error" }).rotate().resize({ width: 1600, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
    } catch { throw new VotingError(400, "Foto tidak dapat dibaca. Gunakan gambar statis JPEG, PNG, atau WebP maksimal 24 megapiksel."); }

    const photoKey = `voting/${candidate.election_id}/${candidateId}/${randomUUID()}.webp`;
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: photoKey, Body: output, ContentType: "image/webp", CacheControl: "public, max-age=31536000, immutable" }));
    const { error: updateError, data: updated } = await db.rpc("voting_set_candidate_photo", { p_candidate_id: candidateId, p_photo_key: photoKey });
    if (updateError || !updated) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: photoKey })).catch(() => undefined);
      throw new VotingError(updateError ? 503 : 409, "Foto belum tersimpan. Foto hanya dapat diubah saat pemilihan masih draft dan belum ada suara.");
    }
    return json({ photoKey, photoUrl: photoUrl(photoKey, candidateId) }, 201);
  } catch (error) { return errorResponse(error); }
}
