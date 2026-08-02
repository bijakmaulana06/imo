import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, userName } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Subscription object tidak valid" },
        { status: 400 }
      );
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    let supabase: any = null;
    try {
      supabase = await createClient();
    } catch (e) {
      console.warn("Failed to init Supabase client for push subscription", e);
    }

    if (supabase) {
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          endpoint,
          p256dh,
          auth,
          user_name: userName || "Pengguna IMO 2026",
          created_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );

      if (error) {
        console.error("Database error saving push subscription:", error);
        return NextResponse.json(
          { error: "Gagal menyimpan langganan ke database: " + error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, message: "Berhasil mendaftar notifikasi!" });
  } catch (err: any) {
    console.error("Push subscribe error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memproses langganan notifikasi" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint wajib diisi" }, { status: 400 });
    }

    let supabase: any = null;
    try {
      supabase = await createClient();
    } catch {}

    if (supabase) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    }

    return NextResponse.json({ success: true, message: "Berhasil berhenti berlangganan notifikasi!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
