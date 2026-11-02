# Akun administrator

## Membuat admin pertama

Atur `ADMIN_USERNAME`, `ADMIN_PASSWORD`, dan `ADMIN_FULL_NAME` bersama URL Supabase dan service role key di `.env.local`, lalu jalankan `npm run create-admin`. Skrip membuat user Auth dengan email internal `{username}@sijaga.local`, menandai email terverifikasi, lalu membuat profil role admin. Kredensial tidak disimpan ke repo.

## Membuat admin pengganti

Untuk membuat admin kedua, isi variabel `ADMIN_*` dengan username dan kata sandi baru, lalu jalankan skrip yang sama. Setelah login admin baru berhasil, promosi/demosi role dapat dilakukan dari SQL Editor sebagai pemilik project. Ganti nilai username pada perintah sebelum menjalankannya:

```sql
update public.profiles set role = 'admin' where lower(username) = lower('admin_pengganti') and deleted_at is null;
update public.profiles set role = 'ustaz' where lower(username) = lower('admin_lama') and deleted_at is null;
```

Pastikan admin pengganti aktif dan dapat login sebelum menurunkan role akun lama. Perubahan role diperiksa pada request berikutnya.

## Pemulihan

Jika lupa kata sandi admin, buat kata sandi baru melalui Supabase Dashboard **Authentication → Users** atau buat admin pengganti dengan skrip di atas. Setelah pemulihan selesai, hapus nilai rahasia `ADMIN_*` dari environment deployment bila tidak dibutuhkan lagi.
