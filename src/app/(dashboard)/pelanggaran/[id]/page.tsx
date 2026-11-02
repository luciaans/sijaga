import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, GraduationCap, UserRound } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { requireRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { createSignedPhotoUrl } from "@/lib/supabase/photos";
import { ReportActions } from "@/components/forms/report-actions";
import type { Violation } from "@/types/database";
import { USTAZ_CAN_DELETE_OWN_REPORT } from "@/lib/constants";

type Detail = Violation & { reporter: { full_name: string; username: string } | null };
const stamp = (value: string) => format(parseISO(value), "d MMMM yyyy, HH:mm", { locale: id });

export default async function ViolationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole();
  const { id: reportId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("pelanggaran").select("*,reporter:profiles!pelanggaran_reporter_id_fkey(full_name,username)").eq("id", reportId).maybeSingle();
  if (!data) notFound();
  const report = data as unknown as Detail;
  const photoUrl = await createSignedPhotoUrl(report.student_photo_url);
  const canEdit = profile.role === "admin" || report.reporter_id === profile.id;
  return <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5"><Link href="/pelanggaran" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-navy"><ArrowLeft size={17} />{profile.role === "ustaz" ? "Kembali ke Laporan Saya" : "Kembali ke data pelanggaran"}</Link><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="h-2 bg-navy" /><div className="p-4 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Detail laporan pelanggaran</p><h2 className="mt-1 text-2xl font-bold text-navy">{report.student_name}</h2><p className="mt-1 text-sm text-slate-500">Dicatat pada {stamp(report.created_at)}</p></div><ReportActions id={report.id} studentName={report.student_name} canEdit={canEdit} canDelete={profile.role === "admin" || (USTAZ_CAN_DELETE_OWN_REPORT && report.reporter_id === profile.id)} /></div>
    <div className="mt-5 grid gap-4 lg:mt-7 lg:grid-cols-[220px_1fr] lg:gap-6"><div className="hidden flex-col items-center rounded-2xl bg-slate-50 p-4 lg:flex"><div className="relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-2xl bg-navy text-4xl font-bold text-white">{photoUrl ? <Image src={photoUrl} alt={`Foto ${report.student_name}`} fill sizes="176px" unoptimized className="object-cover" /> : report.student_name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase()}</div><p className="mt-3 text-xs text-slate-500">Foto santri</p></div><div className="space-y-3 sm:space-y-5"><div className="grid grid-cols-2 gap-2 sm:gap-4"><Info icon={<GraduationCap size={18} />} label="Kelas" value={report.student_class} /><Info icon={<CalendarDays size={18} />} label="Tanggal kejadian" value={format(parseISO(report.incident_date), "d MMMM yyyy", { locale: id })} /><Info icon={<UserRound size={18} />} label="Ustadz/Ustadzah pelapor" value={report.reporter?.full_name ?? "—"} /><Info icon={<Clock3 size={18} />} label="Terakhir diperbarui" value={stamp(report.updated_at)} /></div><div className="rounded-xl border border-slate-200 p-3.5 sm:rounded-2xl sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold text-navy">Jenis pelanggaran</h3><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${report.category === "berat" ? "bg-red-50 text-red-700" : report.category === "sedang" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{report.category}</span></div><p className="mt-2.5 whitespace-pre-wrap text-sm leading-6 text-slate-700 sm:mt-4 sm:leading-7">{report.description}</p></div><Link href={`/santri/${encodeURIComponent(report.student_name)}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent-light px-3.5 py-2.5 text-xs font-semibold text-navy hover:bg-blue-100 sm:px-4 sm:py-3 sm:text-sm"><span className="sm:hidden">Riwayat {report.student_name}</span><span className="hidden sm:inline">Lihat riwayat pelanggaran {report.student_name}</span><span aria-hidden="true">→</span></Link></div></div></div></section></div>;
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex min-h-[70px] items-start gap-2 rounded-xl bg-slate-50 p-2.5 sm:min-h-0 sm:gap-3 sm:p-4"><span className="mt-0.5 shrink-0 text-accent">{icon}</span><span className="min-w-0"><small className="block text-[10px] leading-4 text-slate-500 sm:text-xs">{label}</small><strong className="mt-0.5 block break-words text-xs leading-4 text-slate-800 sm:mt-1 sm:text-sm sm:leading-normal">{value}</strong></span></div>; }
