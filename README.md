# SIJAGA — Pondok Pesantren Al-Jihad

Sistem Informasi Jejak dan Administrasi Pelanggaran Santri. Aplikasi Next.js dengan Supabase Auth, PostgreSQL, Storage privat, dan PDF rekap.

## Menjalankan aplikasi

1. Salin `.env.example` menjadi `.env.local` dan isi kredensial Supabase.
2. Jalankan migrasi SQL dalam urutan `supabase/migrations/` di SQL Editor Supabase.
3. Buat admin awal dengan `npm run create-admin`.
4. Jalankan `npm run dev`, lalu buka `http://localhost:3000`.

Petunjuk lengkap ada di [docs/INSTALASI.md](docs/INSTALASI.md).

## Perintah

- `npm run dev` — server pengembangan
- `npm run lint` — pemeriksaan ESLint
- `npx tsc --noEmit` — pemeriksaan TypeScript
- `npm test` — uji otomatis skema Zod
- `npm run test:rls` — uji RLS dengan dua akun uji ustaz
- `npm run build` / `npm start` — build dan server produksi

## Struktur utama

- `src/app/` — halaman dan route App Router
- `src/actions/` — Server Actions untuk autentikasi, akun, dan laporan
- `src/lib/` — klien Supabase, validasi, PDF, dan autentikasi
- `src/components/` — layout, formulir, tabel, dan grafik
- `supabase/migrations/` — skema, RLS, Storage, trigger, RPC
- `scripts/` — pembuatan admin dan pemeriksaan RLS
- `docs/` — panduan instalasi, basis data, asumsi, dan checklist uji
