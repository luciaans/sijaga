import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Laporan Saya" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type ReportRow = {
  id: string;
  student_name: string;
  student_class: string;
  category: string;
  description: string;
  incident_date: string;
  reporter: { full_name: string } | null;
};
type ReporterOption = { id: string; full_name: string };

const categoryStyle = (category: string) => category === "berat"
  ? "bg-red-50 text-red-700"
  : category === "sedang"
    ? "bg-amber-50 text-amber-700"
    : "bg-blue-50 text-blue-700";

function ReportFilterFields({ search, reporterId, category, studentClass, from, to, classes, reporters }: { search: string; reporterId: string; category: string; studentClass: string; from: string; to: string; classes: string[]; reporters: ReporterOption[] }) {
  return <>
    <label className="relative sm:col-span-2 xl:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Nama santri</span><Search className="absolute left-3 top-[2.65rem] -translate-y-1/2 text-slate-400" size={17} /><input name="q" defaultValue={search} className="h-11 w-full rounded-xl border border-slate-200 px-3 pl-9 text-sm outline-none focus:border-accent" placeholder="Cari nama santri" /></label>
    <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Akun pelapor</span><select name="reporter" defaultValue={reporterId} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Semua akun</option>{reporters.map((reporter) => <option key={reporter.id} value={reporter.id}>{reporter.full_name}</option>)}</select></label>
    <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Kategori</span><select name="category" defaultValue={category} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Semua kategori</option><option value="ringan">Ringan</option><option value="sedang">Sedang</option><option value="berat">Berat</option></select></label>
    <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Kelas</span><select name="class" defaultValue={studentClass} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Semua kelas</option>{classes.map((value) => <option key={value}>{value}</option>)}</select></label>
    <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Dari tanggal</span><input type="date" name="from" defaultValue={from} className="h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm" /></label>
    <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Sampai tanggal</span><input type="date" name="to" defaultValue={to} className="h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm" /></label>
    <div className="flex items-end sm:col-span-2 xl:col-span-4 xl:justify-end"><button className="h-11 w-full rounded-xl bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-soft sm:w-auto">Terapkan filter</button></div>
  </>;
}

