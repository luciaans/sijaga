import { z } from "zod";

const username = z.string().trim().min(4, "Username minimal 4 karakter").max(30, "Username maksimal 30 karakter").regex(/^[a-z0-9_]+$/, "Gunakan huruf kecil, angka, atau garis bawah");
const fullName = z.string().trim().min(2, "Nama lengkap wajib diisi").max(120, "Nama maksimal 120 karakter");
export const educatorTypeSchema = z.enum(["ustadz", "ustadzah"]);
export const createUstazSchema = z.object({ fullName, username, educatorType: educatorTypeSchema, password: z.string().min(8, "Kata sandi minimal 8 karakter"), confirmPassword: z.string() }).refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Konfirmasi kata sandi tidak cocok" });
export const updateUstazSchema = z.object({ id: z.string().uuid(), fullName, username, educatorType: educatorTypeSchema, password: z.string().optional().refine((value) => !value || value.length >= 8, "Kata sandi minimal 8 karakter") });
export type CreateUstazInput = z.infer<typeof createUstazSchema>;
export type UpdateUstazInput = z.infer<typeof updateUstazSchema>;
