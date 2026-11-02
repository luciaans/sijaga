# Checklist pengujian SIJAGA

## Otomatis

- [x] `npm run lint` — lulus.
- [x] `npx tsc --noEmit` — lulus.
- [x] `npm run build` — lulus.
- [x] `npm test` — uji validasi login, akun ustaz, laporan, dan foto.
- [ ] `npm run test:rls` — belum dijalankan karena project Supabase dan dua akun uji belum dikonfigurasi. Jalankan setelah mengisi variabel TEST di `.env.local`.

## Pemeriksaan manual setelah Supabase siap

- [ ] Ustaz A dapat membaca laporan B, tetapi perubahan dan penghapusan laporan B ditolak RLS.
- [ ] Ustaz tidak dapat mengubah `reporter_id` laporan sendiri atau `profiles.role`.
- [ ] Pengguna tanpa sesi diarahkan ke `/login`; Ustaz diarahkan kembali dari `/admin/*`.
- [ ] Login Admin dengan tab Ustaz dan sebaliknya ditolak dengan pesan generik.
- [ ] Akun nonaktif/terhapus tidak dapat masuk; sesi aktifnya ditolak pada request berikutnya.
- [ ] Foto non-gambar, ekstensi/MIME tidak cocok, signature palsu, dan file >2 MB ditolak. Tanpa foto tampil avatar inisial.
- [ ] Berkas `.next/static` tidak memuat service role key: `rg -n "SUPABASE_SERVICE_ROLE_KEY|service_role" .next/static` tidak mengembalikan hasil.
- [ ] Rekap dengan minimal 50 baris menghasilkan beberapa halaman, header tabel terulang, deskripsi panjang ter-wrap, dan nama file sesuai format.
- [ ] Uji tampilan di lebar 375 px, 768 px, dan 1280 px.

Skrip `scripts/test-rls.ts` menguji baca lintas ustaz, pembatasan edit/hapus pemilik, perubahan `reporter_id`, dan perubahan role langsung dengan anon key Supabase. Uji akun nonaktif, upload Storage, PDF multi-halaman, dan breakpoint tetap perlu dijalankan pada project terkonfigurasi.
