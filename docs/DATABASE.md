# Basis data dan kebijakan

## ERD teks

```text
auth.users 1 ─── 1 profiles
profiles  1 ─── N pelanggaran (reporter_id)
profiles  1 ─── N audit_logs (user_id, dapat null)
pelanggaran.student_photo_url ─── path objek pada Storage privat student-photos
```

## Tabel

- **profiles** menyimpan identitas internal dan role akses `admin`/`ustaz`. Untuk akun pelapor, kolom `educator_type` membedakan sapaan **Ustadz** dan **Ustadzah** tanpa mengubah izin akses. Username unik tanpa membedakan kapital melalui index `lower(username)`. `deleted_at` mempertahankan profil akun yang telah dihapus lunak.
- **pelanggaran** menyimpan detail kejadian. Trigger mengisi `student_name_normalized` dengan huruf kecil, trim, dan satu spasi antar kata. `reporter_id` memakai `ON DELETE RESTRICT` agar riwayat pelapor tetap utuh.
- **audit_logs** mencatat aktor, aksi, objek, waktu, dan metadata non-sensitif. Trigger mencatat insert/update/delete laporan; Server Actions mencatat pengelolaan akun dan login admin.

## RLS

- Fungsi `security definer` (`current_profile_id`, `current_role`, `is_admin`, `is_active_user`) menggunakan `search_path` kosong dan memeriksa profil aktif berdasarkan `auth.uid()`.
- Pengguna aktif dapat membaca laporan dan profil; laporan baru harus memakai `reporter_id` sendiri. Admin dan pemilik laporan dapat mengubahnya, tetapi trigger menolak perubahan `reporter_id` oleh ustaz. Hapus laporan hanya untuk admin.
- Tidak ada policy tulis langsung untuk `profiles`; pengelolaan profil berjalan melalui Server Actions yang mewajibkan role admin dan Supabase Admin API server-side.
- `audit_logs` hanya dapat dibaca admin; penulisan melalui trigger atau Server Actions terpercaya.
- Bucket foto `student-photos` privat, maksimal 2 MB, hanya menerima JPEG/PNG/WebP. User aktif dapat membaca melalui signed URL. Upload dibatasi ke folder profile ID sendiri; ubah/hapus dibatasi pemilik atau admin.

## RPC dan agregasi

`dashboard_stats()` mengembalikan statistik kategori, tren bulanan, jumlah pelapor, dan laporan aktif. `ustaz_report_counts()` memberi jumlah laporan per akun. `student_history_summary(text)` menghitung ringkasan kategori riwayat santri. `report_filter_options()` mengembalikan nama santri dan kelas untuk filter/autocomplete. Semua fungsi baca berjalan sebagai `security invoker` supaya kebijakan RLS tetap diterapkan.

## Migrasi

1. `001_init.sql`: extension, tabel, index, normalisasi, dan trigger `updated_at`.
2. `002_rls.sql`: fungsi keamanan, trigger reporter/audit, RLS, bucket dan policy Storage.
3. `003_dashboard.sql`: RPC dashboard, manajemen akun, filter rekap, serta ringkasan riwayat.
4. `004_educator_type.sql`: pilihan Ustadz/Ustadzah; akun pelapor lama ditetapkan sebagai Ustadz.
5. `005_student_entry_flow.sql`: pencarian santri yang pernah dilaporkan dan rekap jumlah laporan per nama untuk formulir serta daftar pelanggaran.
