import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const cropDataStr = formData.get("cropData") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File foto wajib diunggah." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    let imagePipeline = sharp(Buffer.from(arrayBuffer));

    // Dapatkan metadata gambar untuk validasi batas crop
    const metadata = await imagePipeline.metadata();
    const imgWidth = metadata.width || 800;
    const imgHeight = metadata.height || 800;

    // Parsing crop parameters jika dikirimkan dari cropper client
    if (cropDataStr) {
      try {
        const cropData = JSON.parse(cropDataStr);
        const { x = 0, y = 0, width, height, rotate = 0, scaleX = 1, scaleY = 1 } = cropData;

        // 1. Rotasi & Flip
        if (rotate && rotate !== 0) {
          imagePipeline = imagePipeline.rotate(rotate);
        }
        if (scaleX === -1) {
          imagePipeline = imagePipeline.flop(); // Horizontal flip
        }
        if (scaleY === -1) {
          imagePipeline = imagePipeline.flip(); // Vertical flip
        }

        // 2. Crop area extraction (diproses murni di server-side)
        if (width && height && width > 10 && height > 10) {
          const left = Math.max(0, Math.min(Math.round(x), imgWidth - 1));
          const top = Math.max(0, Math.min(Math.round(y), imgHeight - 1));
          const cropW = Math.min(Math.round(width), imgWidth - left);
          const cropH = Math.min(Math.round(height), imgHeight - top);

          if (cropW > 10 && cropH > 10) {
            imagePipeline = imagePipeline.extract({ left, top, width: cropW, height: cropH });
          }
        }
      } catch (cropParseErr) {
        console.warn("Gagal parsing cropData, menggunakan default resize:", cropParseErr);
      }
    }

    // 3. Rescale & kompresi server-side ke avatar WebP 400x400
    const processedBuffer = await imagePipeline
      .resize(400, 400, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 88 })
      .toBuffer();

    // 4. Upload ke Cloudflare R2
    const cleanBaseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
    const r2Key = `contact-photos/${Date.now()}_${cleanBaseName || "avatar"}.webp`;

    const s3Client = getR2Client();
    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        Body: processedBuffer,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    // 5. Bangun URL publik R2 (custom domain bmhost.my.id)
    const customDomain = R2_PUBLIC_URL.replace(/\/+$/, "");
    const publicPhotoUrl = `${customDomain}/${r2Key}`;

    return NextResponse.json({
      success: true,
      url: publicPhotoUrl,
      key: r2Key,
    });
  } catch (err: any) {
    console.error("Server-side contact photo processing error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memproses foto di server" },
      { status: 500 }
    );
  }
}
