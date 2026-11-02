"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Search, ShieldCheck, UserRound, UserRoundX, X } from "lucide-react";
import { toast } from "sonner";
import { createUstazAction, deleteUstazAction, setUstazActiveAction, updateUstazAction } from "@/actions/ustaz";
import { createUstazSchema, updateUstazSchema, type CreateUstazInput, type UpdateUstazInput } from "@/lib/validations/ustaz";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

type UstazRow = { profile_id: string; full_name: string; username: string; educator_type: "ustadz" | "ustadzah"; is_active: boolean; created_at: string; report_count: number };
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10";
const educatorLabel = (type: UstazRow["educator_type"]) => type === "ustadzah" ? "Ustadzah" : "Ustadz";

export function UstazManager({ initialRows }: { initialRows: UstazRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<UstazRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ mode: "deactivate" | "delete"; row: UstazRow } | null>(null);
  const createForm = useForm<CreateUstazInput>({ resolver: zodResolver(createUstazSchema), defaultValues: { fullName: "", username: "", educatorType: "ustadz", password: "", confirmPassword: "" } });
  const editForm = useForm<UpdateUstazInput>({ resolver: zodResolver(updateUstazSchema), values: editing ? { id: editing.profile_id, fullName: editing.full_name, username: editing.username, educatorType: editing.educator_type, password: "" } : undefined });
  const filtered = useMemo(() => initialRows.filter((row) => `${row.full_name} ${row.username} ${educatorLabel(row.educator_type)}`.toLowerCase().includes(query.toLowerCase())), [initialRows, query]);

  async function create(input: CreateUstazInput) {
    const result = await createUstazAction(input);
    if (!result.success) { toast.error(result.error); return; }
    toast.success("Akun berhasil ditambahkan."); createForm.reset(); router.refresh();
  }
  async function update(input: UpdateUstazInput) {
    const result = await updateUstazAction(input);
    if (!result.success) { toast.error(result.error); return; }
    toast.success("Data akun berhasil diperbarui."); setEditing(null); router.refresh();
  }
  async function toggle(row: UstazRow) {
    const active = !row.is_active;
    if (!active) { setPending({ mode: "deactivate", row }); return; }
    await setActive(row, true);
  }
  async function setActive(row: UstazRow, active: boolean) {
    setBusyId(row.profile_id);
    const result = await setUstazActiveAction(row.profile_id, active);
    setBusyId(null);
    setPending(null);
    if (!result.success) toast.error(result.error); else { toast.success(active ? "Akun diaktifkan kembali." : "Akun dinonaktifkan."); router.refresh(); }
  }
  async function remove(row: UstazRow) {
    setPending({ mode: "delete", row });
  }
  async function confirmDelete(row: UstazRow) {
    setBusyId(row.profile_id);
    const result = await deleteUstazAction(row.profile_id);
    setBusyId(null);
    setPending(null);
    if (!result.success) toast.error(result.error); else { toast.success("Akun dihapus."); router.refresh(); }
  }

  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-light text-navy"><Plus size={20} /></span><div><h2 className="font-bold text-navy">Tambah akun Ustadz/Ustadzah</h2><p className="text-xs text-slate-500">Pilih jenis akun. Akun baru dapat langsung digunakan untuk masuk.</p></div></div>
      <form onSubmit={createForm.handleSubmit(create)} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Field label="Nama lengkap" error={createForm.formState.errors.fullName?.message}><input {...createForm.register("fullName")} className={inputClass} placeholder="Nama lengkap" /></Field><Field label="Jenis akun" error={createForm.formState.errors.educatorType?.message}><select {...createForm.register("educatorType")} className={inputClass}><option value="ustadz">Ustadz</option><option value="ustadzah">Ustadzah</option></select></Field><Field label="Username" error={createForm.formState.errors.username?.message}><input {...createForm.register("username")} className={inputClass} placeholder="huruf_kecil_angka" autoComplete="off" /></Field><Field label="Kata sandi" error={createForm.formState.errors.password?.message}><input type="password" {...createForm.register("password")} className={inputClass} placeholder="Minimal 8 karakter" autoComplete="new-password" /></Field><Field label="Konfirmasi kata sandi" error={createForm.formState.errors.confirmPassword?.message}><input type="password" {...createForm.register("confirmPassword")} className={inputClass} placeholder="Ulangi kata sandi" autoComplete="new-password" /></Field><div className="sm:col-span-2 xl:col-span-5"><button disabled={createForm.formState.isSubmitting} className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-soft disabled:opacity-60">Simpan akun</button></div></form>
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5"><div><h2 className="font-bold text-navy">Daftar Ustadz/Ustadzah</h2><p className="mt-1 text-xs text-slate-500">{initialRows.length.toLocaleString("id-ID")} akun tercatat</p></div><label className="relative block w-full sm:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Cari nama, jenis akun, atau username" className={`${inputClass} pl-9`} placeholder="Cari nama atau username" /></label></div>
      {filtered.length === 0 ? <div className="p-12 text-center"><UserRound className="mx-auto text-slate-300" size={32} /><p className="mt-3 text-sm font-semibold text-slate-600">{initialRows.length === 0 ? "Belum ada akun Ustadz/Ustadzah." : "Akun tidak ditemukan."}</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Nama / Username</th><th className="px-5 py-3">Jenis</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Tanggal dibuat</th><th className="px-5 py-3 text-right">Jumlah laporan</th><th className="px-5 py-3 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((row) => <tr key={row.profile_id} className="hover:bg-slate-50"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{row.full_name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase()}</span><span><strong className="block text-slate-800">{row.full_name}</strong><small className="text-slate-500">@{row.username}</small></span></div></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.educator_type === "ustadzah" ? "bg-fuchsia-50 text-fuchsia-700" : "bg-blue-50 text-blue-700"}`}>{educatorLabel(row.educator_type)}</span></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{row.is_active ? "Aktif" : "Nonaktif"}</span></td><td className="px-5 py-4 text-slate-600">{new Date(row.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</td><td className="px-5 py-4 text-right font-semibold text-navy">{Number(row.report_count).toLocaleString("id-ID")}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => setEditing(row)} aria-label={`Edit ${row.full_name}`} title="Edit akun" className="rounded-lg p-2 text-slate-500 hover:bg-accent-light hover:text-navy"><Pencil size={17} /></button><button disabled={busyId === row.profile_id} onClick={() => void toggle(row)} aria-label={row.is_active ? `Nonaktifkan ${row.full_name}` : `Aktifkan ${row.full_name}`} title={row.is_active ? "Nonaktifkan" : "Aktifkan kembali"} className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"><ShieldCheck size={17} /></button><button disabled={busyId === row.profile_id} onClick={() => void remove(row)} aria-label={`Hapus ${row.full_name}`} title="Hapus akun" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><UserRoundX size={17} /></button></div></td></tr>)}</tbody></table></div>}
    </section>
    {editing && <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}><section role="dialog" aria-modal="true" aria-labelledby="edit-ustaz-title" className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><h2 id="edit-ustaz-title" className="text-lg font-bold text-navy">Edit akun {editing ? educatorLabel(editing.educator_type) : ""}</h2><p className="mt-1 text-sm text-slate-500">Jenis akun dapat diubah. Kosongkan kata sandi jika tidak ingin mengubahnya.</p></div><button onClick={() => setEditing(null)} aria-label="Tutup" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button></div><form onSubmit={editForm.handleSubmit(update)} className="space-y-4"><input type="hidden" {...editForm.register("id")} /><Field label="Nama lengkap" error={editForm.formState.errors.fullName?.message}><input {...editForm.register("fullName")} className={inputClass} /></Field><Field label="Jenis akun" error={editForm.formState.errors.educatorType?.message}><select {...editForm.register("educatorType")} className={inputClass}><option value="ustadz">Ustadz</option><option value="ustadzah">Ustadzah</option></select></Field><Field label="Username" error={editForm.formState.errors.username?.message}><input {...editForm.register("username")} className={inputClass} /></Field><Field label="Kata sandi baru" error={editForm.formState.errors.password?.message}><input type="password" {...editForm.register("password")} className={inputClass} autoComplete="new-password" placeholder="Kosongkan jika tidak diubah" /></Field><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Batal</button><button disabled={editForm.formState.isSubmitting} className="rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Simpan perubahan</button></div></form></section></div>}
    <ConfirmationDialog open={Boolean(pending)} title={pending?.mode === "delete" ? "Hapus akun?" : "Nonaktifkan akun?"} description={pending?.mode === "delete" ? `Akun ${pending.row.full_name} akan dihapus lunak, login diblokir, dan username tidak dapat digunakan ulang.` : `Akun ${pending?.row.full_name} tidak dapat login hingga diaktifkan kembali.`} confirmLabel={pending?.mode === "delete" ? "Hapus akun" : "Nonaktifkan"} busy={Boolean(pending && busyId === pending.row.profile_id)} onCancel={() => setPending(null)} onConfirm={() => { if (!pending) return; if (pending.mode === "delete") void confirmDelete(pending.row); else void setActive(pending.row, false); }} />
  </div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <div><label className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>{children}{error && <p className="mt-1 text-xs text-red-600">{error}</p>}</div>; }
