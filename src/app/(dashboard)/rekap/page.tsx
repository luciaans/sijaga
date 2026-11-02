import { ChevronDown, FileText, SlidersHorizontal } from "lucide-react";
import { requireRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { RecapActions } from "@/components/forms/recap-actions";
import type { Violation } from "@/types/database";

type Params = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
type Row = Pick<Violation, "id" | "student_name" | "student_class" | "category" | "description" | "incident_date"> & { reporter: { full_name: string } | null };
type FilterFieldsProps = { students: string[]; classes: string[]; studentName: string; studentClass: string; category: string; from: string; to: string };
function RecapFilterFields({ students, classes, studentName, studentClass, category, from, to }: FilterFieldsProps) {
  return <>
    <label className="xl:col-span-2"><span className="sr-only">Pilih santri</span><select name="student" defaultValue={studentName} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-accent"><option value="">Semua santri</option>{students.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
    <select name="class" defaultValue={studentClass} aria-label="Kelas" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Semua kelas</option>{classes.map((value) => <option key={value}>{value}</option>)}</select>
    <select name="category" defaultValue={category} aria-label="Kategori pelanggaran" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Semua kategori</option><option value="ringan">Ringan</option><option value="sedang">Sedang</option><option value="berat">Berat</option></select>
    <label><span className="mb-1 block text-xs font-medium text-slate-500">Dari tanggal</span><input type="date" name="from" defaultValue={from} aria-label="Tanggal mulai" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
    <label><span className="mb-1 block text-xs font-medium text-slate-500">Sampai tanggal</span><input type="date" name="to" defaultValue={to} aria-label="Tanggal akhir" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
  </>;
}
export default async function RecapPage({ searchParams }: { searchParams: Params }) {
  const profile = await requireRole();
  const params = await searchParams;
  const studentName = (one(params.student) ?? "").trim().slice(0, 120);
  const studentClass = (one(params.class) ?? "").trim().slice(0, 40);
  const category = one(params.category) ?? "";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(one(params.from) ?? "") ? one(params.from)! : "";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(one(params.to) ?? "") ? one(params.to)! : "";
  const normalized = studentName.toLocaleLowerCase("id-ID").replace(/\s+/g, " ");
  const supabase = await createClient();
  const { data: optionsData } = await supabase.rpc("report_filter_options");
  const options = (optionsData ?? {}) as { students?: string[]; classes?: string[] };
  let query = supabase.from("pelanggaran").select("id,student_name,student_class,category,description,incident_date,reporter:profiles!pelanggaran_reporter_id_fkey(full_name)").order("incident_date", { ascending: true }).order("created_at", { ascending: true });
  if (profile.role === "ustaz") query = query.eq("reporter_id", profile.id);
  if (studentName) query = query.eq("student_name_normalized", normalized);
  if (studentClass) query = query.eq("student_class", studentClass);
  if (["ringan", "sedang", "berat"].includes(category)) query = query.eq("category", category);
  if (from) query = query.gte("incident_date", from);
  if (to) query = query.lte("incident_date", to);
  let reports: Row[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await query.range(offset, offset + 999);
    if (error || !data?.length) break;
    reports = reports.concat(data as unknown as Row[]);
    if (data.length < 1000) break;
  }
  const filters = { studentName, studentClass, category: ["ringan", "sedang", "berat"].includes(category) ? category : "", from, to };
  const hasFilters = Object.values(filters).some(Boolean);
  const filterFieldProps = { students: options.students ?? [], classes: options.classes ?? [], studentName, studentClass, category, from, to };
  const totals = reports.reduce((sum, row) => { sum[row.category] += 1; return sum; }, { ringan: 0, sedang: 0, berat: 0 });
  const fmt = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold text-navy">Rekapitulasi pelanggaran</h2><p className="mt-1 text-sm text-slate-500">{profile.role === "admin" ? "Atur cakupan data seluruh pelapor lalu cetak atau unduh laporan PDF." : "Rekap hanya menampilkan laporan yang Anda catat."}</p></div><div className="hidden sm:block"><RecapActions key={`${studentName}|${studentClass}|${category}|${from}|${to}|${reports.length}`} rows={reports} filters={filters} printedBy={profile.full_name} /></div></div>
    <details open={hasFilters} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:hidden">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-light text-navy"><SlidersHorizontal size={17} /></span>
        <span className="min-w-0"><span className="block text-sm font-semibold text-navy">Filter rekap</span><span className="block truncate text-xs text-slate-500">Santri, kelas, kategori, dan tanggal</span></span>
        {hasFilters && <span className="ml-auto rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">Aktif</span>}
        <ChevronDown size={16} className="shrink-0 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <form className="grid gap-2.5 border-t border-slate-100 p-3">
        <RecapFilterFields {...filterFieldProps} />
        <button className="mt-1 min-h-11 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-soft">Terapkan filter</button>
      </form>
    </details>
    <form className="hidden gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <RecapFilterFields {...filterFieldProps} />
      <button className="rounded-xl bg-accent-light px-4 py-2.5 text-sm font-semibold text-navy hover:bg-blue-100 sm:col-span-2 lg:col-span-3 xl:col-span-6">Terapkan filter</button>
    </form>
    <section className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {[{ label: "Total pelanggaran", value: reports.length, tone: "text-navy" }, { label: "Ringan", value: totals.ringan, tone: "text-blue-700" }, { label: "Sedang", value: totals.sedang, tone: "text-amber-700" }, { label: "Berat", value: totals.berat, tone: "text-red-700" }].map((item) => <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4"><p className="text-[11px] leading-4 text-slate-500 sm:text-xs">{item.label}</p><p className={`mt-1 text-xl font-bold ${item.tone} sm:text-2xl`}>{item.value.toLocaleString("id-ID")}</p></article>)}
    </section>
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:hidden"><RecapActions key={`${studentName}|${studentClass}|${category}|${from}|${to}|${reports.length}`} rows={reports} filters={filters} printedBy={profile.full_name} /></div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 p-3 sm:p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-light text-navy"><FileText size={20} /></span><div><h3 className="font-bold text-navy">Pratinjau data</h3><p className="text-xs text-slate-500">{reports.length.toLocaleString("id-ID")} baris akan disertakan ke PDF</p></div></div>{reports.length === 0 ? <p className="p-6 text-center text-sm text-slate-500 sm:p-10">Tidak ada data yang sesuai dengan filter ini.</p> : <><ul className="divide-y divide-slate-100 sm:hidden">{reports.slice(0, 10).map((row, index) => <li key={row.id} className="px-3 py-2"><article className="space-y-1.5 rounded-xl border border-slate-100 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-navy">{row.student_name}</p><p className="mt-0.5 text-xs text-slate-500">Kelas {row.student_class} / {fmt(row.incident_date)}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold capitalize ${row.category === "berat" ? "bg-red-50 text-red-700" : row.category === "sedang" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{row.category}</span></div><p className="line-clamp-2 break-words text-sm leading-5 text-slate-700">{row.description}</p><div className="flex items-center justify-between gap-2 text-xs text-slate-500"><span className="truncate">Pelapor: {row.reporter?.full_name ?? "-"}</span><span className="shrink-0 text-slate-400">#{index + 1}</span></div></article></li>)}</ul><div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">No.</th><th className="px-5 py-3">Tanggal</th><th className="px-5 py-3">Nama santri</th><th className="px-5 py-3">Kelas</th><th className="px-5 py-3">Pelanggaran</th><th className="px-5 py-3">Kategori</th><th className="px-5 py-3">Ustaz</th></tr></thead><tbody className="divide-y divide-slate-100">{reports.slice(0, 10).map((row, index) => <tr key={row.id}><td className="px-5 py-3 text-slate-500">{index + 1}</td><td className="px-5 py-3 text-slate-600">{fmt(row.incident_date)}</td><td className="px-5 py-3 font-semibold text-navy">{row.student_name}</td><td className="px-5 py-3 text-slate-600">{row.student_class}</td><td className="max-w-64 truncate px-5 py-3 text-slate-600">{row.description}</td><td className="px-5 py-3 capitalize text-slate-600">{row.category}</td><td className="px-5 py-3 text-slate-600">{row.reporter?.full_name ?? "-"}</td></tr>)}</tbody></table>{reports.length > 10 && <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Menampilkan 10 baris pertama. PDF memuat semua {reports.length.toLocaleString("id-ID")} baris.</p>}</div></>}</section>
  </div>;
}
