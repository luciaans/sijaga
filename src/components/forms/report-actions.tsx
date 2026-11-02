"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteViolationAction } from "@/actions/violations";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function ReportActions({ id, studentName, canEdit, canDelete }: { id: string; studentName: string; canEdit: boolean; canDelete: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  async function remove() {
    setBusy(true); const result = await deleteViolationAction(id); setBusy(false);
    setConfirming(false);
    if (!result.success) toast.error(result.error);
    else { toast.success("Laporan berhasil dihapus."); router.push("/pelanggaran"); router.refresh(); }
  }
  return <><div className="flex flex-wrap gap-2">{canEdit && <Link href={`/pelanggaran/${id}/edit`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Pencil size={16} />Edit laporan</Link>}{canDelete && <button disabled={busy} onClick={() => setConfirming(true)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"><Trash2 size={16} />Hapus laporan</button>}</div><ConfirmationDialog open={confirming} title="Hapus laporan?" description={`Laporan untuk ${studentName} akan dihapus permanen dari daftar.`} confirmLabel="Hapus laporan" busy={busy} onCancel={() => setConfirming(false)} onConfirm={() => void remove()} /></>;
}
