"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/actions/auth";

export function LoginForm() {
  const [role, setRole] = useState<"admin" | "ustaz">("admin");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { expectedRole: role } });

  async function submit(input: LoginInput) {
    setBusy(true);
    const result = await loginAction({ ...input, expectedRole: role });
    setBusy(false);
    if (!result.success) toast.error(result.error);
  }

  return <form onSubmit={handleSubmit(submit)} className="space-y-5">
    <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Jenis akun">
      {(["admin", "ustaz"] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={role === value} onClick={() => setRole(value)} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${role === value ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-navy"}`}>
        {value === "admin" ? <ShieldCheck size={17} /> : <UserRound size={17} />}{value === "admin" ? "Login Admin" : "Login Ustadz/Ustadzah"}
      </button>)}
    </div>
    <div><label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-700">Username</label><input id="username" autoComplete="username" {...register("username")} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/10" placeholder="Masukkan username" />{errors.username && <p className="mt-1.5 text-xs text-red-600">{errors.username.message}</p>}</div>
    <div><label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Kata sandi</label><div className="relative"><input id="password" type={visible ? "text" : "password"} autoComplete="current-password" {...register("password")} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/10" placeholder="Masukkan kata sandi" /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-navy">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}</div>
    <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-navy/15 transition hover:bg-navy-soft disabled:cursor-wait disabled:opacity-70">{busy && <LoaderCircle className="animate-spin" size={18} />}Masuk sebagai {role === "admin" ? "Admin" : "Ustadz/Ustadzah"}</button>
  </form>;
}
