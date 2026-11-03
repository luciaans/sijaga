import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Search } from "lucide-react";
import { requireRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ q?: string }>;
type StudentSearchResult = { student_name: string; student_class: string; report_count: number };

export const metadata: Metadata = { title: "Daftar Santri" };

export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole();
  const { q: rawQuery } = await searchParams;
  const query = (rawQuery ?? "").trim().slice(0, 100);
  const supabase = await createClient();

  let students: StudentSearchResult[] = [];
  let loadError = false;

  if (query) {
    const { data, error } = await supabase.rpc("search_students", { query_text: query });
    loadError = Boolean(error);
    students = (data ?? []) as StudentSearchResult[];
  } else {
    const { data, error } = await supabase.rpc("report_filter_options");
    loadError = Boolean(error);
    const options = (data ?? {}) as { students?: string[] };
    students = (options.students ?? []).map((student_name) => ({ student_name, student_class: "", report_count: 0 }));
  }

  return <div className="space-y-5">
    <div>
      <h2 className="text-2xl font-bold text-navy">Daftar Santri</h2>
      <p className="mt-1 text-sm text-slate-500">{profile.role === "admin" ? "Pilih santri untuk melihat riwayat pelanggarannya." : "Daftar ini hanya menampilkan santri yang pernah Anda catat."}</p>
    </div>

    <form className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-nowrap sm:p-4">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Cari santri</span>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input name="q" defaultValue={query} maxLength={100} placeholder="Cari nama santri" className="h-11 w-full rounded-xl border border-slate-200 px-3 pl-9 text-sm outline-none focus:border-accent" />
      </label>
      <button className="min-h-11 shrink-0 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-soft sm:px-5"><span className="sm:hidden">Cari</span><span className="hidden sm:inline">Cari santri</span></button>
      {query && <Link href="/santri" className="min-h-10 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-center text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto sm:text-sm">Hapus pencarian</Link>}
    </form>

    {loadError ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Daftar santri gagal dimuat. Pastikan migrasi basis data sudah dijalankan.</div> : <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-3 py-3 sm:px-5 sm:py-4"><p className="text-sm font-semibold text-navy">{query ? `Hasil pencarian: ${query}` : "Semua santri"}</p><p className="mt-1 text-xs text-slate-500">{query ? `${students.length} hasil` : `${students.length.toLocaleString("id-ID")} santri terdata`}{query && students.length === 20 ? "Persempit pencarian untuk melihat hasil lainnya." : ""}</p></div>
      {students.length === 0 ? <div className="p-8 text-center sm:p-10"><GraduationCap className="mx-auto text-slate-300" size={32} /><p className="mt-3 text-sm text-slate-500">{query ? "Santri tidak ditemukan." : "Belum ada santri yang memiliki laporan."}</p></div> : <ul className="space-y-2 p-2 sm:space-y-0 sm:divide-y sm:divide-slate-100 sm:p-0">{students.map((student) => <li key={student.student_name}>
        <Link href={`/santri/${encodeURIComponent(student.student_name)}`} className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-3 transition hover:border-blue-100 hover:bg-blue-50/40 sm:min-h-0 sm:rounded-none sm:border-0 sm:px-5 sm:py-4 sm:hover:bg-slate-50">
          <span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-light text-navy"><GraduationCap size={19} /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{student.student_name}</span>{student.student_class && <span className="mt-0.5 block text-xs text-slate-500">Kelas {student.student_class}</span>}</span></span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-accent"><span className="sm:hidden">Riwayat</span><span className="hidden sm:inline">Lihat riwayat</span><ArrowRight size={15} /></span>
        </Link>
      </li>)}</ul>}
    </section>}
  </div>;
}
