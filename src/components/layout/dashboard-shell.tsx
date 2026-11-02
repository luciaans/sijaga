"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpenCheck, ChevronDown, ChevronLeft, ClipboardList, Eye, FileText, GraduationCap, LayoutDashboard, LogOut, Menu, UserRound, Users, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { logoutAction } from "@/actions/auth";
import type { Profile } from "@/types/database";

const menu = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "ustaz"] },
  { href: "/santri", label: "Daftar Santri", icon: GraduationCap, roles: ["admin", "ustaz"] },
  { href: "/pelanggaran", label: "Data Pelanggaran", icon: ClipboardList, roles: ["admin", "ustaz"] },
  { href: "/laporan", label: "Seluruh Laporan", icon: Eye, roles: ["admin", "ustaz"] },
  { href: "/rekap", label: "Rekap & Cetak", icon: FileText, roles: ["admin", "ustaz"] },
  { href: "/admin/ustaz", label: "Manajemen Ustadz/Ustadzah", icon: Users, roles: ["admin"] },
  { href: "/admin/audit-log", label: "Audit Aktivitas", icon: BookOpenCheck, roles: ["admin"] },
];

export function DashboardShell({ profile, children, title }: { profile: Profile; children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = menu.filter((item) => item.roles.includes(profile.role));
  const initials = profile.full_name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const profileRoleLabel = profile.role === "admin" ? "Admin" : profile.educator_type === "ustadzah" ? "Ustadzah" : "Ustadz";
  const nav = <><div className="mb-9 flex items-center justify-between"><Logo /><button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 lg:hidden" aria-label="Tutup menu"><X /></button></div><nav className="space-y-1.5" aria-label="Navigasi utama">{links.map(({ href, label, icon: Icon }) => { const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href); const menuLabel = href === "/pelanggaran" && profile.role === "ustaz" ? "Laporan Saya" : label; return <Link onClick={() => setOpen(false)} key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${active ? "bg-navy text-white shadow-md shadow-navy/10" : "text-slate-600 hover:bg-accent-light hover:text-navy"}`}><Icon size={18} />{menuLabel}{active && <ChevronLeft className="ml-auto rotate-180" size={15} />}</Link>; })}</nav></>;
  return <div className="min-h-screen lg:flex"><aside className="hidden w-[270px] shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:fixed lg:inset-y-0 lg:flex">{nav}</aside>{open && <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)}><aside onClick={(event) => event.stopPropagation()} className="flex h-full w-[min(290px,85vw)] flex-col bg-white p-5">{nav}</aside></div>}<div className="min-w-0 flex-1 lg:ml-[270px]"><header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur sm:px-7"><div className="flex min-w-0 items-center gap-2 sm:gap-3"><button onClick={() => setOpen(true)} aria-label="Buka menu" className="shrink-0 rounded-lg p-2 text-navy hover:bg-slate-100 lg:hidden"><Menu /></button><div className="min-w-0"><p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-[11px]">Pondok Pesantren Al-Jihad</p><h1 className="truncate text-base font-bold text-navy sm:text-lg">{title}</h1></div></div><details className="group relative shrink-0">
  <summary aria-label="Menu akun" className="group flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-1.5 py-1 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15 sm:gap-2.5 sm:pl-2 [&::-webkit-details-marker]:hidden">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white ring-2 ring-white sm:h-10 sm:w-10 sm:text-sm">{profile.role === "admin" ? initials : <UserRound size={18} strokeWidth={2.2} aria-hidden="true" />}</span>
    <span className="hidden min-w-0 items-center gap-2 text-left sm:flex"><small className="shrink-0 text-sm font-medium leading-5 text-slate-500">{profileRoleLabel}</small><strong className="max-w-36 truncate text-sm font-semibold leading-5 text-slate-800">{profile.full_name}</strong></span>
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-open:rotate-180 sm:bg-transparent"><ChevronDown size={15} /></span>
  </summary>
  <div className="absolute right-0 z-50 mt-2 w-64 max-w-[calc(100vw_-_1.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
    <div className="border-b border-slate-100 px-4 py-3 sm:hidden"><p className="text-xs font-medium text-slate-500">{profileRoleLabel}</p><p className="mt-0.5 truncate text-sm font-semibold text-navy">{profile.full_name}</p></div>
    <div className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">Username</p><p className="mt-1 text-sm font-semibold text-navy">@{profile.username}</p></div>
    <div className="border-t border-slate-100 p-2"><form action={logoutAction}><button className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-red-600 transition hover:bg-red-50"><LogOut size={17} />Keluar</button></form></div>
  </div>
</details></header><main className="mx-auto max-w-[1500px] p-3 sm:p-7">{children}</main></div></div>;
}
