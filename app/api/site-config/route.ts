import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { DEFAULT_LOCKED_PAGES } from "@/types/site-config";

export const revalidate = 0; // Always fresh configuration

export async function GET() {
  try {
    let supabase: any = null;
    try {
      supabase = await createClient();
    } catch (err) {
      console.warn("Supabase init fallback in site-config route:", err);
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
      lockedPages: DEFAULT_LOCKED_PAGES,
      
      // Global Top Banner
      enableGlobalBanner: false,
      globalBannerText: "📢 Pengumuman: Jadwal pengkondisian barisan telah diperbarui. Cek menu Panduan!",
      globalBannerStyle: "info", // "info" | "warning" | "alert" | "success"
      globalBannerLink: "/guide",

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
      homeCard3Title: "Pusat Kontak",
      homeCard3Desc: "Kehilangan arah dalam perjalanan luar angkasa ini? Hubungi kontak pendamping kelompok Anda secara langsung melalui satu tombol WhatsApp.",

      // Home Photo Slots (GDrive Showcase & Storyline)
      homePhotoSlotsEnabled: true,
      homePhotoSlotsTitle: "ALUR KISAH PENJELAJAHAN ORBIT",
      homePhotoSlotsSubtitle: "Rekam jejak kronologis dan narasi momentum penjelajahan Mahasiswa Baru IMO 2026 dari awal keberangkatan hingga puncak inovasi.",
      homePhotoSlots: [],

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
      contactHeroTitle: "KONTAK",
      contactHeroSubtitle: "Temukan pemandu orbit Anda. Cari berdasarkan nama kelompok atau nama pendamping untuk menghubungi langsung.",

      // Copywriting - ID Card Page
      idCardHeroTitle: "ID CARD GENERATOR",
      idCardHeroSubtitle: "Generator tanda pengenal resmi peserta IMO 2026. Diproses 100% di browser Anda untuk keamanan data penuh.",

      // Copywriting - Documents Page
      documentsHeroTitle: "AUTO-FORM GENERATOR",
      documentsHeroSubtitle: "Isi formulir online dan buat dokumen PDF resmi instan tanpa mengetik ulang.",

      // Audio Player
      musicPlayerEnabled: false,
      musicUrl: "",
      musicTitle: "",
      musicArtist: "",
      musicAlbumArt: "",

      // Footer
      footerText: "Made with Astro-Physics & Next.js.",
    };

    if (!supabase) {
      return NextResponse.json(defaultConfig);
    }

    const { data: settingsRows } = await supabase
      .from("system_settings")
      .select("key, value");

    const settingsMap: Record<string, string> = {};
    if (settingsRows) {
      settingsRows.forEach((row: any) => {
        settingsMap[row.key] = row.value;
      });
    }

    let parsedConfig = { ...defaultConfig };

    if (settingsMap["site_core_config"]) {
      try {
        parsedConfig = { ...parsedConfig, ...JSON.parse(settingsMap["site_core_config"]) };
      } catch (e) {}
    }

    // Merge individual keys if stored separately
    if (settingsMap["gdrive_parent_folder"]) {
      (parsedConfig as any).gdriveParentFolder = settingsMap["gdrive_parent_folder"];
    }
    if (settingsMap["target_members_per_group"]) {
      (parsedConfig as any).targetMembersPerGroup = Number(settingsMap["target_members_per_group"]);
    }
    if (settingsMap["group_member_counts"]) {
      try {
        (parsedConfig as any).groupMemberCounts = JSON.parse(settingsMap["group_member_counts"]);
      } catch (e) {}
    }
    if (settingsMap["group_names"]) {
      try {
        (parsedConfig as any).groupNames = JSON.parse(settingsMap["group_names"]);
      } catch (e) {}
    }
    if (settingsMap["total_groups_count"]) {
      (parsedConfig as any).totalGroupsCount = Number(settingsMap["total_groups_count"]);
    }

    if (!parsedConfig.lockedPages || !Array.isArray(parsedConfig.lockedPages) || parsedConfig.lockedPages.length === 0) {
      parsedConfig.lockedPages = DEFAULT_LOCKED_PAGES;
    }

    return NextResponse.json(parsedConfig);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
