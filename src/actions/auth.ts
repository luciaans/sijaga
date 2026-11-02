"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { REMEMBER_ME_COOKIE, REMEMBER_ME_MAX_AGE } from "@/lib/supabase/session";

export type ActionResult = { success: true } | { success: false; error: string };

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Username atau password salah" };
  const { username, password, expectedRole } = parsed.data;
  const rememberMe = parsed.data.rememberMe ?? false;
  // Penundaan tetap berlaku untuk kredensial keliru agar percobaan berulang tidak terlalu cepat.
  await new Promise((resolve) => setTimeout(resolve, 700));
  const supabase = await createClient(rememberMe);
  const { data, error } = await supabase.auth.signInWithPassword({ email: `${username}@sijaga.local`, password });
  if (error || !data.user) return { success: false, error: "Username atau password salah" };
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id, role, is_active, deleted_at").eq("auth_user_id", data.user.id).maybeSingle();
  if (!profile || !profile.is_active || profile.deleted_at || profile.role !== expectedRole) {
    await supabase.auth.signOut();
    const cookieStore = await cookies();
    cookieStore.set(REMEMBER_ME_COOKIE, "", { path: "/", maxAge: 0 });
    return { success: false, error: "Username atau password salah" };
  }
  const cookieStore = await cookies();
  if (rememberMe) {
    cookieStore.set(REMEMBER_ME_COOKIE, "1", { path: "/", maxAge: REMEMBER_ME_MAX_AGE, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  } else {
    cookieStore.set(REMEMBER_ME_COOKIE, "", { path: "/", maxAge: 0 });
  }
  if (profile.role === "admin") await admin.from("audit_logs").insert({ user_id: profile.id, action: "login", target_type: "auth" });
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.set(REMEMBER_ME_COOKIE, "", { path: "/", maxAge: 0 });
  redirect("/login");
}
