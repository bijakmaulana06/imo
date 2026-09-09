# Voting ketua angkatan

Halaman `/voting` menampilkan kandidat, memverifikasi pemilih, dan menerima satu suara per pemilih per pemilihan. Halaman `/voting/monitor` hanya dapat diakses akun panitia yang masuk melalui Supabase Auth dan terdaftar pada `voting_admins`.

Implementasi memerlukan konfigurasi Supabase, migrasi, data kandidat, daftar pemilih, dan environment deployment. Saat belum dikonfigurasi, antarmuka menampilkan kondisi persiapan. Menjalankan build tidak otomatis membuat database, mengunggah foto, atau membuka pemilihan.

## Pengoperasian melalui web

1. Buka `/admin/voting` dan masuk menggunakan akun Supabase yang sudah diberi akses panitia. Panel utama admin juga menyediakan pintasan **Kelola pemilihan ketua angkatan**.
2. Pilih draft pemilihan. Isi jadwal sesuai zona waktu perangkat; kosongkan jadwal jika ingin membuka dan menutup secara manual.
3. Tambahkan minimal dua kandidat. Isi nama, tagline, visi, dan misi, lalu unggah foto JPEG/PNG/WebP maksimal 6 MB. Server memvalidasi gambar, membuang metadata, mengubahnya menjadi WebP, dan menyimpan foto di R2.
4. Unduh template CSV, isi kolom `nim` sebagai teks, kemudian unggah kembali. Panel membuat kode akses acak di memori perangkat. Unduh CSV kode pribadi dan pastikan berkas sudah tersimpan sebelum menekan **Impor ke pemilihan**. Jika respons impor terputus, ulangi dari panel yang sama; data identik tidak dihitung atau diimpor dua kali.
5. Distribusikan setiap kode hanya kepada pemilik NIM. Ubah status menjadi **Dibuka**, konfirmasi perubahan, dan simpan. Jadwal tetap diperiksa oleh database pada saat vote dikirim.
6. Pantau `/voting/monitor`. Rekap CSV berisi perolehan kandidat dan aktivitas per jam, tanpa NIM atau pilihan individu.

Kandidat, foto, dan daftar NIM hanya dapat diubah saat status draft dan belum ada suara. Draft dapat disiapkan lagi sebelum ada suara; setelah suara pertama, hasil tidak dapat direset melalui panel. Menutup voting menghentikan suara baru; permintaan ulang dari suara yang sudah tercatat mengembalikan tanda terima yang sama.

## Deployment untuk imo2026.vercel.app

Kode di workspace harus dideploy ulang ke proyek Vercel yang melayani `imo2026.vercel.app`. Perubahan `.env.local` **tidak** otomatis memperbarui environment Vercel.

- Isi variabel dari `.env.voting.example` pada environment **Production** di Vercel. Gunakan `APP_ORIGIN=https://imo2026.vercel.app` dan salin nilai `VOTING_SECRET` terbaru yang sama dengan server/importer lokal. Jangan mengirim nilainya lewat chat.
- Lokal saat ini memakai `npm run dev:https` dan `APP_ORIGIN=https://localhost:3000`. Untuk `npm run dev` biasa, sesuaikan origin ke `http://localhost:3000`.
- Gunakan `R2_DELIVERY_MODE=proxy` agar foto dibaca server langsung dari R2 dan disajikan lewat origin aplikasi. Ini menghindari ketergantungan browser pada DNS `r2.dev`. Mode `direct` tersedia jika custom domain R2 publik sudah bekerja.
- Di Supabase Authentication → URL Configuration, izinkan `https://imo2026.vercel.app/auth/callback` dan `https://localhost:3000/auth/callback`. Google OAuth memakai callback ini; login email/kata sandi tidak memerlukan redirect OAuth. URL callback hanya menerima tujuan dashboard/panel yang sudah ditentukan.
- Sesudah deployment, pastikan `/api/voting/election` mengembalikan `configured: true`, login panitia berhasil, dan status realtime terhubung. Tidak ada kandidat atau NIM contoh yang otomatis dimasukkan ke pemilihan sebenarnya.

Migrasi dan allowlist akun panitia pada database aktif telah dipasang dalam pekerjaan ini. Draft pemilihan pertama tersedia; data kandidat dan NIM tetap harus diisi panitia. Rahasia voting diganti sebelum ada pemilih terdaftar karena nilai sebelumnya sempat dibagikan di percakapan.

## Identitas pemilih dan kerahasiaan

