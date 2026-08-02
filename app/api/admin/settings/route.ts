import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const DEFAULT_FALLBACK = {
  gdriveParentFolder: process.env.GOOGLE_DRIVE_FOLDER_ID || "",
  targetMembersPerGroup: 10,
  totalGroupsCount: 20,
  taskDefinitionsKelompok: [],
  taskDefinitionsIndividu: [
    { id: "ind-1", name: "Jurnal Harian & Resume", keyword: "jurnal", is_active: true, deadline: null },
    { id: "ind-2", name: "Berkas Administrasi Mandiri", keyword: "administrasi", is_active: true, deadline: null },
    { id: "ind-3", name: "Twibbon & ID Card", keyword: "twibbon", is_active: true, deadline: null },
  ],
  notificationSettings: {
    enableNewTaskNotif: true,
    enableAnnouncementNotif: true,
    enableDeadlineNotif: true,
    vapidPublicKey: "",
  },
  uiCustomizations: {
    heroTitle: "Status Hub & Pengumpulan",
    heroSubtitle: "Verifikasi kelengkapan pengumpulan tugas kelompok dan berkas individu real-time.",
    announcementBanner: "Catatan: Jika ingin membuka folder, mohon menunggu loading selesai, Terimakasih.",
  },
  homeCustomizations: {
    siteName: "IMO 2026",
    siteYear: "2026",
    missionBadge: "Innovative Minds Outclass",
    tagline: "\"Different Minds, Different Stories, One Generation Chasing Glories.\"",
    description: "Persiapkan diri Anda untuk lepas landas! Ini adalah portal penjelajahan resmi bagi seluruh Mahasiswa Baru. Temukan semua petunjuk arah, jadwal navigasi, dan koordinat LO Anda di sini.",
    ctaLabel: "Mulai Penjelajahan",
    footerText: "Made with Astro-Physics & Next.js.",
    homeCard1Title: "Summary Tugas Kelompok",
    homeCard1Desc: "Periksa kelengkapan pengumpulan tugas kelompok Anda yang terverifikasi otomatis dari repositori Google Drive IMO 2026.",
    homeCard2Title: "ID Card Generator",
    homeCard2Desc: "Kustomisasi & unduh tanda pengenal resmi IMO 2026. Diproses instan murni pada perangkat Android/iOS Anda untuk menjaga keamanan data.",
    homeCard3Title: "Hubungi LO",
    homeCard3Desc: "Kehilangan arah dalam perjalanan luar angkasa ini? Hubungi LO/Pendamping kelompok Anda secara langsung melalui satu tombol WhatsApp.",
  },
  hubLinks: [],
  contactPersons: [],
  announcements: [],
  idCardTemplateHtml: "",
  pushSubscribersCount: 0,
};

