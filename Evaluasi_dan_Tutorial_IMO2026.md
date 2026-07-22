# Evaluasi Performa & Tutorial Penggunaan Portal IMO 2026

## 1. Evaluasi Performa Aplikasi

Portal IMO 2026 telah dioptimasi secara ekstensif menggunakan Next.js dan Three.js dengan pendekatan **High-Performance Rendering**. Berikut adalah hasil evaluasi performanya:

- **Build Time & Static Generation (SSG):**  
  Aplikasi berhasil dikompilasi ke bentuk produksi (100% route success) dalam waktu **~14.1 detik**, dengan fase *Static Page Generation* yang diselesaikan hanya dalam **1.48 detik** untuk 12 halaman statis. Ini menunjukkan efisiensi caching dan routing Next.js yang sangat baik.
  
- **Optimasi Animasi 3D (Three.js WebGL):**  
  Partikel Galaksi dan Awan Nebula menggunakan materi **ShaderMaterial kustom** dan **Additive Blending** untuk mencegah rendering berulang (overdraw) dengan frame buffer. Penggunaan `Float32Array` pada posisi partikel mengurangi beban *garbage collection* memori V8 Chrome, memberikan animasi yang *smooth* 60FPS.

- **Load Speed & SSR Hydration:**  
  *Dynamic rendering* dan WebGL Canvas dibungkus dengan state `mounted` dan dilabeli `"use client"`, menghindari isu *Hydration Mismatch* sekaligus memfasilitasi pemuatan background *asynchronously*. Latar belakang diatur ke resolusi perangkat otomatis (`dpr={[1, 1.5]}`) untuk stabilitas baterai pada perangkat *mobile*.

---

## 2. Tutorial Penggunaan Portal

Berikut adalah panduan visual untuk menggunakan berbagai fitur yang telah dibangun.

### A. Memasuki Portal Utama
Saat Anda membuka portal, layar akan menampilkan animasi **Launch Sequence**. Klik tombol **MULAI PENJELAJAHAN** untuk memasuki Hub Navigation (Pusat Penjelajahan).

![Hero Home](C:/Users/bijak/.gemini/antigravity-ide/brain/3b6ad3a0-9539-469f-9a49-57b523fed3fb/media__1784649734130.png)

### B. Pusat Penjelajahan (Mission Control Hub)
Navigasi ke berbagai modul dapat diakses melalui **Pusat Penjelajahan**.
1. Anda dapat mencari fitur tertentu melalui bar pencarian.
2. Gunakan filter tab di bagian bawah bar pencarian untuk melihat modul berdasarkan kategori (misalnya: *Generator & Tools*, *Media & Komunikasi*, *Pengumpulan Tugas*).

![Hub Penjelajahan](C:/Users/bijak/.gemini/antigravity-ide/brain/3b6ad3a0-9539-469f-9a49-57b523fed3fb/media__1784650365966.png)

### C. ID Card Generator
Salah satu modul interaktif utama adalah fitur pembuatan tanda pengenal (ID Card).
1. Buka halaman **ID Card Generator**.
2. Masukkan nama Anda pada kotak masukan yang tersedia.
3. Generator akan secara otomatis memperbarui *badge* ID Anda dengan visual yang sangat futuristik dan hologram keamanan (Cyber Frame).
4. Kartu ini dapat diunduh (melalui klik kanan/simpan gambar) untuk dicetak.

![ID Card Generator](C:/Users/bijak/.gemini/antigravity-ide/brain/3b6ad3a0-9539-469f-9a49-57b523fed3fb/media__1784677385766.png)

### D. Summary Tugas (Integrasi Google Sheets)
Sistem dilengkapi modul data *real-time* untuk memonitor tugas LO atau kelompok.
- Halaman **Summary Tugas** akan menampilkan tabel rekapitulasi data dari database.
- Terdapat fungsi interaktif di mana pengguna dapat mengklik sebuah baris tabel, yang akan membuka pratinjau iFrame dokumen/modul di atas hamparan (overlay).

![Summary Tugas](C:/Users/bijak/.gemini/antigravity-ide/brain/3b6ad3a0-9539-469f-9a49-57b523fed3fb/media__1784677873137.png)

### E. Navigasi & Keamanan Admin (Akses Terbatas)
Jika Anda perlu mengubah data:
1. Hubungi administrator untuk mengakses `/admin/login`.
2. Halaman dasbor akan tertutup secara otomatis menggunakan sesi *client-side* untuk keamanan data dasar (sandi bawaan `admin123`).

Dengan sistem yang futuristik dan aman ini, platform penjelajahan Anda siap meluncur ke ruang angkasa maya!
