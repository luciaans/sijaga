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
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = 210;
    const left = 14;
    const right = pageWidth - 14;
    const today = format(new Date(), "d MMMM yyyy", { locale: id });

    doc.setTextColor(11, 37, 69);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PONDOK PESANTREN AL-JIHAD", pageWidth / 2, 18, { align: "center" });
    doc.setFontSize(12);
    doc.text("REKAPITULASI DATA PELANGGARAN SANTRI", pageWidth / 2, 26, { align: "center" });
    doc.setDrawColor(11, 37, 69);
    doc.setLineWidth(0.6);
    doc.line(left, 31, right, 31);
    doc.setLineWidth(0.2);
    doc.line(left + 24, 33, right - 24, 33);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(105, 119, 135);
    doc.text("DOKUMEN REKAPITULASI", pageWidth / 2, 38, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(50, 65, 82);
    const period = filters.from || filters.to ? `${filters.from ? formatDate(filters.from) : "Awal periode"} - ${filters.to ? formatDate(filters.to) : "Sekarang"}` : "Semua tanggal";
    autoTable(doc, {
      startY: 42,
      margin: { left, right: 14 },
      body: [
        ["Nama santri", filters.studentName || "Semua santri", "Kategori", filters.category ? categoryLabel(filters.category) : "Semua kategori"],
        ["Kelas", filters.studentClass || "Semua kelas", "Jumlah laporan", rows.length.toLocaleString("id-ID")],
        ["Periode", period, "Dicetak oleh", printedBy],
      ],
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8, cellPadding: 2.3, overflow: "linebreak", lineColor: [215, 224, 234], textColor: [38, 52, 70], lineWidth: 0.15 },
      columnStyles: { 0: { cellWidth: 27, fontStyle: "bold", fillColor: [243, 247, 251] }, 1: { cellWidth: 64 }, 2: { cellWidth: 27, fontStyle: "bold", fillColor: [243, 247, 251] }, 3: { cellWidth: "auto" } },
    });
    const reportStartY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 62) + 6;

    autoTable(doc, {
      startY: reportStartY,
      margin: { left, right: 14, bottom: 18 },
      head: [["No.", "Tanggal", "Nama santri", "Kelas", "Kategori", "Uraian pelanggaran", "Pelapor"]],
      body: rows.map((row, index) => [String(index + 1), formatDate(row.incident_date), row.student_name, row.student_class, categoryLabel(row.category), row.description, row.reporter?.full_name ?? "-" ]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 7.5, cellPadding: 2, overflow: "linebreak", valign: "top", lineColor: [215, 224, 234], textColor: [38, 52, 70], lineWidth: 0.15 },
      headStyles: { fillColor: [11, 37, 69], textColor: [255, 255, 255], fontStyle: "bold", halign: "left" },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 24 },
        2: { cellWidth: 29 },
        3: { cellWidth: 14 },
        4: { cellWidth: 22 },
        5: { cellWidth: "auto" },
        6: { cellWidth: 27 },
      },
      showHead: "everyPage",
      rowPageBreak: "auto",
      pageBreak: "auto",
    });

    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 65;
    let summaryY = finalY + 12;
    if (summaryY + 105 > 270) {
      doc.addPage();
      summaryY = 22;
    }

    doc.setDrawColor(215, 224, 234);
    doc.line(left, summaryY - 5, right, summaryY - 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(11, 37, 69);
    doc.text("Ringkasan evaluasi", left, summaryY + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 65, 82);
    doc.text(`Ringan: ${totals.ringan}     Sedang: ${totals.sedang}     Berat: ${totals.berat}     Total: ${rows.length}`, left, summaryY + 9);
    doc.text(`Dicetak pada ${today} oleh ${printedBy}`, left, summaryY + 17);

    const signatureY = summaryY + 29;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 65, 82);
    doc.text("Mengetahui", pageWidth / 2, signatureY, { align: "center" });
    doc.setDrawColor(120, 135, 150);
    doc.setLineWidth(0.35);
    doc.line(27, signatureY + 31, 83, signatureY + 31);
    doc.line(127, signatureY + 31, 183, signatureY + 31);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Kepala MTs Ponpes Al-Jihad", 55, signatureY + 37, { align: "center" });
    doc.text("Wali Kelas", 155, signatureY + 37, { align: "center" });
    doc.line(77, signatureY + 66, 133, signatureY + 66);
    doc.text("Pengasuh Ponpes Al-Jihad", 105, signatureY + 72, { align: "center" });

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(105, 119, 135);
      doc.text(`Tanggal cetak: ${today}`, left, 287);
      doc.text(`Halaman ${page} dari ${totalPages}`, right, 287, { align: "right" });
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
  return <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto"><button disabled={busy || rows.length === 0} onClick={print} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99] disabled:opacity-50 sm:w-auto sm:px-4"><Printer size={17} />Cetak</button><button disabled={busy || rows.length === 0} onClick={download} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy px-2.5 text-sm font-semibold text-white transition hover:bg-navy-soft active:scale-[0.99] disabled:opacity-50 sm:w-auto sm:px-4"><Download size={17} />Download PDF</button></div>;
}
