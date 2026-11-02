"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { violationSchema, type ViolationInput } from "@/lib/validations/violation";
import { photoMetadataSchema } from "@/lib/validations/photo";
import { PHOTO_BUCKET, PHOTO_MAX_BYTES, PHOTO_MIME_TYPES, USTAZ_CAN_DELETE_OWN_REPORT } from "@/lib/constants";

export type ViolationActionResult = { success: true; id?: string } | { success: false; error: string };

const reportSubmissionSchema = violationSchema.extend({ photo: z.instanceof(File).optional() });

async function uploadPhoto(photo: File, profileId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const validation = photoMetadataSchema.safeParse({ name: photo.name, type: photo.type, size: photo.size });
  const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  if (!validation.success || !(PHOTO_MIME_TYPES as readonly string[]).includes(photo.type) || photo.size > PHOTO_MAX_BYTES || photo.size === 0) throw new Error(validation.success ? "Foto tidak valid." : validation.error.issues[0]?.message);
  const bytes = new Uint8Array(await photo.arrayBuffer());
  const validSignature = photo.type === "image/jpeg" ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : photo.type === "image/png" ? [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte)
      : String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!validSignature) throw new Error("Isi file tidak sesuai dengan format foto.");
  const objectPath = `${profileId}/${crypto.randomUUID()}.${extensions[photo.type]}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(objectPath, photo, { contentType: photo.type, upsert: false });
  if (error) throw new Error("Foto gagal diunggah. Periksa izin Storage.");
  return objectPath;
}

export async function createViolationAction(input: unknown): Promise<ViolationActionResult> {
  const profile = await requireRole();
  const parsed = reportSubmissionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Data laporan tidak valid." };
  const { photo, ...value } = parsed.data as ViolationInput & { photo?: File };
  const supabase = await createClient();
  let photoPath: string | null = null;
  try { if (photo) photoPath = await uploadPhoto(photo, profile.id, supabase); }
  catch (error) { return { success: false, error: error instanceof Error ? error.message : "Foto gagal diunggah." }; }
  const { data, error } = await supabase.from("pelanggaran").insert({
    student_name: value.studentName, student_class: value.studentClass, category: value.category,
    description: value.description, incident_date: value.incidentDate, reporter_id: profile.id, student_photo_url: photoPath,
  }).select("id").single();
  if (error || !data) {
    if (photoPath) await supabase.storage.from(PHOTO_BUCKET).remove([photoPath]);
    return { success: false, error: "Laporan gagal disimpan. Periksa kembali data yang diisi." };
  }
  revalidatePath("/dashboard"); revalidatePath("/pelanggaran"); revalidatePath(`/santri/${encodeURIComponent(value.studentName)}`);
  return { success: true, id: data.id };
}

export async function updateViolationAction(id: string, input: unknown): Promise<ViolationActionResult> {
  const profile = await requireRole();
  const parsed = reportSubmissionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Data laporan tidak valid." };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("pelanggaran").select("id,reporter_id,student_name,student_photo_url").eq("id", id).maybeSingle();
  if (!existing || (profile.role !== "admin" && existing.reporter_id !== profile.id)) return { success: false, error: "Anda tidak memiliki akses untuk mengubah laporan ini." };
  const { photo, ...value } = parsed.data as ViolationInput & { photo?: File };
  let photoPath: string | null = null;
  try { if (photo) photoPath = await uploadPhoto(photo, profile.id, supabase); }
  catch (error) { return { success: false, error: error instanceof Error ? error.message : "Foto gagal diunggah." }; }
  const update: Record<string, string | null> = { student_name: value.studentName, student_class: value.studentClass, category: value.category, description: value.description, incident_date: value.incidentDate };
  if (photoPath) update.student_photo_url = photoPath;
  const { error } = await supabase.from("pelanggaran").update(update).eq("id", id);
  if (error) {
    if (photoPath) await supabase.storage.from(PHOTO_BUCKET).remove([photoPath]);
    return { success: false, error: "Perubahan laporan gagal disimpan." };
  }
  if (photoPath && existing.student_photo_url) await createAdminClient().storage.from(PHOTO_BUCKET).remove([existing.student_photo_url]);
  revalidatePath("/dashboard"); revalidatePath("/pelanggaran"); revalidatePath(`/pelanggaran/${id}`); revalidatePath(`/santri/${encodeURIComponent(existing.student_name)}`); revalidatePath(`/santri/${encodeURIComponent(value.studentName)}`);
  return { success: true, id };
}

export async function deleteViolationAction(id: string): Promise<ViolationActionResult> {
  const profile = await requireRole();
  if (profile.role !== "admin" && !USTAZ_CAN_DELETE_OWN_REPORT) return { success: false, error: "Hanya admin yang dapat menghapus laporan." };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("pelanggaran").select("id,reporter_id,student_photo_url").eq("id", id).maybeSingle();
  if (!existing || (profile.role !== "admin" && existing.reporter_id !== profile.id)) return { success: false, error: "Laporan tidak ditemukan atau akses ditolak." };
  const { error } = await supabase.from("pelanggaran").delete().eq("id", id);
  if (error) return { success: false, error: "Laporan gagal dihapus." };
  if (existing.student_photo_url) await createAdminClient().storage.from(PHOTO_BUCKET).remove([existing.student_photo_url]);
  revalidatePath("/dashboard"); revalidatePath("/pelanggaran");
  return { success: true };
}
