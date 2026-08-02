import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import webpush from "web-push";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, url, icon, tag } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Judul dan pesan notifikasi wajib diisi." },
        { status: 400 }
      );
    }

    let supabase: any = null;
    try {
      supabase = await createClient();
    } catch (err) {
      console.warn("Failed to create Supabase client for push send:", err);
    }

    let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
    let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";

    // Ambil setting notifikasi & VAPID keys dari system_settings DB jika ada
    if (supabase) {
      try {
        const { data: settingRow } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "notification_settings")
          .maybeSingle();

        if (settingRow && settingRow.value) {
          const parsed = typeof settingRow.value === "string" ? JSON.parse(settingRow.value) : settingRow.value;
          if (parsed.vapidPublicKey) vapidPublicKey = parsed.vapidPublicKey;
          if (parsed.vapidPrivateKey) vapidPrivateKey = parsed.vapidPrivateKey;
        }
      } catch (e) {
        console.warn("Error reading notification_settings:", e);
      }
    }

    // Jika VAPID key belum diset, generate VAPID keys baru secara otomatis
    if (!vapidPublicKey || !vapidPrivateKey) {
      const generated = webpush.generateVAPIDKeys();
      vapidPublicKey = generated.publicKey;
      vapidPrivateKey = generated.privateKey;

      // Simpan VAPID keys baru ke DB
      if (supabase) {
        try {
          const { data: existing } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", "notification_settings")
            .maybeSingle();

          let curSettings = existing && existing.value ? (typeof existing.value === "string" ? JSON.parse(existing.value) : existing.value) : {};
          curSettings.vapidPublicKey = vapidPublicKey;
          curSettings.vapidPrivateKey = vapidPrivateKey;

          await supabase.from("system_settings").upsert(
            {
              key: "notification_settings",
              value: JSON.stringify(curSettings),
              description: "Pengaturan Global Push Notification & VAPID Keys",
              updated_at: new Date().toISOString()
            },
            { onConflict: "key" }
          );
        } catch (e) {
          console.warn("Failed to persist generated VAPID keys:", e);
        }
      }
    }

    webpush.setVapidDetails(
      "mailto:admin@imo2026.com",
      vapidPublicKey,
      vapidPrivateKey
    );

    // Ambil daftar langganan push dari database
    let subscriptions: any[] = [];
    if (supabase) {
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("*");
      
      if (!error && data) {
        subscriptions = data;
      }
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: "Tidak ada perangkat terdaftar yang berlangganan notifikasi.",
        vapidPublicKey
      });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      url: url || "/info",
      icon: icon || "/favicon.ico",
      tag: tag || "imo-push"
    });

    let successCount = 0;
    let failedCount = 0;
    const expiredEndpoints: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          successCount++;
        } catch (err: any) {
          failedCount++;
          if (err.statusCode === 410 || err.statusCode === 404) {
            expiredEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    // Hapus endpoint yang sudah expired / tidak berlaku dari database
    if (supabase && expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
    }

    return NextResponse.json({
      success: true,
      sentCount: successCount,
      failedCount,
      totalCount: subscriptions.length,
      vapidPublicKey,
      message: `Berhasil mengirim ${successCount} notifikasi ke perangkat pengguna.`
    });

  } catch (err: any) {
    console.error("Error sending push notification:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengirim push notification" },
      { status: 500 }
    );
  }
}
