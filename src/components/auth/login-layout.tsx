import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "@/components/forms/login-form";
import type { UserRole } from "@/types/database";

const accountChoices = [
  { role: "admin" as const, href: "/login/admin", label: "Admin", description: "Kelola pengguna, data santri, dan administrasi sistem.", icon: ShieldCheck },
  { role: "ustaz" as const, href: "/login/ustadz", label: "Ustadz / Ustadzah", description: "Catat pelanggaran dan pantau riwayat santri.", icon: UserRound },
];

export function LoginLayout({ role }: { role?: UserRole }) {
  const selectedAccount = role ? accountChoices.find((choice) => choice.role === role) : undefined;

  return <main className="grid min-h-screen bg-slate-50 lg:min-h-[100svh] lg:grid-cols-[1fr_1fr] lg:bg-white">
    <section className="relative hidden overflow-hidden bg-gradient-to-br from-navy via-[#102e52] to-[#194c77] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
      <div aria-hidden="true" className="absolute -right-36 -top-28 h-[28rem] w-[28rem] rounded-full border border-white/10" />
      <div aria-hidden="true" className="absolute -right-20 -top-12 h-[22rem] w-[22rem] rounded-full border border-white/10" />
      <Logo light />
      <div className="relative z-10 max-w-xl py-8">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">Pondok Pesantren Al-Jihad Kapuas Hulu</p>
        <h1 className="mb-5 max-w-2xl text-4xl font-bold leading-tight tracking-tight xl:text-5xl">Disiplin Terjaga,<br className="hidden xl:block" /> Pembinaan Lebih Terarah.</h1>
        <p className="max-w-xl text-base leading-7 text-blue-100/85">Satu sistem untuk mencatat pelanggaran, memantau riwayat kedisiplinan, dan mengelola data santri secara lebih tertib dan terstruktur.</p>
      </div>
      <p className="relative z-10 border-t border-white/10 pt-5 text-xs text-blue-100/60">SIJAGA <span className="mx-1.5 text-blue-200/40">•</span> Sistem Informasi Kedisiplinan Santri</p>
    </section>

    <section className="relative flex min-h-screen flex-col justify-start bg-gradient-to-br from-navy via-[#102e52] to-[#194c77] lg:min-h-[100svh] lg:bg-none lg:bg-white">
      <div className="relative isolate overflow-hidden px-5 pb-10 pt-6 text-white sm:pb-16 sm:pt-8 lg:hidden">
        <div aria-hidden="true" className="absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full border-[28px] border-white/5" />
        <div aria-hidden="true" className="absolute bottom-4 right-12 -z-10 h-32 w-32 rounded-full bg-sky-300/10 blur-2xl" />
        <Logo light />
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200 sm:mt-9 sm:text-xs sm:tracking-[0.18em]">Pondok Pesantren Al-Jihad Kapuas Hulu</p>
        <h1 className="mt-2 text-[1.4rem] font-bold tracking-tight sm:text-2xl">{selectedAccount ? `Login ${selectedAccount.label}` : "Selamat datang di SIJAGA"}</h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-blue-100/85">{selectedAccount ? "Masuk untuk melanjutkan ke sistem kedisiplinan santri." : "Pilih jenis akun untuk melanjutkan."}</p>
      </div>

      <div className="relative z-10 -mt-8 flex flex-1 items-start justify-center rounded-t-[1.75rem] border-t border-slate-200/80 bg-white px-4 pb-6 pt-6 shadow-[0_-12px_32px_rgba(11,37,69,0.08)] sm:-mt-10 sm:mx-4 sm:rounded-3xl sm:border sm:px-8 sm:py-9 lg:mx-0 lg:mt-0 lg:flex-none lg:min-h-[100svh] lg:items-center lg:rounded-none lg:border-0 lg:px-12 lg:py-10 lg:shadow-none">
      <div className="w-full max-w-md">
        {selectedAccount ? <>
          <Link href="/login" className="mb-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-navy sm:mb-6"><ArrowLeft size={17} />Pilih jenis akun</Link>
          <div className="mb-4 hidden h-12 w-12 items-center justify-center rounded-2xl bg-accent-light text-navy lg:flex"><selectedAccount.icon size={23} /></div>
          <p className="mb-2 hidden text-sm font-semibold text-accent lg:block">Login {selectedAccount.label}</p>
          <h2 className="mb-2 text-2xl font-bold leading-tight tracking-tight text-navy sm:text-4xl">Masuk ke SIJAGA</h2>
          <p className="mb-5 text-sm leading-5 text-slate-500 sm:mb-7 sm:leading-6">Gunakan username dan kata sandi akun {selectedAccount.label} Anda.</p>
          <LoginForm expectedRole={role!} />
          <p className="mt-4 text-center text-xs leading-5 text-slate-400 sm:mt-6">Halaman login {selectedAccount.label} Pondok Pesantren Al-Jihad.</p>
        </> : <>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-navy"><ShieldCheck size={14} />Portal akses SIJAGA</div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-navy sm:text-4xl">Masuk ke SIJAGA</h2>
          <p className="mb-5 max-w-md text-sm leading-5 text-slate-500 sm:mb-7 sm:leading-6">Pilih akses sesuai peran dan tanggung jawab Anda di Pondok Pesantren Al-Jihad.</p>
          <div className="space-y-2.5 sm:space-y-3">{accountChoices.map(({ role: accountRole, href, label, description, icon: Icon }) => <Link key={accountRole} href={href} className="group flex min-h-20 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/[0.025] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md hover:shadow-navy/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15 active:translate-y-0 sm:min-h-[5.5rem] sm:gap-4 sm:rounded-2xl sm:p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-navy transition group-hover:border-blue-200 group-hover:bg-white sm:h-12 sm:w-12"><Icon size={20} /></span><span className="min-w-0 flex-1"><strong className="block text-[13px] font-semibold text-navy sm:text-sm">Login {label}</strong><small className="mt-1 block text-xs leading-4 text-slate-500 sm:leading-5">{description}</small></span><ArrowRight className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-navy" size={18} /></Link>)}</div>
          <p className="mt-5 border-t border-slate-100 pt-4 text-center text-xs leading-5 text-slate-400 sm:mt-7 sm:pt-5">Akses terbatas bagi petugas resmi Pondok Pesantren Al-Jihad.</p>
        </>}
      </div>
      </div>
    </section>
  </main>;
}