NIM saja tidak membuktikan kepemilikan identitas karena dapat diketahui orang lain. Karena itu pemilih memasukkan **NIM dan kode akses pribadi** yang diterbitkan panitia. Verifikasi identitas penerima sebelum membagikan satu kode melalui kanal pribadi. Jangan mempublikasikan daftar pasangan NIM/kode, mengirim seluruh daftar ke grup, atau memasukkannya ke Git, R2 publik, spreadsheet publik, dan log.

NIM diperlakukan sebagai teks: spasi di awal/akhir dipangkas, huruf dijadikan kapital, lalu harus cocok dengan `[A-Z0-9]{6,24}`. Nol di awal dipertahankan. Tanda titik, tanda hubung, spasi di tengah, serta karakter Unicode serupa ditolak. Jika format resmi NIM berbeda, ubah validator bersama di `lib/voting/identity.mjs` dan tesnya **sebelum** impor; jangan menghapus karakter secara diam-diam.

Database menyimpan HMAC SHA-256 dari `nim:<NIM ternormalisasi>` dan `access:<kode>` dengan `VOTING_SECRET`, beserta empat karakter terakhir NIM untuk tampilan sesi. NIM lengkap dan kode asli berada hanya pada berkas distribusi privat milik panitia. Kode menggunakan 24 byte acak kriptografis (192 bit), peka huruf kapital, dan bukan nomor urut yang dapat ditebak.

Satu NIM dapat ikut pada pemilihan berbeda karena batas unik menggunakan pasangan `election_id` dan hash NIM. HMAC menggunakan rahasia server yang sama pada impor dan verifikasi. Simpan backup rahasia secara aman; penggantian rahasia membuat daftar pemilih dan sesi lama tidak cocok. Jangan melakukan rotasi mendadak ketika pemilihan berjalan.

## 1. Siapkan environment

Gunakan `.env.voting.example` sebagai daftar variabel, lalu isi `.env.local` untuk pengembangan dan secret environment pada penyedia hosting untuk produksi. Jangan menyalin placeholder sebagai nilai produksi.

| Variabel | Kegunaan |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase yang sama untuk aplikasi dan CLI |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon key untuk Supabase Auth dan langganan realtime dengan RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Akses database server; jangan pernah beri awalan `NEXT_PUBLIC_` |
| `VOTING_SECRET` | Rahasia acak minimal 32 karakter; gunakan secret manager, sama pada CLI dan server |
| `APP_ORIGIN` | Origin aplikasi persis, misalnya `http://localhost:3000` untuk lokal atau origin HTTPS produksi |
| `VOTING_ELECTION_ID` | Opsional; memilih UUID pemilihan secara eksplisit, menggantikan `is_current` |
| `VOTING_IP_HEADER` | Opsional; nama header IP yang dijamin ditimpa oleh ingress tepercaya |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Konfigurasi unggah foto kandidat pada server |
| `R2_PUBLIC_URL` | Origin/custom domain HTTPS publik untuk membaca foto kandidat |
| `R2_DELIVERY_MODE` | `proxy` untuk menyajikan foto melalui aplikasi, `direct` untuk domain publik R2 |

Tidak ada fallback dari service role ke anon key. Server produksi menolak mutasi ketika origin belum dikonfigurasi. Jangan menggunakan URL preview berganti-ganti dengan origin produksi; setiap environment harus mempunyai origin dan cookie HTTPS yang sesuai.

Jika deployment berada langsung di belakang Cloudflare yang menimpa `CF-Connecting-IP`, `VOTING_IP_HEADER=cf-connecting-ip` dapat digunakan. Untuk platform lain, pastikan perilaku reverse proxy terlebih dahulu. Header IP yang dapat dipasok sembarang klien bukan sumber tepercaya. Tanpa variabel ini, pembatasan global, per NIM, dan per sesi tetap berlaku; pembatasan per IP tidak aktif. Tambahkan pembatasan trafik di ingress sesuai kapasitas acara.

## 2. Terapkan migrasi Supabase

Jalankan `migrations/voting.sql`, lalu `migrations/voting_admin.sql` melalui Supabase SQL Editor atau alur migrasi proyek. Migrasi membuat tabel terpisah berawalan `voting_`, fungsi transaksi, batas unik, Row Level Security, dan sinyal realtime publik yang hanya memuat ID pemilihan serta waktu perubahan. Rekap dan data pribadi dibaca melalui API dengan pemeriksaan akses. Jangan memberikan akses langsung kepada role `anon`/`authenticated` ke daftar pemilih, sesi, surat suara, atau `voting_tallies`.

