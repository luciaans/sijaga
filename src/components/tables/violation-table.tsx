"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteViolationAction } from "@/actions/violations";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { Violation } from "@/types/database";

type Row = Violation & { student_report_count: number; reporter: { full_name: string } | null; photo_url?: string | null };

export function ViolationTable({ rows, profileId, isAdmin, canUstazDeleteOwn, page, pageCount, queryString }: { rows: Row[]; profileId: string; isAdmin: boolean; canUstazDeleteOwn: boolean; page: number; pageCount: number; queryString: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pending, setPending] = useState<Row | null>(null);
  async function remove(row: Row) {
    setDeleting(row.id);
    const result = await deleteViolationAction(row.id);
    setDeleting(null);
    setPending(null);
    if (!result.success) toast.error(result.error);
    else { toast.success("Laporan berhasil dihapus."); router.refresh(); }
  }
  const link = (target: number) => `/pelanggaran?${queryString}${queryString ? "&" : ""}page=${target}`;
  if (rows.length === 0) return <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-light text-navy"><Pencil size={23} /></span><h3 className="mt-4 font-bold text-navy">Laporan tidak ditemukan</h3><p className="mt-1 text-sm text-slate-500">Coba ubah filter atau tambahkan laporan baru.</p></div>;
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">No.</th><th className="px-4 py-3">Foto</th><th className="px-4 py-3">Nama santri</th><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Jenis pelanggaran</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Ustadz/Ustadzah pelapor</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
      <tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={row.id} className="hover:bg-slate-50"><td className="px-4 py-3.5 text-slate-500">{(page - 1) * 20 + index + 1}</td><td className="px-4 py-3"><Link href={`/pelanggaran/${row.id}`} className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-navy text-xs font-bold text-white">{row.photo_url ? <Image src={row.photo_url} alt={`Foto ${row.student_name}`} fill sizes="40px" unoptimized className="object-cover" /> : row.student_name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase()}</Link></td><td className="px-4 py-3.5 font-semibold text-navy"><Link className="hover:underline" href={`/pelanggaran/${row.id}`}>{row.student_name}</Link><small className={`mt-1 block text-xs font-medium ${Number(row.student_report_count ?? 1) > 1 ? "text-amber-700" : "text-slate-400"}`}>{Number(row.student_report_count ?? 1)} kali tercatat</small></td><td className="px-4 py-3.5 text-slate-600">{row.student_class}</td><td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${row.category === "berat" ? "bg-red-50 text-red-700" : row.category === "sedang" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{row.category}</span><p className="mt-1 max-w-52 truncate text-xs text-slate-500">{row.description}</p></td><td className="px-4 py-3.5 text-slate-600">{new Date(`${row.incident_date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td><td className="px-4 py-3.5 text-slate-600">{row.reporter?.full_name ?? "—"}</td><td className="px-4 py-3.5"><div className="flex justify-end gap-1">{(isAdmin || row.reporter_id === profileId) && <Link href={`/pelanggaran/${row.id}/edit`} title="Edit laporan" aria-label="Edit laporan" className="rounded-lg p-2 text-slate-500 hover:bg-accent-light hover:text-navy"><Pencil size={17} /></Link>}{(isAdmin || (canUstazDeleteOwn && row.reporter_id === profileId)) && <button disabled={deleting === row.id} onClick={() => setPending(row)} title="Hapus laporan" aria-label="Hapus laporan" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><Trash2 size={17} /></button>}</div></td></tr>)}</tbody>
    </table></div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4"><p className="text-xs text-slate-500">Halaman {page} dari {pageCount}</p><div className="flex gap-2"><Link aria-disabled={page <= 1} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${page <= 1 ? "pointer-events-none border-slate-100 text-slate-300" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`} href={link(Math.max(1, page - 1))}>Sebelumnya</Link><Link aria-disabled={page >= pageCount} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${page >= pageCount ? "pointer-events-none border-slate-100 text-slate-300" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`} href={link(Math.min(pageCount, page + 1))}>Berikutnya</Link></div></div>
    <ConfirmationDialog open={Boolean(pending)} title="Hapus laporan?" description={pending ? `Laporan untuk ${pending.student_name} akan dihapus permanen dari daftar.` : ""} confirmLabel="Hapus laporan" busy={deleting !== null} onCancel={() => setPending(null)} onConfirm={() => pending && void remove(pending)} />
  </div>;
}
