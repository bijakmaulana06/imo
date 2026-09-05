import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filename, contentType } = body;

    if (!filename) {
      return NextResponse.json(
        { error: "Nama file wajib disertakan." },
        { status: 400 }
      );
    }

    if (!filename.toLowerCase().endsWith(".psd")) {
      return NextResponse.json(
        { error: "File harus berformat .PSD (Photoshop Document)." },
        { status: 400 }
      );
    }

    const sanitizeName = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const filePath = `idcard-psd/${Date.now()}_${sanitizeName}`;

    const supabase = getAdminSupabase();

    const { data, error } = await supabase.storage
      .from("idcard_templates")
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error("Gagal membuat Signed Upload URL:", error);
      return NextResponse.json(
        { error: `Gagal membuat URL upload: ${error?.message || "Unknown error"}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("idcard_templates")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: filePath,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (err: any) {
    console.error("Upload URL error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menghasilkan Signed Upload URL" },
      { status: 500 }
    );
  }
}
