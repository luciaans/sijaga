import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { ViolationForm } from "@/components/forms/violation-form";

export default async function NewViolationPage() {
  await requireRole();
  const supabase = await createClient();
  const { data } = await supabase.rpc("report_filter_options");
  const suggestions = ((data ?? {}) as { students?: string[] }).students ?? [];
  return <div className="mx-auto max-w-4xl space-y-5"><Link href="/pelanggaran" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-navy"><ChevronLeft size={17} />Kembali ke data pelanggaran</Link><div><h2 className="text-2xl font-bold text-navy">Catat pelanggaran baru</h2><p className="mt-1 text-sm text-slate-500">Isi data kejadian dengan cermat untuk mendukung pembinaan santri.</p></div><ViolationForm suggestions={suggestions} /></div>;
}
