import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { ViolationForm } from "@/components/forms/violation-form";

export const metadata: Metadata = { title: "Catat Pelanggaran" };

export default async function NewViolationPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  const profile = await requireRole();
  const params = await searchParams;
  const requestedStudent = (params.student ?? "").trim().toLocaleLowerCase("id-ID").replace(/\s+/g, " ").slice(0, 120);
  const supabase = await createClient();
  const { data } = await supabase.rpc("search_students", { query_text: requestedStudent });
  const students = (data ?? []) as { student_name: string; student_name_normalized: string; student_class: string; report_count: number }[];
  const initialStudent = students.find((student) => student.student_name_normalized === requestedStudent) ?? null;
  const reporterLabel = profile.role === "admin" ? `${profile.full_name} (Admin)` : `${profile.full_name} (${profile.educator_type === "ustadzah" ? "Ustadzah" : "Ustadz"})`;
  return <div className="mx-auto max-w-4xl space-y-5"><Link href="/pelanggaran" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-navy"><ChevronLeft size={17} />{profile.role === "ustaz" ? "Kembali ke Laporan Saya" : "Kembali ke data pelanggaran"}</Link><div><h2 className="text-2xl font-bold text-navy">Catat pelanggaran baru</h2><p className="mt-1 text-sm text-slate-500">Pilih santri yang sudah terdata atau catat santri baru, lalu tambahkan kejadian pelanggarannya.</p></div><ViolationForm initialStudents={students} initialStudent={initialStudent} reporterLabel={reporterLabel} /></div>;
}
