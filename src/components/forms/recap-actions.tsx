"use client";

import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Violation } from "@/types/database";

type RecapRow = Pick<Violation, "student_name" | "student_class" | "category" | "description" | "incident_date"> & { reporter: { full_name: string } | null };
type Filters = { studentName: string; studentClass: string; category: string; from: string; to: string };
const categoryLabel = (value: string) => value.charAt(0).toLocaleUpperCase("id-ID") + value.slice(1);
const formatDate = (value: string) => format(parseISO(value), "d MMMM yyyy", { locale: id });
const slug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("id-ID").trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "semua";

export function RecapActions({ rows, filters, printedBy }: { rows: RecapRow[]; filters: Filters; printedBy: string }) {
  const [busy, setBusy] = useState(false);
  const totals = rows.reduce((acc, row) => { acc[row.category] += 1; return acc; }, { ringan: 0, sedang: 0, berat: 0 });
  const filterName = filters.studentName ? slug(filters.studentName) : filters.studentClass ? `kelas-${slug(filters.studentClass)}` : filters.category ? slug(filters.category) : filters.from || filters.to ? `periode-${filters.from || "awal"}-${filters.to || "akhir"}` : "semua";
  const filename = `rekap-pelanggaran-${filterName}-${new Date().toLocaleDateString("sv-SE")}.pdf`;

  function generate() {
    if (rows.length === 0) { toast.error("Tidak ada data untuk dicetak."); return null; }
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setTextColor(11, 37, 69); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
    doc.text("PONDOK PESANTREN AL-JIHAD", 148.5, 17, { align: "center" });
    doc.setFontSize(12); doc.text("REKAPITULASI DATA PELANGGARAN SANTRI", 148.5, 25, { align: "center" });
    doc.setDrawColor(11, 37, 69); doc.setLineWidth(0.5); doc.line(14, 30, 283, 30);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(50, 65, 82);
    const period = filters.from || filters.to ? `${filters.from ? formatDate(filters.from) : "Awal"} – ${filters.to ? formatDate(filters.to) : "Sekarang"}` : "Semua tanggal";
    doc.text(`Nama santri: ${filters.studentName || "Semua Santri"}`, 14, 39);
    doc.text(`Kelas: ${filters.studentClass || "Semua kelas"}`, 14, 45);
    doc.text(`Kategori: ${filters.category ? categoryLabel(filters.category) : "Semua kategori"}`, 150, 39);
    doc.text(`Total pelanggaran: ${rows.length.toLocaleString("id-ID")}`, 150, 45);
    doc.text(`Periode laporan: ${period}`, 14, 51);
    autoTable(doc, {
      startY: 56,
      head: [["No", "Tanggal kejadian", "Jenis pelanggaran", "Deskripsi", "Ustadz/Ustadzah pelapor"]],
      body: rows.map((row, index) => [String(index + 1), formatDate(row.incident_date), categoryLabel(row.category), row.description, row.reporter?.full_name ?? "—"]),
      theme: "grid", margin: { left: 14, right: 14, bottom: 22 },
      styles: { font: "helvetica", fontSize: 8, cellPadding: 2.5, overflow: "linebreak", valign: "top", lineColor: [220, 229, 239], textColor: [38, 52, 70] },
      headStyles: { fillColor: [11, 37, 69], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 12, halign: "center" }, 1: { cellWidth: 32 }, 2: { cellWidth: 31 }, 3: { cellWidth: "auto" }, 4: { cellWidth: 42 } },
      showHead: "everyPage", rowPageBreak: "avoid", pageBreak: "auto",
    });
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
    let y = finalY + 11;
    if (y > 150) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(11, 37, 69);
    doc.text("Ringkasan evaluasi", 14, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(50, 65, 82);
    doc.text(`Ringan: ${totals.ringan}     Sedang: ${totals.sedang}     Berat: ${totals.berat}     Total: ${rows.length}`, 14, y + 6);
    y += 20;
    if (y > 170) { doc.addPage(); y = 25; }
    doc.text(`Dicetak pada ${format(new Date(), "d MMMM yyyy", { locale: id })} oleh ${printedBy}`, 14, y);
    doc.setDrawColor(145, 157, 170); doc.line(208, y + 18, 270, y + 18);
    doc.text("Pengurus / Pihak Pondok", 239, y + 23, { align: "center" });
    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(105, 119, 135);
      doc.text(`Tanggal cetak: ${format(new Date(), "d MMMM yyyy", { locale: id })}`, 14, 202);
      doc.text(`Halaman ${page} dari ${totalPages}`, 282, 202, { align: "right" });
    }
    return doc;
  }

  function download() {
    const doc = generate();
    if (!doc) return;
    setBusy(true); doc.save(filename); setBusy(false); toast.success("PDF rekap berhasil diunduh.");
  }
  function print() {
    const doc = generate();
    if (!doc) return;
    setBusy(true); doc.autoPrint(); window.open(doc.output("bloburl"), "_blank", "noopener,noreferrer"); setBusy(false);
  }
  return <div className="flex flex-wrap gap-2"><button disabled={busy || rows.length === 0} onClick={print} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Printer size={17} />Cetak</button><button disabled={busy || rows.length === 0} onClick={download} className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-soft disabled:opacity-50"><Download size={17} />Download PDF</button></div>;
}
