export default function DashboardLoading() {
  return <div aria-label="Memuat halaman" className="animate-pulse space-y-6"><div className="h-8 w-64 rounded-lg bg-slate-200" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-32 rounded-2xl bg-white shadow-sm" />)}</div><div className="grid gap-5 xl:grid-cols-2"><div className="h-80 rounded-2xl bg-white shadow-sm" /><div className="h-80 rounded-2xl bg-white shadow-sm" /></div><div className="h-72 rounded-2xl bg-white shadow-sm" /></div>;
}
