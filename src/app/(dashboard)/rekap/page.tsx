import { FileText, Search } from "lucide-react";
import { requireRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { RecapActions } from "@/components/forms/recap-actions";
import type { Violation } from "@/types/database";

type Params = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
type Row = Pick<Violation, "id" | "student_name" | "student_class" | "category" | "description" | "incident_date"> & { reporter: { full_name: string } | null };
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
  const totals = reports.reduce((sum, row) => { sum[row.category] += 1; return sum; }, { ringan: 0, sedang: 0, berat: 0 });
  const fmt = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold text-navy">Rekapitulasi pelanggaran</h2><p className="mt-1 text-sm text-slate-500">Atur cakupan data lalu cetak atau unduh laporan PDF.</p></div><RecapActions rows={reports} filters={filters} printedBy={profile.full_name} /></div>
    <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"><label className="relative xl:col-span-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input name="student" list="recap-students" defaultValue={studentName} placeholder="Semua santri / nama santri" className="h-11 w-full rounded-xl border border-slate-200 px-3 pl-9 text-sm outline-none focus:border-accent" /><datalist id="recap-students">{(options.students ?? []).map((name) => <option key={name} value={name} />)}</datalist></label><select name="class" defaultValue={studentClass} className="h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="">Semua kelas</option>{(options.classes ?? []).map((value) => <option key={value}>{value}</option>)}</select><select name="category" defaultValue={category} className="h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="">Semua kategori</option><option value="ringan">Ringan</option><option value="sedang">Sedang</option><option value="berat">Berat</option></select><input type="date" name="from" defaultValue={from} aria-label="Tanggal mulai" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /><input type="date" name="to" defaultValue={to} aria-label="Tanggal akhir" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /><button className="rounded-xl bg-accent-light px-4 py-2.5 text-sm font-semibold text-navy hover:bg-blue-100 sm:col-span-2 lg:col-span-3 xl:col-span-6">Terapkan filter</button></form>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{ label: "Total pelanggaran", value: reports.length, tone: "text-navy" }, { label: "Ringan", value: totals.ringan, tone: "text-blue-700" }, { label: "Sedang", value: totals.sedang, tone: "text-amber-700" }, { label: "Berat", value: totals.berat, tone: "text-red-700" }].map((item) => <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{item.label}</p><p className={`mt-1 text-2xl font-bold ${item.tone}`}>{item.value.toLocaleString("id-ID")}</p></article>)}</section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-light text-navy"><FileText size={20} /></span><div><h3 className="font-bold text-navy">Pratinjau data</h3><p className="text-xs text-slate-500">{reports.length.toLocaleString("id-ID")} baris akan disertakan ke PDF</p></div></div>{reports.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">Tidak ada data yang sesuai dengan filter ini.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">No.</th><th className="px-5 py-3">Tanggal</th><th className="px-5 py-3">Nama santri</th><th className="px-5 py-3">Kelas</th><th className="px-5 py-3">Pelanggaran</th><th className="px-5 py-3">Kategori</th><th className="px-5 py-3">Ustaz</th></tr></thead><tbody className="divide-y divide-slate-100">{reports.slice(0, 10).map((row, index) => <tr key={row.id}><td className="px-5 py-3 text-slate-500">{index + 1}</td><td className="px-5 py-3 text-slate-600">{fmt(row.incident_date)}</td><td className="px-5 py-3 font-semibold text-navy">{row.student_name}</td><td className="px-5 py-3 text-slate-600">{row.student_class}</td><td className="max-w-64 truncate px-5 py-3 text-slate-600">{row.description}</td><td className="px-5 py-3 capitalize text-slate-600">{row.category}</td><td className="px-5 py-3 text-slate-600">{row.reporter?.full_name ?? "—"}</td></tr>)}</tbody></table>{reports.length > 10 && <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Menampilkan 10 baris pertama. PDF memuat semua {reports.length.toLocaleString("id-ID")} baris.</p>}</div>}</section>
  </div>;
}
