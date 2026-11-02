import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database";

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("auth_user_id", user.id).is("deleted_at", null).maybeSingle();
  if (error || !data || !data.is_active) {
    await supabase.auth.signOut();
    return null;
  }
  return data as Profile;
});

export async function requireRole(roles?: UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (roles && !roles.includes(profile.role)) redirect("/dashboard");
  return profile;
}
