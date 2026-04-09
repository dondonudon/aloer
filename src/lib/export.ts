// Client-side export utilities for XLSX, CSV, and PDF.
// All functions run in the browser — no server round-trip needed since
// the data is already available in the calling component.

import * as XLSX from "xlsx";

// ─── XLSX / CSV ─────────────────────────────────────────────────────────────

/**
 * Exports an array of row objects to an XLSX file and triggers a browser
 * download. Column headers are taken from the keys of the first row.
 */
export function exportXlsx(
  rows: Record<string, unknown>[],
  filename: string,
): void {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Exports an array of row objects to a CSV file and triggers a browser
 * download.
 */
export function exportCsv(
  rows: Record<string, unknown>[],
  filename: string,
): void {
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

interface PdfColumn {
  /** Header label shown in the PDF */
  header: string;
  /** Key of the row object or accessor function */
  key: string;
  /** Optional cell alignment */
  align?: "left" | "center" | "right";
}

/**
 * Exports tabular data as a PDF file using jsPDF + AutoTable and triggers
 * a browser download.
 *
 * @param title  - Document title printed at the top of the page
 * @param columns - Column definitions ({ header, key, align? })
 * @param rows   - Data rows as plain objects
 * @param filename - Output filename (without extension)
 */
export async function exportPdf(
  title: string,
  columns: PdfColumn[],
  rows: Record<string, unknown>[],
  filename: string,
): Promise<void> {
  // Dynamic import keeps jspdf out of the initial bundle
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  // Title
  doc.setFontSize(14);
  doc.text(title, 40, 40);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString("id-ID")}`, 40, 56);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 70,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(row[c.key] ?? ""))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    columnStyles: Object.fromEntries(
      columns.map((c, i) => [i, { halign: c.align ?? "left" }]),
    ),
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`${filename}.pdf`);
}
