# Instalasi SIJAGA

## 1. Siapkan Supabase

1. Buat project baru di Supabase dan simpan Project URL serta anon/public key.
   - Nama project: `SIJAGA`; pilih region yang dekat dengan pengguna (misalnya Singapore jika tersedia).
   - Gunakan password database yang kuat dan simpan terpisah dari password login admin SIJAGA.
   - Biarkan **Enable Data API** aktif. Sebaiknya matikan **Automatically expose new tables**; migration memberi grant API secara eksplisit dan RLS tetap membatasi akses baris.
   - **Enable automatic RLS** boleh tetap mati karena migrasi SIJAGA mengaktifkan RLS secara eksplisit pada semua tabel.
2. Buka **SQL Editor**, tempel isi `supabase/setup.sql`, lalu klik **Run** sekali. Alternatifnya, jalankan semua `supabase/migrations/*.sql` secara terpisah sesuai urutan. Jangan jalankan bundle dan migrasi satu per satu sekaligus.
3. Migrasi membuat tabel dan index, policy RLS, bucket privat `student-photos`, trigger, serta fungsi statistik.
   Untuk project yang sebelumnya sudah memakai setup lama, jalankan `supabase/migrations/004_educator_type.sql` agar pilihan akun Ustadz/Ustadzah tersedia.
4. Pada Authentication, pastikan penyedia Email aktif. Skrip pembuatan akun menandai alamat internal sebagai terverifikasi, sehingga pengguna tidak perlu menerima email.

## 2. Isi environment

Salin `.env.example` menjadi `.env.local`, kemudian isi. Di **Settings → API Keys**, gunakan Publishable key (`sb_publishable_...`) untuk variabel publik dan Secret key (`sb_secret_...`) untuk variabel server. Key legacy `anon`/`service_role` juga tetap diterima oleh nama variabel yang sama.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_USERNAME=admin_pondok
ADMIN_PASSWORD=kata-sandi-kuat-minimal-8-karakter
ADMIN_FULL_NAME=Administrator SIJAGA
```

Jangan membagikan service role key. Key tersebut hanya digunakan oleh skrip dan Server Actions server. `.env.local` sudah dikecualikan dari Git.

## 3. Buat admin pertama

```bash
npm install
npm run create-admin
```

Username harus 4–30 karakter huruf kecil, angka, atau garis bawah. Kata sandi minimal 8 karakter. Baca [AKUN_ADMIN.md](AKUN_ADMIN.md) untuk membuat admin pengganti.

## 4. Jalankan aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000`. Untuk mode produksi:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm start
```

## 5. Pengujian keamanan opsional

Buat dua akun ustaz melalui halaman admin dan setidaknya satu laporan untuk masing-masing. Isi `TEST_USTAZ_A_USERNAME`, `TEST_USTAZ_A_PASSWORD`, `TEST_USTAZ_B_USERNAME`, dan `TEST_USTAZ_B_PASSWORD` di `.env.local`, lalu jalankan `npm run test:rls`. Skrip menggunakan anon key dan menguji RLS sebagai kedua akun.
