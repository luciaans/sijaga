"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors: Record<string, string> = { ringan: "#5b9bd5", sedang: "#e5a52b", berat: "#d95252" };
const labels: Record<string, string> = { ringan: "Ringan", sedang: "Sedang", berat: "Berat" };
export function CategoryChart({ values }: { values: Record<string, number> }) {
  const data = ["ringan", "sedang", "berat"].map((name) => ({ name: labels[name], value: Number(values[name] ?? 0), color: colors[name] }));
  return <div className="h-64 w-full"><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={4}>{data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" /></PieChart></ResponsiveContainer></div>;
}
export function MonthlyChart({ values }: { values: { month: string; total: number }[] }) {
  const data = values.map((entry) => ({ ...entry, month: new Date(`${entry.month}-01T00:00:00`).toLocaleDateString("id-ID", { month: "short", year: "2-digit" }) }));
  return <div className="h-64 w-full"><ResponsiveContainer><BarChart data={data} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7edf4" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#718096" }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#718096" }} /><Tooltip /><Bar dataKey="total" name="Laporan" fill="#0b2545" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}
export function ReporterChart({ values }: { values: { name: string; total: number }[] }) {
  return <div className="h-64 w-full"><ResponsiveContainer><BarChart data={values} layout="vertical" margin={{ top: 0, right: 10, left: 5, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7edf4" /><XAxis type="number" allowDecimals={false} hide /><YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="total" name="Laporan" fill="#5b9bd5" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div>;
}