Untuk koneksi PostgreSQL langsung, gunakan CA resmi Supabase dan verifikasi TLS penuh, sesuai [panduan SSL Supabase](https://supabase.com/docs/guides/platform/ssl-enforcement). Pengujian koneksi dalam pekerjaan ini memakai CA tersebut tanpa menonaktifkan verifikasi sertifikat.

Jangan menjalankan migrasi otomatis terhadap proyek produksi hanya untuk mencoba UI. CLI di bawah memodifikasi proyek yang ditunjuk environment; periksa proyek tujuan sebelum menjalankannya.

## 3. Buat pemilihan dalam status draft

Simpan contoh berikut sebagai berkas JSON lokal (contoh ini tidak berisi data pemilih):

```json
{
  "title": "Pemilihan Ketua Angkatan",
  "year": "2026",
  "status": "draft",
  "opens_at": "2026-10-01T08:00:00+07:00",
  "closes_at": "2026-10-01T17:00:00+07:00",
  "is_current": true
}
```

Sesuaikan tanggal dengan jadwal sebenarnya. Waktu harus menyertakan zona waktu. Contoh perintah PowerShell dari root proyek:

```powershell
node --env-file=.env.local scripts/voting-admin.mjs election --file "C:\PrivateVoting\election.json"
```

CLI mencetak UUID pemilihan. Gunakan UUID itu pada perintah berikutnya. Untuk memperbarui sebagian properti, gunakan berkas JSON berisi properti yang berubah dan argumen `--id`:

```powershell
node --env-file=.env.local scripts/voting-admin.mjs election --id "ELECTION_UUID" --file "C:\PrivateVoting\election-update.json"
```

Hanya satu pemilihan boleh mempunyai `is_current: true`. Saat mengganti pemilihan, set pemilihan lama menjadi `is_current: false`, kemudian aktifkan pemilihan baru, atau gunakan `VOTING_ELECTION_ID` untuk menunjuk UUID secara eksplisit. Selang pergantian dapat menampilkan kondisi belum ada pemilihan.

## 4. Masukkan kandidat dan foto R2

Buat bucket foto dengan token terbatas pada bucket tersebut. Pasang domain publik HTTPS dan sesuaikan `R2_PUBLIC_URL`. Unggah hanya foto kandidat yang memang boleh dilihat publik. R2 tidak boleh menjadi tempat penyimpanan daftar NIM/kode, token sesi, atau backup database.

Kandidat menyimpan **object key**, bukan URL bebas. Contoh key: `voting/2026/candidate-01.webp`. Aplikasi membentuk URL melalui domain R2 yang dikonfigurasi. Jika mengunggah melalui dashboard Cloudflare, pastikan tipe konten gambar benar dan optimalkan ukurannya untuk ponsel.

Contoh berkas kandidat; ganti semua teks contoh dengan data resmi:

```json
[
  {
    "number": 1,
    "name": "Nama Kandidat Pertama",
    "tagline": "Gagasan untuk angkatan",
    "vision": "Isi visi resmi kandidat.",
    "mission": ["Misi pertama.", "Misi kedua."],
    "photo_key": "voting/2026/candidate-01.webp",
    "accent": "#bfa276",
    "is_active": true
  }
]
```

```powershell
node --env-file=.env.local scripts/voting-admin.mjs candidates --election "ELECTION_UUID" --file "C:\PrivateVoting\candidates.json"
```

Perintah melakukan upsert berdasarkan pemilihan dan nomor kandidat. Berkas tersebut merupakan data lengkap kandidat yang disebut: properti opsional yang dihilangkan memakai nilai default. Nomor yang tidak disertakan tidak dihapus atau dinonaktifkan. Finalisasi kandidat sebelum membuka pemilihan; hindari perubahan nomor, identitas, atau status kandidat selama suara masuk.

## 5. Impor daftar pemilih dan bagikan kode secara pribadi

Ekspor daftar NIM resmi sebagai CSV UTF-8 dengan pemisah koma dan kolom `nim`. Baris pengantar sebelum judul kolom serta baris data pertama setelah judul kolom dilewati. Pertahankan baris `BARIS INI DILEWATI` dari template dan masukkan NIM setelahnya. Aturan ini berlaku di panel dan CLI. Kolom tambahan boleh ada tetapi tidak dikirim ke database. Pastikan aplikasi spreadsheet tidak menghapus nol di awal sebelum mengekspor. Nomor record pada pesan kesalahan dihitung dari awal CSV, termasuk judul dan baris kosong; isi bertanda kutip yang memuat beberapa baris tetap dihitung sebagai satu record.

```csv
nim
00123456
00123457
```

Ini hanya contoh format. Jangan gunakan NIM contoh sebagai data produksi. Simpan input dan output pada direktori privat **di luar repositori** dan di luar direktori sinkronisasi publik. Direktori output harus sudah ada. Gunakan nama ekspor baru yang belum ada:

```powershell
node --env-file=.env.local scripts/voting-admin.mjs import-voters --election "ELECTION_UUID" --file "C:\PrivateVoting\pemilih.csv" --export "C:\PrivateVoting\kode-pemilih-batch-01.csv"
```

Impor hanya berjalan saat pemilihan berstatus `draft`, maksimal 10.000 pemilih per berkas dan 5 MB input. Duplikasi NIM setelah normalisasi atau format ambigu membatalkan proses. Semua pemilih pada satu berkas dikirim sebagai satu INSERT atomik; NIM yang sudah ada menyebabkan batch ditolak, bukan menimpa atau merotasi kode lama.

CLI membuat CSV privat berisi `election_id,nim,access_code` **sebelum** menulis ke database agar kode tidak hilang jika ekspor gagal. Berkas dibuat eksklusif dan tidak menimpa berkas yang sudah ada. Pada Windows, staging directory dan file dibatasi dengan `icacls` kepada akun yang menjalankan CLI; pada sistem POSIX digunakan izin 0700/0600. Filesystem output harus mendukung hard link. ACL lokal tidak mencegah backup/sinkronisasi yang dijalankan oleh akun yang sama; pilih lokasi penyimpanan dengan sadar.

CLI tidak mencetak NIM atau kode ke terminal. Bila permintaan database gagal atau hasilnya tidak pasti, berkas privat dipertahankan untuk pemulihan. **Jangan langsung mendistribusikan kode atau mengulang impor.** Periksa apakah batch sudah tersimpan: koneksi dapat terputus setelah transaksi commit. Cocokkan hash menggunakan helper yang sama pada mesin tepercaya; jangan menyalin plaintext ke SQL log. Jika belum ada record yang tersimpan, gunakan proses pemulihan terkontrol atau impor ulang dengan nama ekspor baru lalu musnahkan ekspor lama. Jangan menambahkan pemilih yang sama dengan memodifikasi hash untuk menghindari batas unik.

Bagikan satu kode hanya kepada pemilik NIM yang sudah diverifikasi. Kode memberikan akses memilih; orang yang memegang NIM dan kode dapat menggunakan hak suara tersebut. Tetapkan prosedur pemeriksaan identitas dan penanganan kode hilang sebelum acara. Jangan mengatur ulang suara secara ad hoc.

## 6. Beri akses panitia dan aktifkan realtime

Buat/siapkan akun panitia melalui Supabase Auth dan gunakan UUID pengguna Auth, bukan alamat email atau nilai `user_metadata`:

```powershell
node --env-file=.env.local scripts/voting-admin.mjs admin --user "SUPABASE_AUTH_USER_UUID"
```

Panitia masuk melalui halaman login aplikasi yang sudah ada, lalu membuka `/voting/monitor`. Backend memverifikasi sesi dengan Supabase Auth `getUser()` dan memeriksa allowlist `voting_admins`. Memberi metadata `role=admin` pada akun tidak cukup untuk mendapat akses. Untuk mencabut akses, hapus UUID terkait dari `voting_admins` dengan akses administrasi database tepercaya.

Pastikan layanan Supabase Realtime aktif dan hanya tabel sinyal `voting_updates` masuk ke publication `supabase_realtime` sesuai migrasi. Saat sinyal diterima, panel mengambil rekap dari API yang memeriksa sesi dan allowlist panitia. `voting_tallies` tidak dapat dibaca atau dilanggan langsung dari browser. Jangan memasukkan tabel daftar pemilih, sesi, atau surat suara mentah ke publication realtime. Tampilan monitoring hanya menampilkan agregat, jumlah partisipasi, serta riwayat interval waktu, bukan pasangan NIM–pilihan.

## 7. Uji staging lalu buka pemilihan

Jalankan pemeriksaan lokal yang tidak menyentuh database:

```powershell
npm run test:voting
npm run test:voting:browser
npx tsc --noEmit
```

Tes otomatis mencakup kontrak HMAC, normalisasi NIM, duplikasi/parsing CSV, serta ekspor privat. Tes database memakai PostgreSQL PGlite terisolasi, termasuk izin, transaksi admin, sesi, penolakan kandidat lintas pemilihan, tanda terima idempoten, dan pembatasan vote ganda. Pasang `@electric-sql/pglite` dalam runtime terpisah dan arahkan `VOTING_PGLITE_MODULE` ke `dist/index.js`; bila tidak tersedia, tes database melaporkan skip. PGlite menserialisasi koneksi, sehingga kontensi kunci dari beberapa koneksi PostgreSQL tetap perlu diuji di staging. Tes browser memakai fixture dengan Puppeteer, server lokal aktif, serta Chrome/Edge; atur `VOTING_BROWSER_PATH` atau `VOTING_TEST_URL` bila diperlukan. Fixture browser tidak menulis data pemilihan ke Supabase.

Gunakan data uji terpisah untuk memverifikasi alur berikut di staging:

1. NIM yang tidak terdaftar, kode salah, pemilih dinonaktifkan, sesi kedaluwarsa, dan kandidat dari pemilihan lain harus ditolak tanpa menambah suara.
2. Kirim dua permintaan memilih secara bersamaan untuk pemilih yang sama, termasuk dari dua sesi/browser. Jumlah surat suara dan agregat harus bertambah tepat satu. Mengulang permintaan setelah gangguan jaringan tidak boleh membuat suara baru atau mengganti pilihan pertama.
3. Coba mutasi dengan `Origin` salah, tanpa `X-Voting-Request: 1`, tanpa cookie sesi, dan body terlalu besar. Semuanya harus ditolak.
4. Dengan anon key dan akun biasa, akses langsung daftar pemilih, sesi, surat suara, dan fungsi voting harus ditolak. Akun non-panitia tidak boleh membuka endpoint monitoring atau berlangganan agregat privat.
5. Di dua browser berbeda, buka monitoring panitia dan masukkan suara sah. Pastikan agregat berubah, koneksi pulih setelah putus sementara, dan kondisi kosong/error tampil jelas.
6. Uji waktu sebelum buka, sesudah tutup, status `draft`/`closed`, serta perbedaan zona waktu. Database menentukan kelayakan waktu; jam browser bukan otoritas.
7. Periksa DevTools: cookie voting `HttpOnly`, `Secure` di produksi, `SameSite=Strict`; NIM/kode tidak berada di URL, localStorage, analytics, atau log. Pastikan tidak ada service role atau kredensial R2 di bundle klien.
8. Uji perangkat seluler, keyboard, mode reduced motion, dan koneksi lambat. Pastikan tahap konfirmasi menampilkan kandidat yang dipilih dan tanda terima baru muncul sesudah server mengonfirmasi transaksi.

Setelah data dan pengujian selesai, perbarui pemilihan dengan `{"status":"open"}` melalui perintah `election --id ... --file ...`. Jadwal `opens_at`/`closes_at` tetap diperiksa server. Untuk menghentikan penerimaan suara, ubah status menjadi `closed`.

## Operasional dan batas implementasi

Sesi voting menggunakan token acak 256 bit pada cookie HttpOnly. Database hanya menyimpan hash token. Sesi berlaku 15 menit, terikat hash User-Agent, dan permintaan mutasi memerlukan origin yang sesuai serta header khusus. Ikatan User-Agent membantu membatasi pemakaian ulang token secara sederhana; bukan autentikasi perangkat atau perlindungan terhadap XSS pada origin yang sama. Supabase Auth panitia tetap memakai mekanisme sesi aplikasi yang telah ada.

Pencegahan suara ganda harus berada dalam transaksi database dan batas unik, bukan hanya tombol nonaktif di browser. Pemantauan agregat menyembunyikan identitas dari halaman panitia; pengelola dengan service role/database tetap mempunyai akses administratif yang tinggi. Sistem ini bukan protokol pemilihan anonim terverifikasi secara kriptografis. Batasi personel dengan service role, tentukan masa retensi daftar pemilih/sesi, dan lakukan backup serta audit operasional sesuai kebutuhan acara.

Jadwalkan pembersihan sesi kedaluwarsa dan bucket rate limit lama sesuai skema, setelah memeriksa nama kolom pada migrasi. Jangan menghapus surat suara/hasil ketika pemilihan masih berlangsung. Bila ada kredensial lama yang pernah ditulis langsung dalam kode atau dokumen proyek, rotasi kredensial tersebut di penyedia layanan; menghapus teks dari commit terbaru tidak mencabut kunci yang telah tersebar.
