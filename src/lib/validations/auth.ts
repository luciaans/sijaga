import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(4, "Username minimal 4 karakter").max(30, "Username maksimal 30 karakter").regex(/^[a-z0-9_]+$/, "Gunakan huruf kecil, angka, atau garis bawah"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
  expectedRole: z.enum(["admin", "ustaz"]),
});
export type LoginInput = z.infer<typeof loginSchema>;