export default async function AllReportsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole();
  const params = await searchParams;
  const value = (key: string) => Array.isArray(params[key]) ? params[key]?.[0] ?? "" : params[key] ?? "";
  const rawPage = value("page");
  const page = Math.max(1, Math.floor(Number(rawPage) || 1));
  const search = value("q").trim().slice(0, 100);
  const reporterId = value("reporter");
  const category = ["ringan", "sedang", "berat"].includes(value("category")) ? value("category") : "";
  const studentClass = value("class");
  const from = /^\d{4}-\d{2}-\d{2}$/.test(value("from")) ? value("from") : "";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(value("to")) ? value("to") : "";
  const supabase = await createClient();
  let query = supabase
    .from("pelanggaran")
    .select("id,student_name,student_class,category,description,incident_date,reporter:profiles!pelanggaran_reporter_id_fkey(full_name)", { count: "exact" });
  if (search) query = query.ilike("student_name", `%${search}%`);
  if (reporterId) query = query.eq("reporter_id", reporterId);
  if (category) query = query.eq("category", category);
  if (studentClass) query = query.eq("student_class", studentClass);
  if (from) query = query.gte("incident_date", from);
  if (to) query = query.lte("incident_date", to);
  const [{ data, count, error }, { data: classData }, { data: reporterData }] = await Promise.all([
    query.order("incident_date", { ascending: false }).order("created_at", { ascending: false }).range((page - 1) * 20, page * 20 - 1),
    supabase.from("pelanggaran").select("student_class").order("student_class"),
    supabase.from("profiles").select("id,full_name").is("deleted_at", null).order("full_name"),
  ]);
  const reports = (data ?? []) as unknown as ReportRow[];
  const classes = [...new Set((classData ?? []).map((row) => row.student_class))].filter(Boolean);
  const reporters = (reporterData ?? []) as ReporterOption[];
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / 20));
  const activeFilterCount = [search, reporterId, category, studentClass, from, to].filter(Boolean).length;
  const filterParams = new URLSearchParams();
  if (search) filterParams.set("q", search);
  if (reporterId) filterParams.set("reporter", reporterId);
  if (category) filterParams.set("category", category);
  if (studentClass) filterParams.set("class", studentClass);
  if (from) filterParams.set("from", from);
  if (to) filterParams.set("to", to);
  const filterQuery = filterParams.toString();
  const pageHref = (target: number) => `/laporan?${filterQuery ? `${filterQuery}&` : ""}page=${target}`;

  return <div className="space-y-5">
    <header>
      <h2 className="text-xl font-bold text-navy sm:text-2xl">Seluruh Laporan</h2><p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">Lihat laporan kedisiplinan yang dicatat oleh semua Ustadz/Ustadzah. Halaman ini hanya untuk melihat data.</p>
    </header>

    <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm sm:hidden">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden"><span className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-navy"><SlidersHorizontal size={17} /></span><span className="min-w-0"><span className="block text-sm font-semibold text-navy">Filter laporan</span><span className="block truncate text-xs text-slate-500">{activeFilterCount ? `${activeFilterCount} filter aktif` : "Nama, pelapor, kategori, kelas, atau tanggal"}</span></span></span><ChevronDown className="shrink-0 text-slate-400 transition group-open:rotate-180" size={18} /></summary>
      <form className="grid gap-4 border-t border-slate-100 p-4"><ReportFilterFields search={search} reporterId={reporterId} category={category} studentClass={studentClass} from={from} to={to} classes={classes} reporters={reporters} /></form>
    </details>
    <form className="hidden gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid sm:grid-cols-2 xl:grid-cols-4"><ReportFilterFields search={search} reporterId={reporterId} category={category} studentClass={studentClass} from={from} to={to} classes={classes} reporters={reporters} /></form>

    {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Data laporan gagal dimuat.</div> : reports.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">{activeFilterCount ? "Tidak ada laporan yang sesuai dengan filter." : "Belum ada laporan pelanggaran."}</div> : <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-5">Menampilkan {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} dari {total.toLocaleString("id-ID")} laporan</div>
      <ul className="divide-y divide-slate-100 sm:hidden">{reports.map((report) => <li key={report.id} className="p-3"><article className="rounded-xl border border-slate-200/80 p-3.5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-navy">{report.student_name}</p><p className="mt-1 text-xs text-slate-500">Kelas {report.student_class}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${categoryStyle(report.category)}`}>{report.category}</span></div><p className="mt-3 text-sm leading-5 text-slate-700">{report.description}</p><div className="mt-3 flex flex-wrap justify-between gap-x-3 gap-y-1 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500"><time>{new Date(`${report.incident_date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</time><span className="truncate">Pelapor: {report.reporter?.full_name ?? "-"}</span></div></article></li>)}</ul>
      <div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3.5">No.</th><th className="px-5 py-3.5">Nama santri</th><th className="px-5 py-3.5">Kelas</th><th className="px-5 py-3.5">Pelanggaran</th><th className="px-5 py-3.5">Kategori</th><th className="px-5 py-3.5">Tanggal</th><th className="px-5 py-3.5">Ustadz/Ustadzah pelapor</th></tr></thead><tbody className="divide-y divide-slate-100">{reports.map((report, index) => <tr key={report.id} className="hover:bg-slate-50/80"><td className="px-5 py-4 text-slate-500">{(page - 1) * 20 + index + 1}</td><td className="px-5 py-4 font-semibold text-navy">{report.student_name}</td><td className="px-5 py-4 text-slate-600">{report.student_class}</td><td className="max-w-64 px-5 py-4 text-slate-600">{report.description}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${categoryStyle(report.category)}`}>{report.category}</span></td><td className="px-5 py-4 text-slate-600">{new Date(`${report.incident_date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td><td className="px-5 py-4 text-slate-600">{report.reporter?.full_name ?? "-"}</td></tr>)}</tbody></table></div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3.5 sm:px-5"><p className="text-xs text-slate-500">Halaman {page} dari {pageCount}</p><nav aria-label="Navigasi halaman laporan" className="flex gap-2"><Link aria-disabled={page <= 1} className={`inline-flex min-h-9 items-center gap-1 rounded-lg border px-3 text-xs font-semibold ${page <= 1 ? "pointer-events-none border-slate-100 text-slate-300" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`} href={pageHref(Math.max(1, page - 1))}><ChevronLeft size={14} />Sebelumnya</Link><Link aria-disabled={page >= pageCount} className={`inline-flex min-h-9 items-center gap-1 rounded-lg border px-3 text-xs font-semibold ${page >= pageCount ? "pointer-events-none border-slate-100 text-slate-300" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`} href={pageHref(Math.min(pageCount, page + 1))}>Berikutnya<ChevronRight size={14} /></Link></nav></footer>
    </section>}
  </div>;
}
