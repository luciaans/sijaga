import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { ViolationForm } from "@/components/forms/violation-form";
import type { Violation } from "@/types/database";
import { createSignedPhotoUrl } from "@/lib/supabase/photos";

export default async function EditViolationPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole();
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("pelanggaran").select("*").eq("id", id).maybeSingle();
  if (!data || (profile.role !== "admin" && data.reporter_id !== profile.id)) notFound();
  const photoUrl = await createSignedPhotoUrl(data.student_photo_url);
  return <div className="mx-auto max-w-4xl space-y-5"><Link href={`/pelanggaran/${id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-navy"><ChevronLeft size={17} />Kembali ke detail laporan</Link><div><h2 className="text-2xl font-bold text-navy">Edit laporan pelanggaran</h2><p className="mt-1 text-sm text-slate-500">Perubahan dicatat dalam log aktivitas sistem.</p></div><ViolationForm initial={data as Violation} initialPhotoUrl={photoUrl} /></div>;
}
