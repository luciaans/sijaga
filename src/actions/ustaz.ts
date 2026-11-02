"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUstazSchema, updateUstazSchema } from "@/lib/validations/ustaz";

export type UstazActionResult = { success: true } | { success: false; error: string };
const normalizeError = (error: unknown) => error instanceof Error ? error.message : "Operasi akun gagal.";

export async function createUstazAction(input: unknown): Promise<UstazActionResult> {
  const adminProfile = await requireRole(["admin"]);
  const parsed = createUstazSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Data akun tidak valid." };
  const values = parsed.data;
  const admin = createAdminClient();
  const { data: existing } = await admin.from("profiles").select("id").eq("username", values.username).maybeSingle();
  if (existing) return { success: false, error: "Username sudah digunakan." };
  const { data, error } = await admin.auth.admin.createUser({ email: `${values.username}@sijaga.local`, password: values.password, email_confirm: true });
  if (error || !data.user) return { success: false, error: "Akun ustadz/ustadzah gagal dibuat. Periksa username dan coba lagi." };
  const { data: profile, error: profileError } = await admin.from("profiles").insert({ auth_user_id: data.user.id, full_name: values.fullName, username: values.username, role: "ustaz", educator_type: values.educatorType }).select("id").single();
  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { success: false, error: "Profil ustadz/ustadzah gagal disimpan. Silakan coba kembali." };
  }
  await admin.from("audit_logs").insert({ user_id: adminProfile.id, action: "create", target_type: "ustaz", target_id: profile.id, metadata: { username: values.username } });
  revalidatePath("/admin/ustaz");
  return { success: true };
}

export async function updateUstazAction(input: unknown): Promise<UstazActionResult> {
  const adminProfile = await requireRole(["admin"]);
  const parsed = updateUstazSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Data akun tidak valid." };
  const values = parsed.data;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id,auth_user_id,username,full_name,educator_type").eq("id", values.id).eq("role", "ustaz").is("deleted_at", null).maybeSingle();
  if (!profile) return { success: false, error: "Akun ustadz/ustadzah tidak ditemukan." };
  const { data: duplicate } = await admin.from("profiles").select("id").eq("username", values.username).neq("id", values.id).maybeSingle();
  if (duplicate) return { success: false, error: "Username sudah digunakan." };
  const { error } = await admin.from("profiles").update({ full_name: values.fullName, username: values.username, educator_type: values.educatorType }).eq("id", values.id);
  if (error) return { success: false, error: normalizeError(error) };
  const authUpdate: { email: string; email_confirm: boolean; password?: string } = { email: `${values.username}@sijaga.local`, email_confirm: true };
  if (values.password) authUpdate.password = values.password;
  const { error: authError } = await admin.auth.admin.updateUserById(profile.auth_user_id, authUpdate);
  if (authError) {
    await admin.from("profiles").update({ full_name: profile.full_name, username: profile.username, educator_type: profile.educator_type }).eq("id", values.id);
    return { success: false, error: "Perubahan akun gagal disimpan." };
  }
  await admin.from("audit_logs").insert({ user_id: adminProfile.id, action: "update", target_type: "ustaz", target_id: values.id, metadata: { username: values.username } });
  revalidatePath("/admin/ustaz");
  return { success: true };
}

export async function setUstazActiveAction(id: string, active: boolean): Promise<UstazActionResult> {
  const adminProfile = await requireRole(["admin"]);
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id,auth_user_id,username").eq("id", id).eq("role", "ustaz").is("deleted_at", null).maybeSingle();
  if (!profile) return { success: false, error: "Akun ustadz/ustadzah tidak ditemukan." };
  const { error } = await admin.from("profiles").update({ is_active: active }).eq("id", id);
  if (error) return { success: false, error: "Status akun gagal diperbarui." };
  const { error: authError } = await admin.auth.admin.updateUserById(profile.auth_user_id, { ban_duration: active ? "none" : "876000h" });
  if (authError) {
    await admin.from("profiles").update({ is_active: !active }).eq("id", id);
    return { success: false, error: "Status login gagal diperbarui." };
  }
  await admin.from("audit_logs").insert({ user_id: adminProfile.id, action: active ? "activate" : "deactivate", target_type: "ustaz", target_id: id, metadata: { username: profile.username } });
  revalidatePath("/admin/ustaz");
  return { success: true };
}

export async function deleteUstazAction(id: string): Promise<UstazActionResult> {
  const adminProfile = await requireRole(["admin"]);
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id,auth_user_id,username").eq("id", id).eq("role", "ustaz").is("deleted_at", null).maybeSingle();
  if (!profile) return { success: false, error: "Akun ustadz/ustadzah tidak ditemukan." };
  const { error } = await admin.from("profiles").update({ is_active: false, deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) return { success: false, error: "Akun gagal dihapus." };
  const { error: authError } = await admin.auth.admin.updateUserById(profile.auth_user_id, { ban_duration: "876000h" });
  if (authError) return { success: false, error: "Akun dinonaktifkan, tetapi pemblokiran login gagal. Coba ulangi." };
  await admin.from("audit_logs").insert({ user_id: adminProfile.id, action: "delete", target_type: "ustaz", target_id: id, metadata: { username: profile.username } });
  revalidatePath("/admin/ustaz");
  return { success: true };
}
