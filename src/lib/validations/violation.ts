import { z } from "zod";

export const violationSchema = z.object({
  studentName: z.string().trim().min(2, "Masukkan nama lengkap santri").max(120, "Nama santri terlalu panjang"),
  studentClass: z.string().trim().min(1, "Masukkan kelas santri").max(40, "Nama kelas terlalu panjang"),
  category: z.enum(["ringan", "sedang", "berat"], { error: "Pilih kategori pelanggaran" }),
  description: z.string().trim().min(3, "Deskripsi wajib diisi").max(5000, "Deskripsi maksimal 5.000 karakter"),
  incidentDate: z.string().date("Tanggal kejadian tidak valid").refine((value) => value <= new Date().toLocaleDateString("sv-SE"), "Tanggal kejadian tidak boleh di masa depan"),
});
export type ViolationInput = z.infer<typeof violationSchema>;
