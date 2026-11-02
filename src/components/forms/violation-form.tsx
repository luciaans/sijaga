"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createViolationAction, updateViolationAction } from "@/actions/violations";
import { violationSchema, type ViolationInput } from "@/lib/validations/violation";
import { photoMetadataSchema } from "@/lib/validations/photo";
import type { Violation } from "@/types/database";

export function ViolationForm({ initial, suggestions = [], initialPhotoUrl }: { initial?: Violation; suggestions?: string[]; initialPhotoUrl?: string | null }) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | undefined>();
  const [preview, setPreview] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const form = useForm<ViolationInput>({ resolver: zodResolver(violationSchema), defaultValues: initial ? { studentName: initial.student_name, studentClass: initial.student_class, category: initial.category, description: initial.description, incidentDate: initial.incident_date } : { studentName: "", studentClass: "", category: "ringan", description: "", incidentDate: new Date().toLocaleDateString("sv-SE") } });
  async function submit(input: ViolationInput) {
    const payload = photo ? { ...input, photo } : input;
    const result = initial ? await updateViolationAction(initial.id, payload) : await createViolationAction(payload);
    if (!result.success) { toast.error(result.error); return; }
    toast.success(initial ? "Laporan berhasil diperbarui." : "Laporan berhasil dicatat.");
    router.push(initial ? `/pelanggaran/${initial.id}` : "/pelanggaran"); router.refresh();
  }
  async function selectPhoto(file?: File) {
    if (!file) return;
    const validation = photoMetadataSchema.safeParse({ name: file.name, type: file.type, size: file.size });
    if (!validation.success) { toast.error(validation.error.issues[0]?.message ?? "Foto tidak valid."); return; }
    setPhotoBusy(true);
    try {
      const image = await createImageBitmap(file);
      const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Foto tidak dapat diproses.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height); image.close();
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Foto tidak dapat dikompres.")), "image/jpeg", 0.82));
      if (blob.size > 2 * 1024 * 1024) throw new Error("Foto hasil kompresi masih lebih dari 2 MB.");
      const compressed = new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
      setPhoto(compressed); setPreview(URL.createObjectURL(blob));
    } catch (error) { toast.error(error instanceof Error ? error.message : "Foto gagal diproses."); }
    finally { setPhotoBusy(false); }
  }
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;
  return <form onSubmit={handleSubmit(submit)} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
    <div className="grid gap-5 md:grid-cols-2">
      <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Foto santri <span className="font-normal text-slate-400">(opsional)</span></label><div className="flex flex-wrap items-center gap-4"><span className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-navy text-xl font-bold text-white">{preview || initialPhotoUrl ? <Image src={preview ?? initialPhotoUrl!} alt="Foto santri" fill sizes="80px" unoptimized className="object-cover" /> : initial?.student_name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase() ?? <ImagePlus size={24} />}</span><div className="flex flex-wrap items-center gap-2"><label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">{photoBusy ? "Memproses…" : photo ? "Ganti foto" : "Pilih foto"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy} onChange={(event) => void selectPhoto(event.target.files?.[0])} className="sr-only" /></label>{photo && <button type="button" onClick={() => { setPhoto(undefined); setPreview(null); }} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"><X size={16} />Hapus pilihan</button>}</div><p className="basis-full text-xs text-slate-500">JPG, PNG, atau WebP. Maksimal 2 MB; foto akan diperkecil hingga sisi terpanjang 1.280 piksel.</p></div></div>
      <Field label="Nama lengkap santri" error={errors.studentName?.message}><input list="student-name-suggestions" {...register("studentName")} placeholder="Masukkan nama lengkap" className={fieldClass} /><datalist id="student-name-suggestions">{suggestions.map((name) => <option key={name} value={name} />)}</datalist></Field>
      <Field label="Kelas" error={errors.studentClass?.message}><input {...register("studentClass")} placeholder="Contoh: VII A" className={fieldClass} /></Field>
      <Field label="Kategori pelanggaran" error={errors.category?.message}><select {...register("category")} className={fieldClass}><option value="ringan">Ringan</option><option value="sedang">Sedang</option><option value="berat">Berat</option></select></Field>
      <Field label="Tanggal kejadian" error={errors.incidentDate?.message}><input type="date" max={new Date().toLocaleDateString("sv-SE")} {...register("incidentDate")} className={fieldClass} /></Field>
    </div>
    <Field label="Jenis / deskripsi pelanggaran" error={errors.description?.message}><textarea rows={5} {...register("description")} placeholder="Jelaskan pelanggaran secara jelas dan objektif" className={`${fieldClass} resize-y`} /></Field>
    <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">Batal</button><button disabled={isSubmitting} className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-soft disabled:opacity-60">{isSubmitting ? "Menyimpan…" : initial ? "Simpan perubahan" : "Simpan laporan"}</button></div>
  </form>;
}

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <div><label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>{children}{error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}</div>; }
