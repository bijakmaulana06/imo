export interface HomePhotoSlot {
  id: string;
  badge?: string;
  title: string;
  description: string;
  gdriveUrl: string;
  coordinateLabel?: string;
  dateTag?: string;
}

export interface LockedPageConfig {
  id: string;
  path: string; // e.g. "/info", "/id-card", "/documents"
  title: string; // e.g. "Status Hub & Pengumpulan"
  isLocked: boolean; // lock toggle
  reason?: string; // badge tag (e.g. "Rekap Data", "Pemeliharaan")
  message?: string; // custom terminal notice for the page
}

export interface SiteConfig {
  // Branding & Identity
  siteName: string;
  siteYear: string;
  siteLogoUrl: string;
  faviconUrl: string;
  metaTitle: string;
  metaDescription: string;
  
  // Theme & Styling
  accentCyan: string;
  accentPurple: string;
  accentYellow: string;
  backgroundColor: string;
  enableStarfield: boolean;
  glassBlurIntensity: string;

  // Web Status & Modes
  maintenanceMode: boolean;
  maintenanceMessage: string;
  taskSubmissionFrozen: boolean;
  taskFreezeMessage: string;
  lockedPages?: LockedPageConfig[];

  // Root System Controls
  swCacheVersion: string;
  killServiceWorker: boolean;
  cacheTtl: number;
  apiLockdown: boolean;
  
  // Global Top Banner
  enableGlobalBanner: boolean;
  globalBannerText: string;
  globalBannerStyle: "info" | "warning" | "alert" | "success";
  globalBannerLink: string;

  analyticsScriptTag: string;

  // Copywriting - Home Page
  homeMissionBadge: string;
  homeTagline: string;
  homeDescription: string;
  homeCtaLabel: string;
  homeCard1Title: string;
  homeCard1Desc: string;
  homeCard2Title: string;
  homeCard2Desc: string;
  homeCard3Title: string;
  homeCard3Desc: string;

  // Home Photo Slots (GDrive Showcase)
  homePhotoSlotsEnabled: boolean;
  homePhotoSlotsTitle: string;
  homePhotoSlotsSubtitle: string;
  homePhotoSlots: HomePhotoSlot[];

  // Copywriting - Info Page
  infoHeroTitle: string;
  infoHeroSubtitle: string;
  infoWarningNotice: string;

  // Copywriting - Hub Page
  hubHeroTitle: string;
  hubHeroSubtitle: string;
  hubSearchPlaceholder: string;

  // Copywriting - Guide Page
  guideHeroTitle: string;
  guideHeroSubtitle: string;

  // Copywriting - Contact Page
  contactHeroTitle: string;
  contactHeroSubtitle: string;

  // Copywriting - ID Card Page
  idCardHeroTitle: string;
  idCardHeroSubtitle: string;

  // Copywriting - Documents Page
  documentsHeroTitle: string;
  documentsHeroSubtitle: string;

  // Home Page Node Graph
  homeNodesOrder: string[];

  // Audio Player
  musicPlayerEnabled: boolean;
  musicUrl: string;
  musicTitle: string;
  musicArtist: string;
  musicAlbumArt: string;

  // Footer
  footerText: string;
}

