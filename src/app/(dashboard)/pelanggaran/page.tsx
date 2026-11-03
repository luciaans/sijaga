import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Plus, Search, SlidersHorizontal } from "lucide-react";
import { requireRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { ViolationTable } from "@/components/tables/violation-table";
import { createSignedPhotoUrl } from "@/lib/supabase/photos";
import { USTAZ_CAN_DELETE_OWN_REPORT } from "@/lib/constants";

export const metadata: Metadata = { title: "Daftar Pelanggaran" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

function ViolationFilterFields({ search, category, studentClass, from, to, orderColumn, ascending, classes }: { search: string; category: string; studentClass: string; from: string; to: string; orderColumn: string; ascending: boolean; classes: string[] }) {
  return <>
    <label className="relative sm:col-span-2 xl:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Nama santri</span><Search className="absolute left-3 top-[2.65rem] -translate-y-1/2 text-slate-400" size={17} /><input name="q" defaultValue={search} className="h-11 w-full rounded-xl border border-slate-200 px-3 pl-9 text-sm outline-none focus:border-accent" placeholder="Cari nama santri" /></label>
    <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Kategori pelanggaran</span><select name="category" defaultValue={category} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Semua kategori</option><option value="ringan">Ringan</option><option value="sedang">Sedang</option><option value="berat">Berat</option></select></label>
    <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Kelas</span><select name="class" defaultValue={studentClass} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Semua kelas</option>{classes.map((value) => <option key={value}>{value}</option>)}</select></label>
    <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Dari tanggal</span><input type="date" name="from" defaultValue={from} className="h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm" /></label>
    <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Sampai tanggal</span><input type="date" name="to" defaultValue={to} className="h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm" /></label>
    <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Urutkan berdasarkan</span><select name="sort" defaultValue={orderColumn} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="incident_date">Tanggal kejadian</option><option value="created_at">Waktu dibuat</option><option value="student_name">Nama santri</option><option value="category">Kategori</option></select></label>
    <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Urutan</span><select name="direction" defaultValue={ascending ? "asc" : "desc"} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="desc">Terbaru / Z–A</option><option value="asc">Terlama / A–Z</option></select></label>
    <div className="flex items-end sm:col-span-2 xl:col-span-4 xl:justify-end"><button className="h-11 w-full rounded-xl bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-soft sm:w-auto">Terapkan filter</button></div>
  </>;
}

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
  if (profile.role === "ustaz") query = query.eq("reporter_id", profile.id);
  if (search) query = query.ilike("student_name", `%${search}%`);
  if (["ringan", "sedang", "berat"].includes(category)) query = query.eq("category", category);
  if (studentClass) query = query.eq("student_class", studentClass);
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) query = query.gte("incident_date", from);
  if (/^\d{4}-\d{2}-\d{2}$/.test(to)) query = query.lte("incident_date", to);
  const { data, count, error } = await query.order(orderColumn, { ascending }).range((page - 1) * 20, page * 20 - 1);
  const { data: filterData } = await supabase.rpc("report_filter_options");
  const studentKeys = [...new Set((data ?? []).map((row) => row.student_name_normalized))];
  const countResult = studentKeys.length ? await supabase.rpc("student_violation_counts", { student_keys: studentKeys }) : { data: {}, error: null };
  if (countResult.error) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">Jumlah pelanggaran per santri belum dapat dimuat. Jalankan migrasi <code>005_student_entry_flow.sql</code> di Supabase.</div>;
  const studentCounts = (countResult.data ?? {}) as Record<string, number>;
  const options = (filterData ?? {}) as { classes?: string[] };
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / 20));
  const activeFilterCount = [search, category, studentClass, from, to].filter(Boolean).length;
  const queryString = new URLSearchParams(Object.entries(params).filter(([key, value]) => key !== "page" && typeof value === "string" && value).map(([key, value]) => [key, String(value)])).toString();
  const rows = await Promise.all((data ?? []).map(async (row) => ({ ...row, student_report_count: Number(studentCounts[row.student_name_normalized] ?? 1), photo_url: await createSignedPhotoUrl(row.student_photo_url) })));
  return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold text-navy">{profile.role === "ustaz" ? "Laporan Saya" : "Data Pelanggaran Santri"}</h2><p className="mt-1 text-sm text-slate-500">{profile.role === "ustaz" ? "Daftar pelanggaran yang dicatat oleh akun Anda." : "Seluruh laporan kedisiplinan yang tercatat."}</p></div><Link href="/pelanggaran/baru" className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-soft"><Plus size={17} />Catat pelanggaran</Link></div>
        <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm sm:hidden">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden"><span className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-navy"><SlidersHorizontal size={17} /></span><span className="min-w-0"><span className="block text-sm font-semibold text-navy">Filter laporan</span><span className="block truncate text-xs text-slate-500">{activeFilterCount ? `${activeFilterCount} filter aktif` : "Cari nama, kategori, kelas, atau tanggal"}</span></span></span><ChevronDown className="shrink-0 text-slate-400 transition group-open:rotate-180" size={18} /></summary>
          <form className="grid gap-4 border-t border-slate-100 p-4"><ViolationFilterFields search={search} category={category} studentClass={studentClass} from={from} to={to} orderColumn={orderColumn} ascending={ascending} classes={options.classes ?? []} /></form>
        </details>
        <form className="hidden gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid sm:grid-cols-2 xl:grid-cols-4">
      <label className="relative sm:col-span-2 xl:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Nama santri</span><Search className="absolute left-3 top-[2.65rem] -translate-y-1/2 text-slate-400" size={17} /><input name="q" defaultValue={search} className="h-11 w-full rounded-xl border border-slate-200 px-3 pl-9 text-sm outline-none focus:border-accent" placeholder="Cari nama santri" /></label>
      <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Kategori pelanggaran</span><select name="category" defaultValue={category} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Semua kategori</option><option value="ringan">Ringan</option><option value="sedang">Sedang</option><option value="berat">Berat</option></select></label>
      <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Kelas</span><select name="class" defaultValue={studentClass} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Semua kelas</option>{(options.classes ?? []).map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Dari tanggal</span><input type="date" name="from" defaultValue={from} className="h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm" /></label>
      <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Sampai tanggal</span><input type="date" name="to" defaultValue={to} className="h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm" /></label>
      <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Urutkan berdasarkan</span><select name="sort" defaultValue={orderColumn} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="incident_date">Tanggal kejadian</option><option value="created_at">Waktu dibuat</option><option value="student_name">Nama santri</option><option value="category">Kategori</option></select></label>
      <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Urutan</span><select name="direction" defaultValue={ascending ? "asc" : "desc"} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="desc">Terbaru / Z–A</option><option value="asc">Terlama / A–Z</option></select></label>
      <div className="flex items-end sm:col-span-2 xl:col-span-4 xl:justify-end"><button className="h-11 w-full rounded-xl bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-soft sm:w-auto">Terapkan filter</button></div>
    </form>
    {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Data laporan gagal dimuat. Pastikan migrasi basis data sudah dijalankan.</div> : <><div className="text-xs text-slate-500">Menampilkan {(count ?? 0).toLocaleString("id-ID")} laporan · maksimum 20 per halaman</div><ViolationTable rows={rows as never} profileId={profile.id} isAdmin={profile.role === "admin"} canUstazDeleteOwn={USTAZ_CAN_DELETE_OWN_REPORT} page={page} pageCount={pageCount} queryString={queryString} /></>}
  </div>;
}
