import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import webpush from "web-push";

export async function GET() {
  try {
    let supabase: any = null;
    try {
      supabase = await createClient();
    } catch (err) {
      console.warn("Supabase init fallback in admin/settings GET:", err);
    }

    const defaultConfig = {
      // Branding & Identity
      siteName: "IMO 2026",
      siteYear: "2026",
      siteLogoUrl: "/Brighton.svg",
      faviconUrl: "/favicon.ico",
      metaTitle: "IMO 2026 - Innovative Minds Outclass",
      metaDescription: "Portal Resmi IMO 2026: Different Minds, Different Stories, One Generation Chasing Glories.",
      
      // Theme & Styling
      accentCyan: "#7df9ff",
      accentPurple: "#b48cff",
      accentYellow: "#ffd166",
      backgroundColor: "#020510",
      enableStarfield: true,
      glassBlurIntensity: "blur(30px)",

      // Web Status & Modes
      maintenanceMode: false,
      maintenanceMessage: "Website IMO 2026 sedang dalam pemeliharaan sistem berkala. Mohon kembali beberapa saat lagi.",
      taskSubmissionFrozen: false,
      taskFreezeMessage: "Pengiriman dan verifikasi berkas sedang dibekukan sementara untuk rekapitulasi data.",
      
      // Root System Controls
      swCacheVersion: "v1.0.0",
      killServiceWorker: false,
      cacheTtl: 3600,
      apiLockdown: false,

      // Global Top Banner
      enableGlobalBanner: false,
      globalBannerText: "📢 Pengumuman: Jadwal pengkondisian barisan telah diperbarui. Cek menu Panduan!",
      globalBannerStyle: "info",
      globalBannerLink: "/guide",

      // Analytics
      analyticsScriptTag: "",

      // Copywriting - Home Page
      homeMissionBadge: "Innovative Minds Outclass",
      homeTagline: '"Different Minds, Different Stories, One Generation Chasing Glories."',
      homeDescription: "Persiapkan diri Anda untuk lepas landas! Ini adalah portal penjelajahan resmi bagi seluruh Mahasiswa Baru. Temukan semua petunjuk arah, jadwal navigasi, dan koordinat LO Anda di sini.",
      homeCtaLabel: "Mulai Penjelajahan",
      homeCard1Title: "Summary Tugas Kelompok",
      homeCard1Desc: "Periksa kelengkapan pengumpulan tugas kelompok Anda yang terverifikasi otomatis dari repositori Google Drive IMO 2026.",
      homeCard2Title: "ID Card Generator",
      homeCard2Desc: "Kustomisasi & unduh tanda pengenal resmi IMO 2026. Diproses instan murni pada perangkat Android/iOS Anda untuk menjaga keamanan data.",
      homeCard3Title: "Hubungi LO",
      homeCard3Desc: "Kehilangan arah dalam perjalanan luar angkasa ini? Hubungi LO/Pendamping kelompok Anda secara langsung melalui satu tombol WhatsApp.",

      // Copywriting - Info Page
      infoHeroTitle: "Status Hub & Pengumpulan",
      infoHeroSubtitle: "Verifikasi kelengkapan pengumpulan tugas kelompok dan berkas individu real-time.",
      infoWarningNotice: "Catatan: Jika ingin membuka folder, mohon menunggu loading selesai, Terimakasih.",

      // Copywriting - Hub Page
      hubHeroTitle: "PUSAT PENJELAJAHAN",
      hubHeroSubtitle: "Portal pusat navigasi cepat untuk mengakses semua panduan, tools generator, saluran media resmi, dan pusat berkas IMO 2026.",
      hubSearchPlaceholder: "Cari tautan modul, generator, atau panduan penjelajahan...",

      // Copywriting - Guide Page
      guideHeroTitle: "PANDUAN & EMBED DOKUMEN",
      guideHeroSubtitle: "Halaman interaktif pengumuman resmi & contoh surat. Tinjau dokumen bersandingan dengan petunjuk & tombol langsung ke Auto-Form Generator.",

      // Copywriting - Contact Page
      contactHeroTitle: "LO & PENDAMPING KELOMPOK",
      contactHeroSubtitle: "Temukan pemandu orbit Anda. Cari berdasarkan nama kelompok atau nama LO untuk menghubungi langsung.",

      // Copywriting - ID Card Page
      idCardHeroTitle: "ID CARD GENERATOR",
      idCardHeroSubtitle: "Generator tanda pengenal resmi peserta IMO 2026. Diproses 100% di browser Anda untuk keamanan data penuh.",

      documentsHeroTitle: "AUTO-FORM GENERATOR",
      documentsHeroSubtitle: "Isi formulir online dan buat dokumen PDF resmi instan tanpa mengetik ulang.",

      // Home Page Node Graph
      homeNodesOrder: ["guide", "hub", "info", "idcard", "documents", "contact"],

      // Footer
      footerText: "Made with Astro-Physics & Next.js.",

      // Drive Engine Settings
      gdriveParentFolder: process.env.GOOGLE_DRIVE_FOLDER_ID || "",
      totalGroupsCount: 20,
      targetMembersPerGroup: 10,

      // Push Notification Settings & Root
      notificationSettings: {
        enableNewTaskNotif: true,
        enableAnnouncementNotif: true,
        enableDeadlineNotif: true,
        vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
        vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || "",
        newTaskTemplate: { title: "Tugas Baru: {taskName}", body: "Ada tugas baru yang perlu dikerjakan. Cek sekarang!" },
        deadlineTemplate: { title: "Peringatan Deadline: {taskName}", body: "Tugas ini akan segera mencapai tenggat waktu!" },
        announcementTemplate: { title: "Pengumuman: {title}", body: "Ada pengumuman baru dari panitia." },
        linktreeTemplate: { title: "Tautan Baru: {label}", body: "Tautan baru telah ditambahkan ke pusat informasi." },
        deadlineReminderHours: 24,
      },
      pushSubscribersCount: 0,
    };

    if (!supabase) {
      return NextResponse.json(defaultConfig);
    }

    const [settingsResult, subscriberResult] = await Promise.all([
      supabase.from("system_settings").select("key, value"),
      supabase.from("push_subscriptions").select("*", { count: "exact", head: true }),
    ]);

    const settingsMap: Record<string, string> = {};
    if (settingsResult.data) {
      settingsResult.data.forEach((row: any) => {
        settingsMap[row.key] = row.value;
      });
    }

    let parsedConfig = { ...defaultConfig };

    if (settingsMap["site_core_config"]) {
      try {
        parsedConfig = { ...parsedConfig, ...JSON.parse(settingsMap["site_core_config"]) };
      } catch (e) {}
    }

    if (settingsMap["gdrive_parent_folder"]) {
      parsedConfig.gdriveParentFolder = settingsMap["gdrive_parent_folder"];
    }
    if (settingsMap["target_members_per_group"]) {
      parsedConfig.targetMembersPerGroup = Number(settingsMap["target_members_per_group"]);
    }
    if (settingsMap["total_groups_count"]) {
      parsedConfig.totalGroupsCount = Number(settingsMap["total_groups_count"]);
    }
    if (settingsMap["notification_settings"]) {
      try {
        parsedConfig.notificationSettings = {
          ...parsedConfig.notificationSettings,
          ...JSON.parse(settingsMap["notification_settings"]),
        };
      } catch (e) {}
    }

    parsedConfig.pushSubscribersCount = subscriberResult.count || 0;

    return NextResponse.json(parsedConfig);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteCoreConfig, gdriveParentFolder, totalGroupsCount, targetMembersPerGroup, notificationSettings, action } = body;

    let supabase: any = null;
    try {
      supabase = await createClient();
    } catch (err) {
      console.error("Failed to init Supabase client for settings POST:", err);
    }

    if (!supabase) {
      return NextResponse.json({ error: "Supabase client tidak dapat diinisialisasi." }, { status: 500 });
    }

    if (action === "regenerate_vapid") {
      const generated = webpush.generateVAPIDKeys();
      
      const { data: existing } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "notification_settings")
        .maybeSingle();

      let curSettings = existing && existing.value ? (typeof existing.value === "string" ? JSON.parse(existing.value) : existing.value) : {};
      curSettings.vapidPublicKey = generated.publicKey;
      curSettings.vapidPrivateKey = generated.privateKey;

      await supabase.from("system_settings").upsert(
        {
          key: "notification_settings",
          value: JSON.stringify(curSettings),
          description: "Pengaturan Global Push Notification & VAPID Keys",
          updated_at: new Date().toISOString()
        },
        { onConflict: "key" }
      );
      
      return NextResponse.json({ success: true, message: "VAPID Keys berhasil diregenerate ulang secara paksa." });
    }

    const settingsToUpsert: any[] = [];

    if (siteCoreConfig !== undefined) {
      settingsToUpsert.push({
        key: "site_core_config",
        value: JSON.stringify(siteCoreConfig),
        description: "Pengaturan Teknis Utama Web & Kustomisasi Seluruh UI",
        updated_at: new Date().toISOString(),
      });
    }

    if (gdriveParentFolder !== undefined) {
      settingsToUpsert.push({
        key: "gdrive_parent_folder",
        value: String(gdriveParentFolder),
        description: "Folder ID Google Drive Induk",
        updated_at: new Date().toISOString(),
      });
    }

    if (totalGroupsCount !== undefined) {
      settingsToUpsert.push({
        key: "total_groups_count",
        value: String(totalGroupsCount),
        description: "Jumlah Total Kelompok",
        updated_at: new Date().toISOString(),
      });
    }

    if (targetMembersPerGroup !== undefined) {
      settingsToUpsert.push({
        key: "target_members_per_group",
        value: String(targetMembersPerGroup),
        description: "Target Anggota Per Kelompok",
        updated_at: new Date().toISOString(),
      });
    }

    if (notificationSettings !== undefined) {
      settingsToUpsert.push({
        key: "notification_settings",
        value: JSON.stringify(notificationSettings),
        description: "Pengaturan Push Notification Global",
        updated_at: new Date().toISOString(),
      });
    }

    if (settingsToUpsert.length > 0) {
      const { error } = await supabase.from("system_settings").upsert(settingsToUpsert, { onConflict: "key" });
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ success: true, message: "Pengaturan teknis web berhasil diperbarui!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
