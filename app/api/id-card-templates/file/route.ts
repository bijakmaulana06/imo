import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "imotemplate";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Key file wajib diberikan" }, { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const s3Response = await s3Client.send(command);

    if (!s3Response.Body) {
      return NextResponse.json({ error: "File tidak ditemukan di R2" }, { status: 404 });
    }

    const stream = s3Response.Body.transformToWebStream();

    return new NextResponse(stream, {
      headers: {
        "Content-Type": s3Response.ContentType || "application/octet-stream",
        "Content-Length": s3Response.ContentLength?.toString() || "",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: any) {
    console.error("Proxy R2 fetch error:", err);
    return NextResponse.json({ error: err.message || "Gagal mengambil file dari R2" }, { status: 500 });
  }
}
