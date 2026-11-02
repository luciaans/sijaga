import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { ViolationTable } from "@/components/tables/violation-table";
import { createSignedPhotoUrl } from "@/lib/supabase/photos";
import { USTAZ_CAN_DELETE_OWN_REPORT } from "@/lib/constants";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
export default async function ViolationsPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole();
  const params = await searchParams;
  const page = Math.max(1, Math.floor(Number(one(params.page)) || 1));
  const search = (one(params.q) ?? "").trim().slice(0, 100);
  const category = one(params.category) ?? "";
  const studentClass = one(params.class) ?? "";
  const from = one(params.from) ?? "";
  const to = one(params.to) ?? "";
  const sortKey = one(params.sort) ?? "incident_date";
  const ascending = one(params.direction) === "asc";
  const orderColumn = ["incident_date", "created_at", "student_name", "category"].includes(sortKey) ? sortKey : "incident_date";
  const supabase = await createClient();
  let query = supabase.from("pelanggaran").select("*,reporter:profiles!pelanggaran_reporter_id_fkey(full_name)", { count: "exact" });
  if (search) query = query.ilike("student_name", `%${search}%`);
  if (["ringan", "sedang", "berat"].includes(category)) query = query.eq("category", category);
  if (studentClass) query = query.eq("student_class", studentClass);
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) query = query.gte("incident_date", from);
  if (/^\d{4}-\d{2}-\d{2}$/.test(to)) query = query.lte("incident_date", to);
  const { data, count, error } = await query.order(orderColumn, { ascending }).range((page - 1) * 20, page * 20 - 1);
  const { data: filterData } = await supabase.rpc("report_filter_options");
  const options = (filterData ?? {}) as { classes?: string[] };
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / 20));
  const queryString = new URLSearchParams(Object.entries(params).filter(([key, value]) => key !== "page" && typeof value === "string" && value).map(([key, value]) => [key, String(value)])).toString();
  const rows = await Promise.all((data ?? []).map(async (row) => ({ ...row, photo_url: await createSignedPhotoUrl(row.student_photo_url) })));
  return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold text-navy">Data Pelanggaran Santri</h2><p className="mt-1 text-sm text-slate-500">Seluruh laporan kedisiplinan yang tercatat.</p></div><Link href="/pelanggaran/baru" className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-soft"><Plus size={17} />Catat pelanggaran</Link></div>
    <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9"><label className="relative sm:col-span-2 xl:col-span-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input name="q" defaultValue={search} className="h-full min-h-11 w-full rounded-xl border border-slate-200 px-3 pl-9 text-sm outline-none focus:border-accent" placeholder="Cari nama santri" /></label><select name="category" defaultValue={category} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="">Semua kategori</option><option value="ringan">Ringan</option><option value="sedang">Sedang</option><option value="berat">Berat</option></select><select name="class" defaultValue={studentClass} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="">Semua kelas</option>{(options.classes ?? []).map((value) => <option key={value}>{value}</option>)}</select><input type="date" name="from" defaultValue={from} aria-label="Tanggal mulai" className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /><input type="date" name="to" defaultValue={to} aria-label="Tanggal akhir" className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /><select name="sort" defaultValue={orderColumn} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="incident_date">Urut tanggal</option><option value="created_at">Waktu dibuat</option><option value="student_name">Nama santri</option><option value="category">Kategori</option></select><select name="direction" defaultValue={ascending ? "asc" : "desc"} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="desc">Terbaru</option><option value="asc">Terlama / A–Z</option></select><button className="rounded-xl bg-accent-light px-4 py-2.5 text-sm font-semibold text-navy hover:bg-blue-100 sm:col-span-2 lg:col-span-4 xl:col-span-1">Terapkan filter</button></form>
    {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Data laporan gagal dimuat. Pastikan migrasi basis data sudah dijalankan.</div> : <><div className="text-xs text-slate-500">Menampilkan {(count ?? 0).toLocaleString("id-ID")} laporan · maksimum 20 per halaman</div><ViolationTable rows={rows as never} profileId={profile.id} isAdmin={profile.role === "admin"} canUstazDeleteOwn={USTAZ_CAN_DELETE_OWN_REPORT} page={page} pageCount={pageCount} queryString={queryString} /></>}
  </div>;
}
