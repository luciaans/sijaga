"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { GraduationCap, ImagePlus, Search, UserRoundPlus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createViolationAction, updateViolationAction } from "@/actions/violations";
import { violationSchema, type ViolationInput } from "@/lib/validations/violation";
import { photoMetadataSchema } from "@/lib/validations/photo";
import { createClient } from "@/lib/supabase/client";
import type { Violation } from "@/types/database";

type StudentOption = { student_name: string; student_name_normalized: string; student_class: string; report_count: number };

export function ViolationForm({ initial, initialStudents = [], initialStudent, initialPhotoUrl, reporterLabel }: { initial?: Violation; initialStudents?: StudentOption[]; initialStudent?: StudentOption | null; initialPhotoUrl?: string | null; reporterLabel?: string }) {
  const router = useRouter();
  const [studentMode, setStudentMode] = useState<"existing" | "new">("existing");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>(initialStudents);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(initialStudent ?? null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState(false);
  const [photo, setPhoto] = useState<File | undefined>();
  const [preview, setPreview] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const form = useForm<ViolationInput>({ resolver: zodResolver(violationSchema), defaultValues: initial ? { studentName: initial.student_name, studentClass: initial.student_class, category: initial.category, description: initial.description, incidentDate: initial.incident_date } : { studentName: initialStudent?.student_name ?? "", studentClass: initialStudent?.student_class ?? "", category: "ringan", description: "", incidentDate: new Date().toLocaleDateString("sv-SE") } });
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setStudentsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.rpc("search_students", { query_text: studentSearch.trim() });
      setStudentsLoading(false);
      if (error) { setStudentsError(true); return; }
      setStudentsError(false);
      setStudentOptions((data ?? []) as StudentOption[]);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [studentSearch]);
  function changeStudentMode(mode: "existing" | "new") {
    setStudentMode(mode);
    setSelectedStudent(null);
    form.setValue("studentName", "", { shouldValidate: true });
    form.setValue("studentClass", "", { shouldValidate: true });
  }
  function chooseStudent(student: StudentOption) {
    setSelectedStudent(student);
    form.setValue("studentName", student.student_name, { shouldValidate: true });
    form.setValue("studentClass", student.student_class, { shouldValidate: true });
  }
  async function submit(input: ViolationInput) {
    const payload = photo ? { ...input, photo } : input;
    const result = initial ? await updateViolationAction(initial.id, payload) : await createViolationAction(payload);
    if (!result.success) { toast.error(result.error); return; }
    toast.success(initial ? "Laporan berhasil diperbarui." : `Laporan ke-${result.studentReportCount ?? 1} untuk ${input.studentName} berhasil dicatat.`);
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
    {reporterLabel && !initial && <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-accent-light p-4"><GraduationCap className="mt-0.5 shrink-0 text-navy" size={19} /><p className="text-sm leading-6 text-slate-700">Laporan ini otomatis dicatat atas nama <strong className="text-navy">{reporterLabel}</strong>.</p></div>}
    <div className="grid gap-5 md:grid-cols-2">
      <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Foto santri <span className="font-normal text-slate-400">(opsional)</span></label><div className="flex flex-wrap items-center gap-4"><span className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-navy text-xl font-bold text-white">{preview || initialPhotoUrl ? <Image src={preview ?? initialPhotoUrl!} alt="Foto santri" fill sizes="80px" unoptimized className="object-cover" /> : initial?.student_name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase() ?? <ImagePlus size={24} />}</span><div className="flex flex-wrap items-center gap-2"><label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">{photoBusy ? "Memproses…" : photo ? "Ganti foto" : "Pilih foto"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy} onChange={(event) => void selectPhoto(event.target.files?.[0])} className="sr-only" /></label>{photo && <button type="button" onClick={() => { setPhoto(undefined); setPreview(null); }} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"><X size={16} />Hapus pilihan</button>}</div><p className="basis-full text-xs text-slate-500">JPG, PNG, atau WebP. Maksimal 2 MB; foto akan diperkecil hingga sisi terpanjang 1.280 piksel.</p></div></div>
      {initial ? <><Field label="Nama lengkap santri" error={errors.studentName?.message}><input {...register("studentName")} placeholder="Masukkan nama lengkap" className={fieldClass} /></Field><Field label="Kelas" error={errors.studentClass?.message}><input {...register("studentClass")} placeholder="Contoh: VII A" className={fieldClass} /></Field></> : <div className="md:col-span-2 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div><h3 className="font-semibold text-navy">Santri yang melanggar</h3><p className="mt-1 text-xs leading-5 text-slate-500">Pilih santri yang sudah pernah dicatat agar riwayat dan jumlah pelanggarannya menyatu.</p></div>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-1"><button type="button" onClick={() => changeStudentMode("existing")} aria-pressed={studentMode === "existing"} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${studentMode === "existing" ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-50"}`}>Pilih santri terdata</button><button type="button" onClick={() => changeStudentMode("new")} aria-pressed={studentMode === "new"} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${studentMode === "new" ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-50"}`}><span className="inline-flex items-center gap-1.5"><UserRoundPlus size={16} />Santri baru</span></button></div>
        {studentMode === "existing" ? <div className="space-y-3">
          <label className="relative block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} className={`${fieldClass} pl-10`} placeholder="Cari nama santri" aria-label="Cari santri yang sudah pernah dicatat" /></label>
          {selectedStudent ? <><input type="hidden" {...register("studentName")} /><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-white p-4"><div><p className="font-semibold text-navy">{selectedStudent.student_name}</p><p className="mt-1 text-xs text-slate-500">Sudah tercatat {selectedStudent.report_count} kali. Laporan ini akan menjadi pelanggaran ke-{selectedStudent.report_count + 1}.</p></div><button type="button" onClick={() => { setSelectedStudent(null); form.setValue("studentName", "", { shouldValidate: true }); form.setValue("studentClass", "", { shouldValidate: true }); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Ganti santri</button></div><Field label="Kelas saat kejadian" error={errors.studentClass?.message}><input {...register("studentClass")} placeholder="Contoh: VII A" className={fieldClass} /></Field></> : <div className="max-h-64 space-y-2 overflow-y-auto">{studentsLoading ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Memuat daftar santri...</p> : studentsError ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Daftar santri gagal dimuat. Periksa koneksi lalu coba lagi.</p> : studentOptions.length === 0 ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Santri belum ditemukan. Pilih tab “Santri baru” untuk mencatat nama baru.</p> : studentOptions.map((student) => <button key={student.student_name_normalized} type="button" onClick={() => chooseStudent(student)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-accent hover:bg-blue-50"><span><strong className="block text-sm text-slate-800">{student.student_name}</strong><small className="mt-0.5 block text-slate-500">Kelas {student.student_class}</small></span><span className="shrink-0 rounded-full bg-accent-light px-2.5 py-1 text-xs font-semibold text-navy">{student.report_count} pelanggaran</span></button>)}</div>}
          {errors.studentName?.message && <p className="text-xs text-red-600">{errors.studentName.message}</p>}
        </div> : <div className="grid gap-4 sm:grid-cols-2"><Field label="Nama lengkap santri" error={errors.studentName?.message}><input {...register("studentName")} placeholder="Masukkan nama lengkap santri" className={fieldClass} /></Field><Field label="Kelas saat kejadian" error={errors.studentClass?.message}><input {...register("studentClass")} placeholder="Contoh: VII A" className={fieldClass} /></Field><p className="sm:col-span-2 text-xs leading-5 text-slate-500">Jika nama ini pernah dicatat, riwayat dan jumlah pelanggaran tetap digabung berdasarkan nama santri.</p></div>}
      </div>}
      <Field label="Kategori pelanggaran" error={errors.category?.message}><select {...register("category")} className={fieldClass}><option value="ringan">Ringan</option><option value="sedang">Sedang</option><option value="berat">Berat</option></select></Field>
      <Field label="Tanggal kejadian" error={errors.incidentDate?.message}><input type="date" max={new Date().toLocaleDateString("sv-SE")} {...register("incidentDate")} className={fieldClass} /></Field>
    </div>
    <Field label="Jenis / deskripsi pelanggaran" error={errors.description?.message}><textarea rows={5} {...register("description")} placeholder="Jelaskan pelanggaran secara jelas dan objektif" className={`${fieldClass} resize-y`} /></Field>
    <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">Batal</button><button disabled={isSubmitting} className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-soft disabled:opacity-60">{isSubmitting ? "Menyimpan…" : initial ? "Simpan perubahan" : "Simpan laporan"}</button></div>
  </form>;
}

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <div><label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>{children}{error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}</div>; }
