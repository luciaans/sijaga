import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, GraduationCap, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { createSignedPhotoUrl } from "@/lib/supabase/photos";
import type { Violation } from "@/types/database";

type Params = Promise<{ nama: string }>;
type Search = Promise<{ page?: string }>;
type HistoryRow = Violation & { reporter: { full_name: string } | null; photo_url: string | null };
export const metadata: Metadata = { title: "Riwayat Santri" };
export default async function StudentHistoryPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const profile = await requireRole();
  const [{ nama }, search] = await Promise.all([params, searchParams]);
  let studentName = nama;
  try { studentName = decodeURIComponent(nama); } catch { /* Gunakan parameter asli jika encoding URL tidak valid. */ }
  const normalized = studentName.trim().toLocaleLowerCase("id-ID").replace(/\s+/g, " ");
  const page = Math.max(1, Math.floor(Number(search.page) || 1));
  const supabase = await createClient();
  const [{ data: summaryData }, initialResult] = await Promise.all([
    supabase.rpc("student_history_summary", { student_key: normalized }),
    supabase.from("pelanggaran").select("*,reporter:profiles!pelanggaran_reporter_id_fkey(full_name)", { count: "exact" }).eq("student_name_normalized", normalized).order("incident_date", { ascending: false }).order("created_at", { ascending: false }).range((page - 1) * 30, page * 30 - 1),
  ]);
  let result = initialResult;
  let resolvedSummary = summaryData;
  // Resolve the canonical stored key by the visible name if normalization differs
  // between the URL and the database (for example, legacy rows with extra spaces).
  if (!result.error && !result.data?.length) {
    const { data: matchingStudent } = await supabase.from("pelanggaran").select("student_name_normalized").ilike("student_name", studentName).limit(1).maybeSingle();
    if (matchingStudent?.student_name_normalized) {
      const canonicalKey = matchingStudent.student_name_normalized;
      const [{ data: canonicalSummary }, canonicalResult] = await Promise.all([
        supabase.rpc("student_history_summary", { student_key: canonicalKey }),
        supabase.from("pelanggaran").select("*,reporter:profiles!pelanggaran_reporter_id_fkey(full_name)", { count: "exact" }).eq("student_name_normalized", canonicalKey).order("incident_date", { ascending: false }).order("created_at", { ascending: false }).range((page - 1) * 30, page * 30 - 1),
      ]);
      if (canonicalResult.data?.length) {
        result = canonicalResult;
        resolvedSummary = canonicalSummary;
      }
    }
  }
  if (result.error) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Riwayat santri gagal dimuat. Coba buka kembali dari Daftar Santri.</div>;
  if (!result.data?.length) notFound();
  const rows = await Promise.all((result.data ?? []).map(async (row) => ({ ...row, photo_url: await createSignedPhotoUrl(row.student_photo_url) }))) as HistoryRow[];
  const canAddReport = profile.role === "admin" || rows.some((row) => row.reporter_id === profile.id);
  const summary = (resolvedSummary ?? {}) as { total?: number; ringan?: number; sedang?: number; berat?: number };
  const pageCount = Math.max(1, Math.ceil((result.count ?? rows.length) / 30));
  return <div className="mx-auto max-w-5xl space-y-5"><Link href="/pelanggaran" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-navy"><ArrowLeft size={17} />Kembali ke data pelanggaran</Link><section className="rounded-2xl bg-navy p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-wider text-blue-200">Riwayat santri</p><h2 className="mt-2 text-3xl font-bold">{rows[0]?.student_name ?? studentName}</h2><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-sm text-blue-100"><GraduationCap size={17} />{rows[0]?.student_class}</p>{canAddReport && <Link href={`/pelanggaran/baru?student=${encodeURIComponent(normalized)}`} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-blue-50"><Plus size={17} />Tambah pelanggaran untuk santri ini</Link>}</div></section><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[{ label: "Total pelanggaran", value: summary.total, tone: "text-navy bg-white" }, { label: "Ringan", value: summary.ringan, tone: "text-blue-700 bg-blue-50" }, { label: "Sedang", value: summary.sedang, tone: "text-amber-700 bg-amber-50" }, { label: "Berat", value: summary.berat, tone: "text-red-700 bg-red-50" }].map((card) => <article key={card.label} className={`rounded-2xl border border-slate-200 p-4 shadow-sm ${card.tone}`}><p className="text-xs font-medium opacity-75">{card.label}</p><p className="mt-2 text-2xl font-bold">{Number(card.value ?? 0).toLocaleString("id-ID")}</p></article>)}</div><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h3 className="text-lg font-bold text-navy">Timeline pelanggaran</h3><div className="mt-6 space-y-0">{rows.map((row, index) => <article key={row.id} className="relative flex gap-4 pb-7 last:pb-0"><div className="relative flex w-10 shrink-0 flex-col items-center"><span className={`relative z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-navy text-xs font-bold text-white`}>{row.photo_url ? <Image src={row.photo_url} alt="" fill sizes="40px" unoptimized className="object-cover" /> : row.student_name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase()}</span>{index < rows.length - 1 && <span className="absolute top-10 h-full w-px bg-slate-200" />}</div><div className="min-w-0 flex-1 rounded-xl border border-slate-100 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><Link href={`/pelanggaran/${row.id}`} className="font-semibold text-navy hover:underline">{row.description.split("\n")[0].slice(0, 90)}</Link><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${row.category === "berat" ? "bg-red-50 text-red-700" : row.category === "sedang" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{row.category}</span></div><p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><CalendarDays size={13} />{new Date(`${row.incident_date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span><span>Dicatat oleh {row.reporter?.full_name ?? "—"}</span></p></div></article>)}</div><div className="mt-6 flex justify-between border-t border-slate-100 pt-4"><Link aria-disabled={page <= 1} className={page <= 1 ? "pointer-events-none text-slate-300" : "font-semibold text-navy"} href={`/santri/${encodeURIComponent(studentName)}?page=${Math.max(1, page - 1)}`}>Sebelumnya</Link><span className="text-xs text-slate-500">Halaman {page} dari {pageCount}</span><Link aria-disabled={page >= pageCount} className={page >= pageCount ? "pointer-events-none text-slate-300" : "font-semibold text-navy"} href={`/santri/${encodeURIComponent(studentName)}?page=${Math.min(pageCount, page + 1)}`}>Berikutnya</Link></div></section></div>;
}
