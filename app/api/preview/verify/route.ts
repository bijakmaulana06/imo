import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { DEFAULT_SITE_CONFIG } from "@/types/site-config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { success: false, error: "Kode token wajib diisi." },
        { status: 400 }
      );
    }

    let expectedToken = DEFAULT_SITE_CONFIG.devBypassToken || "imo_dev_preview_2026";

    try {
      const supabase = await createClient();
      if (supabase) {
        const { data: settingRow } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "site_core_config")
          .single();

        if (settingRow && settingRow.value) {
          const parsed = JSON.parse(settingRow.value);
          if (parsed.devBypassToken && typeof parsed.devBypassToken === "string") {
            expectedToken = parsed.devBypassToken.trim();
          }
        }
      }
    } catch (err) {
      console.warn("Could not query DB for dev bypass token, using default:", err);
    }

    const providedToken = token.trim();

    if (providedToken !== expectedToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Kode token tidak valid atau telah diperbarui. Silakan periksa di Admin Settings.",
        },
        { status: 401 }
      );
    }

    // Token valid: buat response dan pasang cookie bypass
    const response = NextResponse.json({
      success: true,
      message: "Akses Developer Diterima. Seluruh penguncian fitur berhasil dibypass.",
    });

    response.cookies.set("imo_lockdown_bypass", "1", {
      path: "/",
      maxAge: 86400, // 24 jam
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses verifikasi token." },
      { status: 500 }
    );
  }
}
