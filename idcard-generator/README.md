# Generator ID Card (Next.js + PSD Template)

Generator ID card yang membaca template **.psd** langsung di browser, mendeteksi
tag `{nama}`, `{nim}`, `{kelompok}`, dll di dalam layer teks, lalu membuat form
otomatis untuk mengisinya. Ada slot khusus `{foto}` untuk foto dengan bingkai
portrait, dan deteksi font custom yang belum tersedia di browser.

## 1. Install

```bash
npm install ag-psd
```

Tidak perlu paket tambahan lain (canvas API bawaan browser sudah cukup). Library
ini **hanya dipakai di client component** (`"use client"`) — jangan diimpor di
server component atau API route, karena bergantung pada `HTMLCanvasElement`
milik browser.

## 2. Kenapa semua proses di browser (client-side)?

Nama dan NIM mahasiswa tidak boleh keluar dari client. Karena itu:

- File `.psd` template (tidak berisi data pribadi) diambil dari server/Storage.
- Semua parsing PSD, isi form, dan render foto+teks terjadi **di canvas milik
  browser masing-masing user**. Tidak ada nama/NIM yang perlu dikirim ke server
  untuk menghasilkan gambar ID card.

## 3. Cara menyiapkan template di Photoshop

1. Buat layer teks berisi persis `{namatag}` untuk tiap data yang ingin
   diganti otomatis. Tag bisa berdiri sendiri (`{nama}`) atau dicampur teks
   statis (`NIM: {nim}`) — semuanya akan diganti sesuai isian form.
2. Untuk slot foto, buat **satu layer teks terpisah** isinya persis `{foto}`
   (tidak dicampur teks lain). Lebar bounding box layer inilah yang menentukan
   lebar bingkai foto — lebar sesuai selebar tag itu diketik di PSD.
   Tinggi bingkai otomatis dihitung sebagai potret (lihat bagian 5), tidak
   perlu diatur manual, dan diposisikan center secara vertikal terhadap posisi
   tag aslinya.
3. Nama font yang dipakai pada layer-layer bertag otomatis dikumpulkan untuk
   dicek ketersediaannya di browser (lihat bagian 6).

## 4. Pemakaian

```tsx
import IdCardGenerator from '@/components/IdCardGenerator';

<IdCardGenerator templateUrl="/templates/id-card.psd" />
```

Kalau `templateUrl` tidak diisi, komponen menampilkan tombol upload manual
(cocok untuk mode admin/preview template baru sebelum dipublikasikan).

## 5. Bingkai foto portrait

Rasio tinggi:lebar bingkai foto diatur lewat `photoAspectRatio` (default `4/3`,
mendekati proporsi foto 3x4 yang umum dipakai untuk ID/KTM). Ubah di
`renderIdCard.ts` atau teruskan lewat opsi `renderIdCard(canvas, parsed, {
values, photo, photoAspectRatio: 5/4 })` sesuai kebutuhan desain. Foto yang
diunggah otomatis di-crop mengikuti mode "cover" (mengisi penuh bingkai, sisi
yang kelebihan dipotong dari tengah) supaya tidak gepeng.

## 6. Font custom yang tidak terdeteksi

Saat template dibaca, tiap nama font di layer bertag dicek ke
`document.fonts.check()`. Font yang tidak terdeteksi (biasanya font
custom/berbayar yang tidak ter-install di komputer user) akan muncul sebagai
peringatan di form, dengan kolom untuk menempelkan:

- Link file font langsung (`.woff2` / `.woff` / `.ttf` / `.otf`), atau
- Link CSS Google Fonts (`https://fonts.googleapis.com/css2?family=...`)

Setelah menekan "Muat", font didaftarkan lewat `FontFace` API dan dipakai
untuk render selanjutnya. **Nama font di layer PSD harus sama persis** dengan
nama yang didaftarkan supaya otomatis terpakai.

## 7. Batasan yang perlu diketahui

- `ag-psd` tidak menggambar ulang teks secara native (ini dikonfirmasi di
  dokumentasi resminya) — karena itu layer bertag digambar ulang manual pakai
  Canvas 2D API berdasar posisi, ukuran, warna, dan alignment yang diambil
  dari data teks PSD. Hasilnya sangat mendekati tapi tidak 100% pixel-perfect
  dengan rendering asli Photoshop (kerning/hinting halus bisa sedikit beda).
- Ukuran font mengasumsikan dokumen PSD beresolusi 72 DPI (standar untuk
  desain web). Kalau template dibuat di resolusi cetak (mis. 300 DPI), ukuran
  teks di canvas bisa tampak lebih kecil dari yang terlihat di penggaris
  Photoshop — tinggal kalikan `fontSize` di `psdTemplate.ts` dengan
  `72 / dpiDokumen` kalau perlu.
- Blend mode layer (multiply, screen, overlay, dll) sudah dipetakan ke
  `globalCompositeOperation` canvas yang namanya cocok. Efek layer seperti
  drop shadow/stroke/glow tidak direplikasi ulang secara terpisah — efek itu
  sudah "terbakar" di dalam raster `layer.canvas` untuk layer non-tag, jadi
  tetap tampil apa adanya, kecuali untuk layer yang teksnya diganti (di layer
  itu, efeknya tidak ikut karena teksnya digambar baru).
- Grup layer, urutan tumpukan, opacity, dan visibility (hidden) semuanya
  dihormati saat render ulang.

## 8. Struktur file

```
lib/psdTemplate.ts     -> baca .psd, deteksi tag {tag} & {foto}, kumpulkan font
lib/fontManager.ts     -> cek & muat font custom
lib/renderIdCard.ts    -> gambar ulang PSD + ganti tag ke canvas
components/IdCardGenerator.tsx -> form otomatis + preview + tombol unduh
app/id-card/page.tsx   -> contoh pemakaian
```