export const DEFAULT_LOCKED_PAGES: LockedPageConfig[] = [
  {
    id: "info",
    path: "/info",
    title: "Status Hub & Pengumpulan",
    isLocked: false,
    reason: "Rekapitulasi Nilai",
    message: "Halaman status tugas dan pengumpulan berkas sedang dibatasi sementara waktu untuk sinkronisasi nilai dan verifikasi kelayakan berkas.",
  },
  {
    id: "idcard",
    path: "/id-card",
    title: "ID Card Generator",
    isLocked: false,
    reason: "Pembaruan Template",
    message: "Generator ID Card resmi sedang dalam tahap pembaruan aset grafis dan konfigurasi barcode.",
  },
  {
    id: "documents",
    path: "/documents",
    title: "Auto-Form Generator",
    isLocked: false,
    reason: "Pemeliharaan Dokumen",
    message: "Layanan pengisian form otomatis sedang dikunci untuk kalibrasi format formulir PDF terbaru.",
  },
  {
    id: "guide",
    path: "/guide",
    title: "Panduan & Embed Dokumen",
    isLocked: false,
    reason: "Sinkronisasi Panduan",
    message: "Modul panduan sedang diselaraskan dengan keputusan pengkondisian terbaru.",
  },
  {
    id: "hub",
    path: "/hub",
    title: "Pusat Penjelajahan (Hub)",
    isLocked: false,
    reason: "Audit Modul",
    message: "Pusat penjelajahan modul sedang dalam masa pengujian tautan eksternal.",
  },
  {
    id: "contact",
    path: "/contact",
    title: "Kontak Pendamping (LO)",
    isLocked: false,
    reason: "Pembaruan Kontak",
    message: "Daftar kontak pendamping kelompok sedang diperbarui.",
  },
];

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: "IMO 2026",
  siteYear: "2026",
  siteLogoUrl: "/Brighton.svg",
  faviconUrl: "/favicon.ico",
  metaTitle: "IMO 2026 - Innovative Minds Outclass",
  metaDescription: "Portal Resmi IMO 2026: Different Minds, Different Stories, One Generation Chasing Glories.",
  
  accentCyan: "#7df9ff",
  accentPurple: "#b48cff",
  accentYellow: "#ffd166",
  backgroundColor: "#020510",
  enableStarfield: true,
  glassBlurIntensity: "blur(30px)",

  maintenanceMode: false,
  maintenanceMessage: "Website IMO 2026 sedang dalam pemeliharaan sistem berkala. Mohon kembali beberapa saat lagi.",
  taskSubmissionFrozen: false,
  taskFreezeMessage: "Pengiriman dan verifikasi berkas sedang dibekukan sementara untuk rekapitulasi data.",
  lockedPages: DEFAULT_LOCKED_PAGES,

  swCacheVersion: "v1.0.0",
  killServiceWorker: false,
  cacheTtl: 3600,
  apiLockdown: false,
  
  enableGlobalBanner: false,
  globalBannerText: "📢 Pengumuman: Jadwal pengkondisian barisan telah diperbarui. Cek menu Panduan!",
  globalBannerStyle: "info",
  globalBannerLink: "/guide",

  analyticsScriptTag: "",

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

  homePhotoSlotsEnabled: true,
  homePhotoSlotsTitle: "ALUR KISAH PENJELAJAHAN ORBIT",
  homePhotoSlotsSubtitle: "Rekam jejak kronologis dan narasi momentum penjelajahan Mahasiswa Baru IMO 2026 dari awal keberangkatan hingga puncak inovasi.",
  homePhotoSlots: [],

  infoHeroTitle: "Status Hub & Pengumpulan",
  infoHeroSubtitle: "Verifikasi kelengkapan pengumpulan tugas kelompok dan berkas individu real-time.",
  infoWarningNotice: "Catatan: Jika ingin membuka folder, mohon menunggu loading selesai, Terimakasih.",

  hubHeroTitle: "PUSAT PENJELAJAHAN",
  hubHeroSubtitle: "Portal pusat navigasi cepat untuk mengakses semua panduan, tools generator, saluran media resmi, dan pusat berkas IMO 2026.",
  hubSearchPlaceholder: "Cari tautan modul, generator, atau panduan penjelajahan...",

  guideHeroTitle: "PANDUAN & EMBED DOKUMEN",
  guideHeroSubtitle: "Halaman interaktif pengumuman resmi & contoh surat. Tinjau dokumen bersandingan dengan petunjuk & tombol langsung ke Auto-Form Generator.",

  contactHeroTitle: "KONTAK",
  contactHeroSubtitle: "Temukan pemandu orbit Anda. Cari berdasarkan nama kelompok atau nama pendamping untuk menghubungi langsung.",

  idCardHeroTitle: "ID CARD GENERATOR",
  idCardHeroSubtitle: "Generator tanda pengenal resmi peserta IMO 2026. Diproses 100% di browser Anda untuk keamanan data penuh.",

  documentsHeroTitle: "AUTO-FORM GENERATOR",
  documentsHeroSubtitle: "Isi formulir online dan buat dokumen PDF resmi instan tanpa mengetik ulang.",

  homeNodesOrder: ["guide", "hub", "info", "idcard", "documents", "contact"],

  musicPlayerEnabled: false,
  musicUrl: "",
  musicTitle: "",
  musicArtist: "",
  musicAlbumArt: "",

  footerText: "Made with Astro-Physics & Next.js.",
};
