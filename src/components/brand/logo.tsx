import Image from "next/image";

export function Logo({ light = false }: { light?: boolean }) {
  return <div className={`flex items-center gap-3 ${light ? "text-white" : "text-navy"}`}>
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-light shadow-sm ring-1 ring-white/20">
      <Image src="/al-jihad-emblem.png" alt="Emblem Pondok Pesantren Al-Jihad" width={48} height={48} priority className="h-full w-full object-contain" />
    </span>
    <span><strong className="block text-xl font-extrabold tracking-[0.12em]">SIJAGA</strong><small className={`block text-[10px] ${light ? "text-blue-100" : "text-slate-500"}`}>Sistem Informasi Kedisiplinan Santri</small></span>
  </div>;
}
