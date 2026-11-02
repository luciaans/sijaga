import { Logo } from "@/components/brand/logo";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_1fr]">
    <section className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-36 -top-28 h-[28rem] w-[28rem] rounded-full border border-white/10" />
      <div className="absolute -right-20 -top-12 h-[22rem] w-[22rem] rounded-full border border-white/10" />
      <Logo light />
      <div className="relative max-w-xl pb-12">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">Pondok Pesantren Al-Jihad</p>
        <h1 className="mb-5 text-4xl font-bold leading-tight">Menjaga kedisiplinan, membimbing masa depan.</h1>
        <p className="max-w-lg text-base leading-7 text-slate-300">Sistem Informasi Jejak dan Administrasi Pelanggaran Santri untuk pencatatan yang tertib, terukur, dan bertanggung jawab.</p>
      </div>
      <p className="text-xs text-slate-400">SIJAGA · Sistem Informasi Kedisiplinan Santri</p>
    </section>
    <section className="flex items-center justify-center px-5 py-12 sm:px-10">
      <div className="w-full max-w-md">
        <div className="mb-10 lg:hidden"><Logo /></div>
        <p className="mb-2 text-sm font-semibold text-accent">Selamat datang</p>
        <h2 className="mb-2 text-3xl font-bold text-navy">Masuk ke SIJAGA</h2>
        <p className="mb-8 text-sm leading-6 text-slate-500">Masuk dengan username dan kata sandi yang diberikan pengelola.</p>
        <LoginForm />
        <p className="mt-8 text-center text-xs leading-5 text-slate-400">Akses hanya untuk admin dan ustaz Pondok Pesantren Al-Jihad.</p>
      </div>
    </section>
  </main>;
}
