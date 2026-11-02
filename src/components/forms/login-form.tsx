"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/actions/auth";

export function LoginForm({ expectedRole }: { expectedRole: "admin" | "ustaz" }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { expectedRole, rememberMe: false } });

  async function submit(input: LoginInput) {
    setBusy(true);
    const result = await loginAction({ ...input, expectedRole });
    setBusy(false);
    if (!result.success) toast.error(result.error);
  }

  return <form onSubmit={handleSubmit(submit)} className="space-y-4 sm:space-y-5">
    <div><label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700 sm:mb-2">Username</label><input id="username" autoComplete="username" {...register("username")} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/10 sm:py-3" placeholder="Masukkan username" />{errors.username && <p className="mt-1.5 text-xs text-red-600">{errors.username.message}</p>}</div>
    <div><label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 sm:mb-2">Kata sandi</label><div className="relative"><input id="password" type={visible ? "text" : "password"} autoComplete="current-password" {...register("password")} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/10 sm:py-3" placeholder="Masukkan kata sandi" /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-navy">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
      <label className="mt-1.5 flex min-h-5 cursor-pointer items-center gap-1.5 text-xs text-slate-500">
        <input type="checkbox" {...register("rememberMe")} className="h-3 w-3 rounded border-slate-300 accent-navy" />
        <span>Remember me</span>
      </label>
    </div>
    <button disabled={busy} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white shadow-md shadow-navy/15 transition hover:bg-navy-soft disabled:cursor-wait disabled:opacity-70 sm:py-3.5">{busy && <LoaderCircle className="animate-spin" size={18} />}Login</button>
  </form>;
}
