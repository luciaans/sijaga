import { describe, expect, it } from "vitest";
import { loginSchema } from "../src/lib/validations/auth";
import { createUstazSchema } from "../src/lib/validations/ustaz";
import { violationSchema } from "../src/lib/validations/violation";
import { photoMetadataSchema } from "../src/lib/validations/photo";

describe("validasi login", () => {
  it("menerima username dan role yang benar", () => {
    expect(loginSchema.safeParse({ username: "ustaz_01", password: "rahasia", expectedRole: "ustaz" }).success).toBe(true);
  });
  it("menolak username dengan format tidak sesuai", () => {
    expect(loginSchema.safeParse({ username: "Ustaz!", password: "rahasia", expectedRole: "admin" }).success).toBe(false);
  });
});

describe("validasi akun ustaz", () => {
  const base = { fullName: "Ustaz Ahmad", username: "ahmad_ustaz", password: "kata-sandi-kuat", confirmPassword: "kata-sandi-kuat" };
  it("menerima data akun yang sah", () => expect(createUstazSchema.safeParse(base).success).toBe(true));
  it("menolak kata sandi konfirmasi yang berbeda", () => expect(createUstazSchema.safeParse({ ...base, confirmPassword: "berbeda" }).success).toBe(false));
});

describe("validasi laporan", () => {
  const valid = { studentName: "Santri Contoh", studentClass: "VII A", category: "ringan", description: "Terlambat mengikuti kegiatan pagi", incidentDate: "2020-01-10" };
  it("menerima laporan yang lengkap", () => expect(violationSchema.safeParse(valid).success).toBe(true));
  it("menolak tanggal kejadian di masa depan", () => {
    const future = new Date(Date.now() + 86_400_000).toLocaleDateString("sv-SE");
    expect(violationSchema.safeParse({ ...valid, incidentDate: future }).success).toBe(false);
  });
  it("menolak kategori yang tidak dikenal", () => expect(violationSchema.safeParse({ ...valid, category: "sangat-berat" }).success).toBe(false));
});

describe("validasi foto", () => {
  it("menerima JPG di bawah 2 MB", () => expect(photoMetadataSchema.safeParse({ name: "santri.jpg", type: "image/jpeg", size: 1024 }).success).toBe(true));
  it("menolak file non-gambar", () => expect(photoMetadataSchema.safeParse({ name: "dokumen.pdf", type: "application/pdf", size: 1024 }).success).toBe(false));
  it("menolak file lebih dari 2 MB", () => expect(photoMetadataSchema.safeParse({ name: "santri.png", type: "image/png", size: 2 * 1024 * 1024 + 1 }).success).toBe(false));
  it("menolak ekstensi yang tidak sesuai MIME", () => expect(photoMetadataSchema.safeParse({ name: "santri.png", type: "image/jpeg", size: 1024 }).success).toBe(false));
});
