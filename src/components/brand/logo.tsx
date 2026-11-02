import { ShieldCheck } from "lucide-react";

export function Logo({ light = false }: { light?: boolean }) {
  return <div className={`flex items-center gap-3 ${light ? "text-white" : "text-navy"}`}>
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-light text-navy"><ShieldCheck size={26} strokeWidth={2.3} /></span>
    <span><strong className="block text-xl font-extrabold tracking-[0.12em]">SIJAGA</strong><small className={`block text-[10px] ${light ? "text-blue-100" : "text-slate-500"}`}>Sistem Informasi Kedisiplinan Santri</small></span>
  </div>;
}
