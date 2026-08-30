import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Key file wajib diberikan" }, { status: 400 });
    }

    const cleanKey = key.startsWith("/") ? key.slice(1) : key;

    // 1. Priority: Direct fetch from Cloudflare R2 Custom Domain (bmhost.my.id)
    const customDomain = R2_PUBLIC_URL.replace(/\/+$/, "");
    const publicUrl = `${customDomain}/${cleanKey}`;

    try {
      const directRes = await fetch(publicUrl, {
        headers: {
          "User-Agent": "IMO-2026-Server/1.0",
        },
      });

      if (directRes.ok && directRes.body) {
        return new NextResponse(directRes.body as any, {
          status: 200,
          headers: {
            "Content-Type": directRes.headers.get("content-type") || "application/octet-stream",
            "Content-Length": directRes.headers.get("content-length") || "",
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch (directErr: any) {
      console.warn("Direct R2 custom domain fetch failed, trying S3 SDK:", directErr.message);
    }

    // 2. Secondary: AWS S3 SDK GetObjectCommand
    try {
      const s3Client = getR2Client();
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: cleanKey,
      });

      const s3Response = await s3Client.send(command);

      if (s3Response.Body) {
        const stream = s3Response.Body.transformToWebStream();
        return new NextResponse(stream, {
          headers: {
            "Content-Type": s3Response.ContentType || "application/octet-stream",
            "Content-Length": s3Response.ContentLength?.toString() || "",
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch (s3Err: any) {
      console.warn("S3 SDK fetch failed, checking local static fallback:", s3Err.message);
    }

    // 3. Tertiary: Local static fallback file if PSD is requested
    const localPsdPath = path.join(process.cwd(), "public", "templates", "id-card.psd");
    if (fs.existsSync(localPsdPath)) {
      const fileBuffer = fs.readFileSync(localPsdPath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Length": fileBuffer.length.toString(),
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return NextResponse.json({ error: "File tidak ditemukan di R2 maupun fallback lokal" }, { status: 404 });
  } catch (err: any) {
    console.error("Proxy R2 fetch error:", err);
    return NextResponse.json({ error: err.message || "Gagal mengambil file dari R2" }, { status: 500 });
  }
}