export async function GET() {
  try {
    let supabase: any = null;
    try {
      supabase = await createClient();
    } catch (err) {
      console.warn("Failed to init Supabase client for settings GET:", err);
    }

    if (!supabase) {
      return NextResponse.json(DEFAULT_FALLBACK);
    }

    // Fetch all data in parallel
    const [
      settingsResult,
      kelompokResult,
      subscriberResult,
      hubLinksResult,
      contactsResult,
      announcementsResult,
      idCardResult,
    ] = await Promise.all([
      supabase.from("system_settings").select("key, value"),
      supabase.from("task_definitions").select("*").order("created_at", { ascending: true }),
      supabase.from("push_subscriptions").select("*", { count: "exact", head: true }),
      supabase.from("hub_links").select("*").order("sort_order", { ascending: true }),
      supabase.from("contact_persons").select("*").order("sort_order", { ascending: true }),
      supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("published_at", { ascending: false }),
      supabase.from("id_card_templates").select("id, name, layout_json, is_active, is_default").eq("is_active", true).order("updated_at", { ascending: false }).limit(1),
    ]);

    const settingsMap: Record<string, string> = {};
    if (settingsResult.data) {
      settingsResult.data.forEach((row: any) => {
        settingsMap[row.key] = row.value;
      });
    }

    // Parse task_definitions_individu
    let taskIndividuParsed = DEFAULT_FALLBACK.taskDefinitionsIndividu;
    if (settingsMap["task_definitions_individu"]) {
      try { taskIndividuParsed = JSON.parse(settingsMap["task_definitions_individu"]); } catch {}
    }

    // Parse notification_settings
    let notifSettingsParsed = DEFAULT_FALLBACK.notificationSettings;
    if (settingsMap["notification_settings"]) {
      try {
        const parsed = JSON.parse(settingsMap["notification_settings"]);
        notifSettingsParsed = { ...notifSettingsParsed, ...parsed, vapidPrivateKey: undefined } as any;
      } catch {}
    }

    // Parse ui_customizations
    let uiCustomizationsParsed = DEFAULT_FALLBACK.uiCustomizations;
    if (settingsMap["ui_customizations"]) {
      try { uiCustomizationsParsed = { ...uiCustomizationsParsed, ...JSON.parse(settingsMap["ui_customizations"]) }; } catch {}
    }

    // Parse home_customizations
    let homeCustomizationsParsed = DEFAULT_FALLBACK.homeCustomizations;
    if (settingsMap["home_customizations"]) {
      try { homeCustomizationsParsed = { ...homeCustomizationsParsed, ...JSON.parse(settingsMap["home_customizations"]) }; } catch {}
    }

    // Get ID Card HTML template
    let idCardTemplateHtml = "";
    if (idCardResult.data && idCardResult.data.length > 0) {
      idCardTemplateHtml = idCardResult.data[0].layout_json?.html || "";
    }

    return NextResponse.json({
      gdriveParentFolder: settingsMap["gdrive_parent_folder"] || process.env.GOOGLE_DRIVE_FOLDER_ID || "",
      targetMembersPerGroup: Number(settingsMap["target_members_per_group"]) || 10,
      totalGroupsCount: Number(settingsMap["total_groups_count"]) || 20,
      taskDefinitionsKelompok: kelompokResult.data || [],
      taskDefinitionsIndividu: taskIndividuParsed,
      notificationSettings: notifSettingsParsed,
      uiCustomizations: uiCustomizationsParsed,
      homeCustomizations: homeCustomizationsParsed,
      hubLinks: hubLinksResult.data || [],
      contactPersons: contactsResult.data || [],
      announcements: announcementsResult.data || [],
      idCardTemplateHtml,
      pushSubscribersCount: subscriberResult.count || 0,
    });

  } catch (err: any) {
    console.error("GET admin settings error:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data pengaturan: " + err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      // System settings
      gdriveParentFolder,
      targetMembersPerGroup,
      totalGroupsCount,
      taskDefinitionsKelompok,
      taskDefinitionsIndividu,
      notificationSettings,
      uiCustomizations,
      homeCustomizations,
      // CRUD actions
      entity,
      data: entityData,
      id: entityId,
    } = body;

    let supabase: any = null;
    try {
      supabase = await createClient();
    } catch (err) {
      console.error("Failed to init Supabase client for settings POST:", err);
    }

    if (!supabase) {
      return NextResponse.json({ error: "Supabase client tidak dapat diinisialisasi." }, { status: 500 });
    }

    // ── CRUD ENTITY ACTIONS ─────────────────────────────────────────
    if (action === "create" && entity && entityData) {
      const tableMap: Record<string, string> = {
        hub_links: "hub_links",
        contact_persons: "contact_persons",
        announcements: "announcements",
      };
      const table = tableMap[entity];
      if (!table) return NextResponse.json({ error: "Entity tidak valid" }, { status: 400 });

      const { error } = await supabase.from(table).insert([entityData]);
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, message: `${entity} berhasil ditambahkan` });
    }

    if (action === "update" && entity && entityData && entityId) {
      const tableMap: Record<string, string> = {
        hub_links: "hub_links",
        contact_persons: "contact_persons",
        announcements: "announcements",
      };
      const table = tableMap[entity];
      if (!table) return NextResponse.json({ error: "Entity tidak valid" }, { status: 400 });

      const { error } = await supabase.from(table).update(entityData).eq("id", entityId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, message: `${entity} berhasil diperbarui` });
    }

    if (action === "delete" && entity && entityId) {
      const tableMap: Record<string, string> = {
        hub_links: "hub_links",
        contact_persons: "contact_persons",
        announcements: "announcements",
      };
      const table = tableMap[entity];
      if (!table) return NextResponse.json({ error: "Entity tidak valid" }, { status: 400 });

      const { error } = await supabase.from(table).delete().eq("id", entityId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, message: `${entity} berhasil dihapus` });
    }

    if (action === "save_id_card_template" && entityData?.html !== undefined) {
      const html = entityData.html;
      const { data: existing } = await supabase.from("id_card_templates").select("id").limit(1);
      if (existing && existing.length > 0) {
        await supabase.from("id_card_templates").update({
          layout_json: { html },
          updated_at: new Date().toISOString(),
          is_active: true,
        }).eq("id", existing[0].id);
      } else {
        await supabase.from("id_card_templates").insert([{
          name: "Official IMO Template",
          background_url: "",
          layout_json: { html },
          is_active: true,
          is_default: true,
        }]);
      }
      return NextResponse.json({ success: true, message: "Template ID Card berhasil disimpan" });
    }

    // ── SAVE SYSTEM SETTINGS ────────────────────────────────────────
    const settingsToUpsert: any[] = [];

    if (gdriveParentFolder !== undefined) {
      settingsToUpsert.push({
        key: "gdrive_parent_folder",
        value: String(gdriveParentFolder),
        description: "Folder ID / Link Google Drive Induk",
        updated_at: new Date().toISOString(),
      });
    }

    if (targetMembersPerGroup !== undefined) {
      settingsToUpsert.push({
        key: "target_members_per_group",
        value: String(targetMembersPerGroup),
        description: "Target Jumlah Anggota per Kelompok",
        updated_at: new Date().toISOString(),
      });
    }

    if (totalGroupsCount !== undefined) {
      settingsToUpsert.push({
        key: "total_groups_count",
        value: String(totalGroupsCount),
        description: "Total Jumlah Kelompok",
        updated_at: new Date().toISOString(),
      });
    }

    if (taskDefinitionsIndividu !== undefined) {
      settingsToUpsert.push({
        key: "task_definitions_individu",
        value: JSON.stringify(taskDefinitionsIndividu),
        description: "Definisi Tugas Individu per Anggota",
        updated_at: new Date().toISOString(),
      });
    }

    if (notificationSettings !== undefined) {
      const { data: existingNotifRow } = await supabase
        .from("system_settings").select("value").eq("key", "notification_settings").maybeSingle();
      let mergedNotif = notificationSettings;
      if (existingNotifRow?.value) {
        try { mergedNotif = { ...JSON.parse(existingNotifRow.value), ...notificationSettings }; } catch {}
      }
      settingsToUpsert.push({
        key: "notification_settings",
        value: JSON.stringify(mergedNotif),
        description: "Pengaturan Global Push Notification",
        updated_at: new Date().toISOString(),
      });
    }

    if (uiCustomizations !== undefined) {
      settingsToUpsert.push({
        key: "ui_customizations",
        value: JSON.stringify(uiCustomizations),
        description: "Kustomisasi Tampilan Web Sisi User",
        updated_at: new Date().toISOString(),
      });
    }

    if (homeCustomizations !== undefined) {
      settingsToUpsert.push({
        key: "home_customizations",
        value: JSON.stringify(homeCustomizations),
        description: "Kustomisasi Halaman Utama (Home Page)",
        updated_at: new Date().toISOString(),
      });
    }

    if (settingsToUpsert.length > 0) {
      const { error: upsertErr } = await supabase
        .from("system_settings")
        .upsert(settingsToUpsert, { onConflict: "key" });
      if (upsertErr) throw new Error("Gagal menyimpan system_settings: " + upsertErr.message);
    }

    // Sync task_definitions (Tugas Kelompok)
    if (Array.isArray(taskDefinitionsKelompok)) {
      for (const t of taskDefinitionsKelompok) {
        if (t.id && !t.id.startsWith("new-")) {
          await supabase.from("task_definitions").upsert({
            id: t.id,
            name: t.name,
            keyword: t.keyword,
            is_active: t.is_active !== false,
            deadline: t.deadline || null,
            updated_at: new Date().toISOString(),
          });
        } else {
          await supabase.from("task_definitions").insert({
            name: t.name,
            keyword: t.keyword,
            is_active: t.is_active !== false,
            deadline: t.deadline || null,
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Pengaturan web berhasil diperbarui!" });

  } catch (err: any) {
    console.error("POST admin settings error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menyimpan pengaturan web" },
      { status: 500 }
    );
  }
}
