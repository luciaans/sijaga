<p align="center">
  <img src="public/al-jihad-emblem.png" alt="Lambang Pondok Pesantren Al-Jihad" width="72" height="72" />
</p>

<h1 align="center">SIJAGA</h1>

<p align="center"><strong>Sistem Informasi Jejak dan Administrasi Pelanggaran Santri</strong></p>
<p align="center">Cara yang teratur untuk mencatat dan meninjau kedisiplinan santri di Pondok Pesantren Al-Jihad.</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-App_Router-111111?logo=nextdotjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-UI-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Database_and_Auth-3FCF8E?logo=supabase&logoColor=white" />
</p>

SIJAGA adalah aplikasi web untuk Pondok Pesantren Al-Jihad. Aplikasi ini menyatukan pencatatan pelanggaran, data santri, dan laporan kedisiplinan. Antarmuka aplikasi menggunakan bahasa Indonesia.

## Fitur

- **Dashboard** — Meninjau jumlah laporan, santri terdata, kategori pelanggaran, tren bulanan, dan aktivitas terbaru.
- **Pencatatan pelanggaran** — Mencatat kejadian berdasarkan santri, kelas, tanggal, kategori, deskripsi, dan foto pendukung.
- **Data dan riwayat santri** — Mencari santri dan melihat ringkasan serta riwayat laporan per santri.
- **Filter laporan** — Menyaring laporan berdasarkan nama santri, kategori, kelas, pelapor, dan rentang tanggal.
- **Laporan dan rekap** — Meninjau laporan dan mengunduh rekap dalam format PDF.
- **Manajemen akun** — Mengelola akun ustaz/ustazah dan meninjau aktivitas administrator.
- **Foto privat** — Menyimpan foto di Supabase Storage privat dan menyajikannya menggunakan tautan bertanda tangan.
- **Keamanan data** — Menggunakan autentikasi, hak akses berbasis peran, dan Row Level Security (RLS).

## Peran pengguna

- **Administrator** — Mengelola akun ustaz/ustazah, meninjau laporan, melihat data santri, dan mengakses log aktivitas.
- **Ustaz/ustazah** — Mencatat laporan dan melihat aktivitas pelaporan sesuai hak akses akun.

## Teknologi

Next.js App Router, React, TypeScript, Tailwind CSS, Supabase, Recharts, jsPDF, dan Zod.

## Memulai

### Persyaratan

- Node.js dan npm
- Project Supabase

### Instal dependensi

```bash
git clone https://github.com/luciaans/sijaga.git
cd sijaga
npm install
```

Buat file environment lokal dengan menyalin `.env.example` menjadi `.env.local`, kemudian isi nilainya:

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | URL project Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya | Publishable key Supabase (`sb_publishable_...`) atau legacy anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya | Secret key Supabase untuk proses server. Simpan rahasia dan jangan pernah mengeksposnya di kode klien. |
| `ADMIN_USERNAME` | Ya, untuk membuat admin | Username administrator pertama; 4–30 karakter huruf kecil, angka, atau garis bawah. |
| `ADMIN_PASSWORD` | Ya, untuk membuat admin | Kata sandi administrator pertama; minimal 8 karakter. |
| `ADMIN_FULL_NAME` | Ya, untuk membuat admin | Nama lengkap administrator pertama. |
| `TEST_USTAZ_A_USERNAME` dan `TEST_USTAZ_A_PASSWORD` | Opsional | Kredensial akun uji untuk `npm run test:rls`. |
| `TEST_USTAZ_B_USERNAME` dan `TEST_USTAZ_B_PASSWORD` | Opsional | Kredensial akun uji kedua untuk `npm run test:rls`. |

Jangan commit `.env.local` atau membagikan service role key.

### Siapkan Supabase

1. Buat project Supabase dan masukkan URL serta key ke `.env.local`.
2. Untuk project baru yang masih kosong, jalankan [`supabase/setup.sql`](supabase/setup.sql) satu kali di SQL Editor Supabase. Alternatifnya, jalankan file di [`supabase/migrations/`](supabase/migrations/) sesuai urutan. Jangan jalankan kedua cara sekaligus atau menjalankan ulang seluruh setup pada project yang sudah aktif.
3. Pastikan penyedia Email aktif di Supabase Authentication.
4. Buat akun administrator pertama:

   ```bash
   npm run create-admin
   ```

### Jalankan aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Skrip yang berguna

| Perintah | Keterangan |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan. |
| `npm run lint` | Memeriksa kode dengan ESLint. |
| `npx tsc --noEmit` | Memeriksa tipe TypeScript. |
| `npm test` | Menjalankan pengujian skema validasi. |
| `npm run test:rls` | Menguji RLS menggunakan dua akun uji ustaz. |
| `npm run build` | Membuat build produksi. |
| `npm start` | Menjalankan build produksi secara lokal. |

Untuk panduan konfigurasi lebih lanjut, lihat [dokumentasi instalasi](docs/INSTALASI.md). Jangan pernah menyimpan `.env.local` ke Git atau membagikan service role key.

---

Dibuat oleh [luciaans](https://github.com/luciaans).

Copyright © 2026 luciaans. All rights reserved.
