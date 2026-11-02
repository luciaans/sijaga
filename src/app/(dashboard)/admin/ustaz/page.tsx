import { requireRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { UstazManager } from "@/components/forms/ustaz-manager";

export default async function UstazPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ustaz_report_counts");
  if (error) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">Data akun ustaz gagal dimuat. Pastikan migrasi basis data sudah dijalankan.</div>;
  return <div className="space-y-6"><div><h2 className="text-2xl font-bold text-navy">Manajemen akun ustaz</h2><p className="mt-1 text-sm text-slate-500">Kelola akses dan data akun pelapor di lingkungan pesantren.</p></div><UstazManager initialRows={(data ?? []) as { profile_id: string; full_name: string; username: string; is_active: boolean; created_at: string; report_count: number }[]} /></div>;
}
