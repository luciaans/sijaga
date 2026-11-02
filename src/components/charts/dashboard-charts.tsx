"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors: Record<string, string> = { ringan: "#5b9bd5", sedang: "#e5a52b", berat: "#d95252" };
const labels: Record<string, string> = { ringan: "Ringan", sedang: "Sedang", berat: "Berat" };
export function CategoryChart({ values }: { values: Record<string, number> }) {
  const data = ["ringan", "sedang", "berat"].map((name) => ({ name: labels[name], value: Number(values[name] ?? 0), color: colors[name] }));
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  return <div>
    <div className="relative h-48 w-full sm:h-64"><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="54%" outerRadius="76%" paddingAngle={4}>{data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl font-bold text-navy">{total.toLocaleString("id-ID")}</strong><span className="text-[11px] text-slate-500">Laporan</span></div></div>
    <div className="mt-2 grid grid-cols-3 gap-1.5">{data.map((entry) => <div key={entry.name} className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-1.5 py-2 text-[11px] text-slate-600 sm:text-xs"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} /><span>{entry.name}</span><strong className="text-navy">{entry.value}</strong></div>)}</div>
  </div>;
}
export function MonthlyChart({ values }: { values: { month: string; total: number }[] }) {
  const data = values.map((entry) => ({ ...entry, month: new Date(`${entry.month}-01T00:00:00`).toLocaleDateString("id-ID", { month: "short", year: "2-digit" }) }));
  return <div className="h-52 w-full sm:h-64"><ResponsiveContainer><BarChart data={data} margin={{ top: 5, right: 4, left: -24, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7edf4" /><XAxis dataKey="month" interval="preserveStartEnd" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#718096" }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#718096" }} width={28} /><Tooltip /><Bar dataKey="total" name="Laporan" fill="#0b2545" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}
export function ReporterChart({ values }: { values: { name: string; total: number }[] }) {
  return <div className="h-52 w-full sm:h-64"><ResponsiveContainer><BarChart data={values} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7edf4" /><XAxis type="number" allowDecimals={false} hide /><YAxis type="category" dataKey="name" width={82} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="total" name="Laporan" fill="#5b9bd5" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div>;
}
