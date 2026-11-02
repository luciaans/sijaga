# Asumsi dan keputusan implementasi

- Login memakai username lowercase yang dipetakan ke `{username}@sijaga.local`; email internal tidak ditampilkan.
- Tidak ada registrasi publik maupun data demo. Semua daftar dan statistik bersumber dari Supabase. Akun admin pertama dibuat manual dengan skrip.
- Penghapusan akun ustaz adalah soft delete pada profil dan ban permanen akun Auth; relasi pelaporan lama tetap dapat dibaca.
- Penghapusan laporan hanya untuk admin (`USTAZ_CAN_DELETE_OWN_REPORT = false`). Jika kebijakan ini diubah, policy `pelanggaran_delete_admin` di `002_rls.sql`, Server Action, dan tombol UI harus diubah bersama.
- Login memiliki penundaan 700 ms. Perlindungan brute force tambahan bergantung pada rate limit Auth Supabase dan konfigurasi deployment; tidak ada penyimpanan rate limit terdistribusi lokal.
- Foto sumber dibatasi 2 MB di client, dikompres ke JPEG maksimal sisi 1.280 piksel, diverifikasi ulang MIME/ekstensi/signature di server, lalu disimpan di bucket privat.
- Nama santri dinormalisasi lowercase dan spasi ganda dirapikan. Perbedaan ejaan yang bukan sekadar kapital/spasi tetap menjadi identitas riwayat berbeda.
- Rekap memuat semua baris sesuai filter. Browser membuat PDF menggunakan jsPDF; ukuran data sangat besar akan memakai memori browser sesuai jumlah baris.
- Pengujian database langsung memerlukan project Supabase, minimal dua akun ustaz, dan environment yang disiapkan pengguna. Pemeriksaan yang belum dapat dijalankan dicatat di `PENGUJIAN.md`.
