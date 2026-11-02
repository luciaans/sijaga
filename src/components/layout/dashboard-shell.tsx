"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpenCheck, ChevronLeft, ClipboardList, FileText, LayoutDashboard, Menu, ShieldCheck, Users, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { logoutAction } from "@/actions/auth";
import type { Profile } from "@/types/database";

const menu = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "ustaz"] },
  { href: "/pelanggaran", label: "Data Pelanggaran", icon: ClipboardList, roles: ["admin", "ustaz"] },
  { href: "/rekap", label: "Rekap & Cetak", icon: FileText, roles: ["admin", "ustaz"] },
  { href: "/admin/ustaz", label: "Manajemen Ustaz", icon: Users, roles: ["admin"] },
  { href: "/admin/audit-log", label: "Audit Aktivitas", icon: BookOpenCheck, roles: ["admin"] },
];

export function DashboardShell({ profile, children, title }: { profile: Profile; children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = menu.filter((item) => item.roles.includes(profile.role));
  const initials = profile.full_name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const nav = <><div className="mb-9 flex items-center justify-between"><Logo /><button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 lg:hidden" aria-label="Tutup menu"><X /></button></div><nav className="space-y-1.5" aria-label="Navigasi utama">{links.map(({ href, label, icon: Icon }) => { const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href); return <Link onClick={() => setOpen(false)} key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${active ? "bg-navy text-white shadow-md shadow-navy/10" : "text-slate-600 hover:bg-accent-light hover:text-navy"}`}><Icon size={18} />{label}{active && <ChevronLeft className="ml-auto rotate-180" size={15} />}</Link>; })}</nav><div className="mt-auto rounded-2xl bg-accent-light p-4"><div className="mb-2 flex items-center gap-2 text-navy"><ShieldCheck size={18} /><span className="text-xs font-semibold">SIJAGA Al-Jihad</span></div><p className="text-xs leading-5 text-slate-600">Pencatatan kedisiplinan santri yang tertib dan bertanggung jawab.</p></div></>;
  return <div className="min-h-screen lg:flex"><aside className="hidden w-[270px] shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:fixed lg:inset-y-0 lg:flex">{nav}</aside>{open && <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)}><aside onClick={(event) => event.stopPropagation()} className="flex h-full w-[290px] flex-col bg-white p-5">{nav}</aside></div>}<div className="min-w-0 flex-1 lg:ml-[270px]"><header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7"><div className="flex items-center gap-3"><button onClick={() => setOpen(true)} aria-label="Buka menu" className="rounded-lg p-2 text-navy hover:bg-slate-100 lg:hidden"><Menu /></button><div><p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Pondok Pesantren Al-Jihad</p><h1 className="text-lg font-bold text-navy">{title}</h1></div></div><details className="group relative"><summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-50"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{initials}</span><span className="hidden text-left sm:block"><strong className="block text-sm font-semibold text-slate-800">{profile.full_name}</strong><small className="text-xs capitalize text-slate-500">{profile.role}</small></span></summary><div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><div className="px-3 py-2"><p className="text-sm font-semibold text-navy">{profile.username}</p><p className="text-xs capitalize text-slate-500">{profile.role}</p></div><form action={logoutAction}><button className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Keluar</button></form></div></details></header><main className="mx-auto max-w-[1500px] p-4 sm:p-7">{children}</main></div></div>;
}
