"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { toast.error("Terjadi kesalahan saat memuat halaman."); }, []);
  return <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm"><h2 className="text-lg font-bold text-navy">Halaman gagal dimuat</h2><p className="mt-2 text-sm text-slate-500">Silakan coba muat ulang halaman. Jika masalah berlanjut, hubungi administrator.</p><button onClick={() => reset()} className="mt-5 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white">Coba lagi</button></div>;
}
