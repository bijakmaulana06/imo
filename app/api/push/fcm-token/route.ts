/**
 * app/api/push/fcm-token/route.ts
 * API endpoint untuk menyimpan / menghapus FCM registration token ke Supabase.
 *
 * POST /api/push/fcm-token  — Simpan token baru
 * DELETE /api/push/fcm-token — Hapus token (unsubscribe)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Gunakan Service Role Key agar bisa insert/delete tanpa RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── POST: Simpan FCM Token ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, userAgent, userId } = body as {
      token: string;
      userAgent?: string;
      userId?: string;
    };

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token FCM tidak valid." },
        { status: 400 }
      );
    }

    // Simpan ke tabel `fcm_tokens` — upsert berdasarkan token
    // (satu perangkat bisa berubah token, tapi tidak duplikat)
    const { error } = await supabaseAdmin.from("fcm_tokens").upsert(
      {
        token,
        user_agent: userAgent || request.headers.get("user-agent") || null,
        user_id: userId || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "token",
      }
    );

    if (error) {
      // Jika tabel belum ada, kembalikan pesan yang jelas
      if (error.code === "42P01") {
        console.warn(
          "[FCM API] Tabel 'fcm_tokens' belum ada. Jalankan migration SQL terlebih dahulu."
        );
        return NextResponse.json(
          {
            error:
              "Tabel fcm_tokens belum ada. Lihat instruksi di README atau schema.sql.",
            code: "TABLE_NOT_FOUND",
          },
          { status: 503 }
        );
      }

      console.error("[FCM API] Supabase error:", error);
      return NextResponse.json(
        { error: "Gagal menyimpan token: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "FCM token berhasil disimpan." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[FCM API] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// ─── DELETE: Hapus FCM Token ──────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body as { token: string };

    if (!token) {
      return NextResponse.json(
        { error: "Token FCM diperlukan." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("fcm_tokens")
      .delete()
      .eq("token", token);

    if (error) {
      console.error("[FCM API] Delete error:", error);
      return NextResponse.json(
        { error: "Gagal menghapus token: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "FCM token berhasil dihapus." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[FCM API] DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
