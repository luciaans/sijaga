<div align="center">

<img src="public/al-jihad-emblem.png" alt="Lambang Pondok Pesantren Al-Jihad" width="112" />

# SIJAGA

### Sistem Informasi Jejak dan Administrasi Pelanggaran Santri

Membantu Pondok Pesantren Al-Jihad mencatat, memantau, dan menindaklanjuti kedisiplinan santri dengan lebih teratur.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_Postgres-3fcf8e?logo=supabase)](https://supabase.com/)

</div>

SIJAGA menyediakan pencatatan laporan pelanggaran, riwayat kedisiplinan per santri, dan ringkasan aktivitas dalam satu aplikasi berbahasa Indonesia. Akses dibedakan untuk administrator dan ustaz/ustazah, dengan data yang dilindungi melalui autentikasi serta Row Level Security (RLS) di Supabase.

## Fitur utama

| Fitur | Kegunaan |
| --- | --- |
| Dashboard | Memantau jumlah laporan, santri terdata, kategori pelanggaran, tren bulanan, dan aktivitas terbaru. |
| Data santri | Mencari santri dan melihat profil serta riwayat laporan kedisiplinannya. |
| Pencatatan pelanggaran | Membuat, melihat, dan mengelola laporan berdasarkan santri, kelas, tanggal, kategori, deskripsi, dan foto pendukung. |
| Filter dan pencarian | Menyaring laporan berdasarkan nama santri, kategori, kelas, pelapor, dan rentang tanggal. |
| Laporan dan rekap | Meninjau laporan, melihat ringkasan, serta mengunduh laporan PDF. |
| Manajemen akun | Administrator mengelola akun ustaz/ustazah dan melihat log aktivitas admin. |
| Akses berbasis peran | Administrator mengelola data sistem; ustaz/ustazah mencatat dan mengakses laporan sesuai hak aksesnya. |
| Penyimpanan foto privat | Foto santri disimpan di bucket privat Supabase Storage dan disajikan dengan tautan bertanda tangan. |

## Teknologi

- [Next.js 16](https://nextjs.org/) dengan App Router dan Server Actions
- [React 19](https://react.dev/) dan [TypeScript 6](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) Auth, PostgreSQL, Row Level Security, dan Storage
- Recharts untuk grafik, jsPDF untuk laporan PDF, dan Zod untuk validasi

## Menjalankan secara lokal

### Persiapan Supabase

1. Buat project Supabase dan siapkan Project URL, Publishable key (atau legacy anon key), serta Secret key (atau legacy service role key).
2. Jalankan `supabase/setup.sql` satu kali di SQL Editor Supabase. Sebagai alternatif, jalankan migrasi dalam `supabase/migrations/` secara berurutan. Jangan jalankan kedua cara sekaligus.
3. Salin `.env.example` menjadi `.env.local`, lalu isi nilai berikut:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ADMIN_USERNAME=admin_pondok
   ADMIN_PASSWORD=kata-sandi-kuat
   ADMIN_FULL_NAME=Administrator SIJAGA
   ```

   `SUPABASE_SERVICE_ROLE_KEY` hanya digunakan di sisi server. Jangan membagikan key ini atau memasukkannya ke dalam kode sisi klien.

### Instalasi dan jalankan

```bash
npm install
npm run create-admin
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Username admin harus terdiri dari 4–30 karakter huruf kecil, angka, atau garis bawah; kata sandi minimal 8 karakter.

## Perintah yang tersedia

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan. |
| `npm run lint` | Memeriksa kode dengan ESLint. |
| `npx tsc --noEmit` | Memeriksa tipe TypeScript. |
| `npm test` | Menjalankan pengujian otomatis skema validasi. |
| `npm run test:rls` | Menguji kebijakan RLS dengan dua akun uji ustaz. |
| `npm run build` | Membuat build produksi. |
| `npm start` | Menjalankan build produksi. |

## Struktur proyek

```text
src/app/                 Halaman dan route aplikasi
src/actions/             Server Actions
src/components/          Komponen antarmuka, formulir, tabel, dan grafik
src/lib/                 Supabase, autentikasi, dan validasi
supabase/migrations/     Skema basis data, RLS, Storage, trigger, dan fungsi
scripts/                 Skrip pembuatan admin dan uji RLS
docs/                    Panduan instalasi dan dokumentasi teknis
```

## Dokumentasi

- [Panduan instalasi lengkap](docs/INSTALASI.md)
- [Dokumentasi basis data](docs/DATABASE.md)
- [Panduan akun admin](docs/AKUN_ADMIN.md)
- [Asumsi aplikasi](docs/ASSUMPTIONS.md)
- [Checklist pengujian](docs/PENGUJIAN.md)

## Kredit

Dibuat oleh [Luciaans](https://github.com/luciaans) untuk Pondok Pesantren Al-Jihad.
