import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ClipboardList, ShieldCheck, Users, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { requireRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { CategoryChart, MonthlyChart, ReporterChart } from "@/components/charts/dashboard-charts";
import type { Violation } from "@/types/database";

export const metadata: Metadata = { title: "Dashboard" };

type Stats = { total_reports: number; own_reports: number; unique_students: number; active_ustaz: number; categories: Record<string, number>; monthly: { month: string; total: number }[]; by_reporter: { name: string; total: number }[] };
const number = (value: unknown) => Number(value ?? 0).toLocaleString("id-ID");

export default async function DashboardPage() {
  const profile = await requireRole();
  const supabase = await createClient();
  const [{ data: statsData }, { data: reportsData }, { data: logsData }, { data: ownActivityData }] = await Promise.all([
    supabase.rpc("dashboard_stats"),
    supabase.from("pelanggaran").select("id,student_name,student_class,category,incident_date,reporter:profiles!pelanggaran_reporter_id_fkey(full_name)").order("created_at", { ascending: false }).limit(7),
    profile.role === "admin" ? supabase.from("audit_logs").select("id,action,target_type,created_at,user:profiles!audit_logs_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(5) : Promise.resolve({ data: null }),
    profile.role === "ustaz" ? supabase.from("pelanggaran").select("id,student_name,category,created_at").eq("reporter_id", profile.id).order("created_at", { ascending: false }).limit(5) : Promise.resolve({ data: null }),
  ]);
  const stats = (statsData ?? {}) as Partial<Stats>;
  const reports = (reportsData ?? []) as unknown as (Pick<Violation, "id" | "student_name" | "student_class" | "category" | "incident_date"> & { reporter: { full_name: string } | null })[];
  const cards = profile.role === "admin" ? [
    { label: "Total laporan", value: number(stats.total_reports), icon: ClipboardList, tone: "bg-blue-50 text-blue-700" },
    { label: "Santri terdata", value: number(stats.unique_students), icon: Users, tone: "bg-indigo-50 text-indigo-700" },
    { label: "Ustaz aktif", value: number(stats.active_ustaz), icon: ShieldCheck, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Pelanggaran ringan", value: number(stats.categories?.ringan), icon: AlertTriangle, tone: "bg-blue-50 text-blue-700" },
    { label: "Pelanggaran sedang", value: number(stats.categories?.sedang), icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
    { label: "Pelanggaran berat", value: number(stats.categories?.berat), icon: AlertTriangle, tone: "bg-red-50 text-red-700" },
  ] : [
    { label: "Total laporan", value: number(stats.total_reports), icon: ClipboardList, tone: "bg-blue-50 text-blue-700" },
    { label: "Laporan saya", value: number(stats.own_reports), icon: ShieldCheck, tone: "bg-indigo-50 text-indigo-700" },
    { label: "Santri terdata", value: number(stats.unique_students), icon: Users, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Pelanggaran ringan", value: number(stats.categories?.ringan), icon: AlertTriangle, tone: "bg-blue-50 text-blue-700" },
    { label: "Pelanggaran sedang", value: number(stats.categories?.sedang), icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
    { label: "Pelanggaran berat", value: number(stats.categories?.berat), icon: AlertTriangle, tone: "bg-red-50 text-red-700" },
  ];
  return <div className="flex flex-col gap-4 sm:gap-8">
    <section className="order-1 relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-[#123d6a] to-[#1f5b86] px-4 py-5 text-white shadow-lg shadow-navy/10 sm:rounded-3xl sm:px-8 sm:py-9">
      <div aria-hidden="true" className="absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-[36px] border-white/5" />
      <div aria-hidden="true" className="absolute bottom-[-7rem] right-44 -z-10 h-56 w-56 rounded-full bg-sky-300/10 blur-2xl" />
      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-blue-100 sm:text-sm">Assalamu'alaikum, {profile.full_name.split(" ")[0]}</p>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight sm:mt-2 sm:text-4xl">Ringkasan kedisiplinan</h2>
          <p className="mt-2 max-w-xl text-xs leading-5 text-blue-100/90 sm:mt-3 sm:text-sm sm:leading-6">Pantau laporan dan perkembangan kedisiplinan santri dalam satu tempat.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Link href="/santri" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-2.5 text-center text-xs font-semibold text-white transition hover:bg-white/20 sm:min-h-11 sm:px-4 sm:text-sm">Riwayat santri</Link>
          <Link href="/pelanggaran/baru" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-2.5 text-center text-xs font-semibold text-navy shadow-sm transition hover:bg-blue-50 sm:min-h-11 sm:px-4 sm:text-sm">Catat pelanggaran</Link>
        </div>
      </div>
    </section>

    <section aria-label="Statistik laporan" className="order-2 grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, tone }) => <article key={label} className="group rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:shadow-md sm:rounded-2xl sm:p-6">
        <div className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-0.5 sm:grid-cols-[1fr_auto] sm:gap-x-0 sm:gap-y-0"><span className={`row-span-2 flex h-9 w-9 items-center justify-center rounded-lg ${tone} sm:row-span-1 sm:h-11 sm:w-11 sm:rounded-xl`}><Icon size={18} className="sm:hidden" /><Icon size={20} className="hidden sm:block" /></span><ArrowUpRight className="hidden text-slate-300 transition group-hover:text-accent sm:col-start-2 sm:row-start-1 sm:block" size={18} /><div className="min-w-0 sm:col-span-2 sm:row-start-2"><p className="text-[11px] font-medium leading-4 text-slate-500 sm:mt-5 sm:text-sm sm:leading-normal">{label}</p><p className="mt-0.5 text-xl font-bold tracking-tight text-navy sm:mt-1 sm:text-3xl">{value}</p></div></div>
      </article>)}
    </section>

    <section className="order-4 grid gap-4 sm:gap-5 xl:grid-cols-2 lg:order-3">
      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="mb-3"><h3 className="text-base font-bold text-navy">Komposisi kategori</h3><p className="mt-1 text-sm text-slate-500">Sebaran laporan menurut tingkat pelanggaran</p></div><CategoryChart values={stats.categories ?? {}} /></article>
      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="mb-3"><h3 className="text-base font-bold text-navy">Tren laporan bulanan</h3><p className="mt-1 text-sm text-slate-500">Jumlah laporan dalam 12 bulan terakhir</p></div><MonthlyChart values={stats.monthly ?? []} /></article>
      {profile.role === "admin" && <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="mb-3"><h3 className="text-base font-bold text-navy">Laporan per Ustadz/Ustadzah</h3><p className="mt-1 text-sm text-slate-500">Aktivitas pelaporan setiap pengajar</p></div><ReporterChart values={stats.by_reporter ?? []} /></article>}

    </section>

    <section className="order-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:order-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"><div><h3 className="text-base font-bold text-navy">Laporan terbaru</h3><p className="mt-1 text-sm text-slate-500">Aktivitas pelaporan terbaru dari semua ustaz</p></div><Link href="/laporan" className="inline-flex items-center gap-1 text-sm font-semibold text-accent transition hover:text-navy">Lihat semua <ArrowUpRight size={16} /></Link></div>
      {reports.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">Belum ada laporan pelanggaran.</p> : <>
        <ul className="divide-y divide-slate-100 sm:hidden">{reports.slice(0, 4).map((report) => <li key={report.id} className="px-3 py-1.5"><Link href={`/santri/${encodeURIComponent(report.student_name)}`} className="block rounded-lg px-2.5 py-2.5 transition active:bg-slate-50"><div className="flex items-center justify-between gap-2"><p className="min-w-0 truncate text-sm font-semibold text-navy">{report.student_name}<span className="ml-1.5 text-xs font-normal text-slate-500">· {report.student_class}</span></p><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${report.category === "berat" ? "bg-red-50 text-red-700" : report.category === "sedang" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{report.category}</span></div><div className="mt-1 flex justify-between gap-3 text-[11px] leading-4 text-slate-500"><span>{format(parseISO(report.incident_date), "d MMM yyyy", { locale: id })}</span><span className="truncate text-right">{report.reporter?.full_name ?? "-"}</span></div></Link></li>)}</ul>
        <Link href="/laporan" className="flex items-center justify-center gap-1 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-accent transition hover:bg-blue-50 sm:hidden">Lihat semua laporan <ArrowUpRight size={14} /></Link>
        <div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3.5">Santri</th><th className="px-5 py-3.5">Kelas</th><th className="px-5 py-3.5">Kategori</th><th className="px-5 py-3.5">Tanggal</th><th className="px-5 py-3.5">Ustadz/Ustadzah pelapor</th></tr></thead><tbody className="divide-y divide-slate-100">{reports.map((report) => <tr key={report.id} className="transition hover:bg-slate-50/80"><td className="px-5 py-4 font-semibold text-navy"><Link className="hover:underline" href={`/santri/${encodeURIComponent(report.student_name)}`}>{report.student_name}</Link></td><td className="px-5 py-4 text-slate-600">{report.student_class}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${report.category === "berat" ? "bg-red-50 text-red-700" : report.category === "sedang" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{report.category}</span></td><td className="px-5 py-4 text-slate-600">{format(parseISO(report.incident_date), "d MMM yyyy", { locale: id })}</td><td className="px-5 py-4 text-slate-600">{report.reporter?.full_name ?? "-"}</td></tr>)}</tbody></table></div>
      </>}
    </section>

    {profile.role === "ustaz" && <section className="order-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6"><div className="mb-3 flex items-start justify-between gap-2"><div><h3 className="text-base font-bold text-navy">Aktivitas pelaporan saya</h3><p className="mt-1 text-xs text-slate-500 sm:text-sm">Laporan yang baru Anda catat</p></div><Link href="/pelanggaran" className="shrink-0 pt-0.5 text-xs font-semibold text-accent hover:text-navy">Lihat semua</Link></div>{(ownActivityData ?? []).length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Anda belum mencatat laporan.</p> : <ul className="divide-y divide-slate-100">{ownActivityData?.map((item, index) => <li key={item.id} className={`${index > 2 ? "hidden sm:flex" : "flex"} flex-wrap items-center justify-between gap-2 py-3 text-sm sm:py-3.5`}><span className="text-xs text-slate-700 sm:text-sm">Laporan <span className="font-semibold capitalize">{item.category}</span> untuk <Link className="font-semibold text-navy hover:underline" href={`/santri/${encodeURIComponent(item.student_name)}`}>{item.student_name}</Link></span><time className="text-[11px] text-slate-500 sm:text-xs">{format(parseISO(item.created_at), "d MMM yyyy, HH:mm", { locale: id })}</time></li>)}</ul>}</section>}
    {profile.role === "admin" && <section className="order-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="mb-3"><h3 className="text-base font-bold text-navy">Aktivitas admin terbaru</h3><p className="mt-1 text-sm text-slate-500">Perubahan terakhir pada sistem</p></div>{(logsData ?? []).length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Belum ada aktivitas.</p> : <ul className="divide-y divide-slate-100">{logsData?.map((log) => <li key={log.id} className="flex flex-wrap justify-between gap-3 py-3.5 text-sm"><span className="text-slate-700">{log.action} / {log.target_type}</span><time className="shrink-0 text-xs text-slate-500">{format(parseISO(log.created_at), "d MMM, HH:mm", { locale: id })}</time></li>)}</ul>}</section>}
  </div>;
}
