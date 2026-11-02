"use client";

import { AlertTriangle } from "lucide-react";

export function ConfirmationDialog({ open, title, description, confirmLabel = "Ya, lanjutkan", busy = false, onCancel, onConfirm }: { open: boolean; title: string; description: string; confirmLabel?: string; busy?: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return <div role="presentation" className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}><section role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-700"><AlertTriangle size={21} /></span><h2 id="confirm-dialog-title" className="mt-4 text-lg font-bold text-navy">{title}</h2><p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-slate-600">{description}</p><div className="mt-6 flex justify-end gap-2"><button disabled={busy} onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50">Batal</button><button disabled={busy} onClick={onConfirm} className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">{busy ? "Memproses…" : confirmLabel}</button></div></section></div>;
}
