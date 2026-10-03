import * as XLSX from "xlsx";
import { PDFDocument, StandardFonts } from "pdf-lib";

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"','""')}"`;
  return [headers.map(esc).join(","), ...rows.map(r => headers.map(h => esc(r[h])).join(","))].join("\n");
}

export function toXlsx(rows: Record<string, unknown>[], sheetName = "Relatório") {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0,31));
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;\n  return Uint8Array.from(buffer).buffer;
}

export async function toPdf(title: string, rows: Record<string, unknown>[]) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([842,595]);
  let y = 560;
  page.drawText(title, { x: 36, y, size: 16, font: bold }); y -= 26;
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const line = (text: string, isHeader=false) => {
    if (y < 40) { page = doc.addPage([842,595]); y=560; }
    page.drawText(text.slice(0,150), { x:36,y,size:isHeader?8:7,font:isHeader?bold:font }); y-=12;
  };
  if (headers.length) line(headers.join(" | "), true);
  for (const row of rows) line(headers.map(h=>String(row[h]??"")).join(" | "));
  return Uint8Array.from(await doc.save()).buffer;
}
