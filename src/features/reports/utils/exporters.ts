import type { ReportFormat, ReportPayload } from "@/features/reports/types";
import {
  formatDateTime,
  formatNumber,
  resolveLocale,
  type RegionalFormatPreferences,
} from "@/shared/utils/regional-formatters";

type ExportOptions = {
  preferences?: RegionalFormatPreferences | null;
};

const mimeByFormat: Record<ReportFormat, string> = {
  CSV: "text/csv;charset=utf-8",
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  PDF: "application/pdf",
};

function headersForRows(rows: Array<Record<string, unknown>>) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return headers.length > 0 ? headers : ["sem_registros"];
}

function isIsoDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}(T|\s|$)/.test(value);
}

function formatValue(value: unknown, options: ExportOptions = {}) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return formatDateTime(value, options.preferences);
  if (typeof value === "number") return formatNumber(value, options.preferences);
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "string" && isIsoDateString(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : formatDateTime(date, options.preferences);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildCsv(report: ReportPayload, options: ExportOptions = {}) {
  const headers = headersForRows(report.rows);
  const rows =
    report.rows.length > 0
      ? report.rows.map((row) =>
          headers.map((header) => csvEscape(formatValue(row[header], options))).join(","),
        )
      : [csvEscape("Sem registros")];

  return `${headers.join(",")}\n${rows.join("\n")}\n`;
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index: number) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function buildWorksheet(report: ReportPayload, options: ExportOptions = {}) {
  const headers = headersForRows(report.rows);
  const body =
    report.rows.length > 0
      ? report.rows.map((row) => headers.map((header) => formatValue(row[header], options)))
      : [["Sem registros"]];
  const table = [headers, ...body];
  const rows = table
    .map((row, rowIndex) => {
      const cells = row
        .map(
          (cell, cellIndex) =>
            `<c r="${columnName(cellIndex)}${rowIndex + 1}" t="inlineStr"><is><t>${xmlEscape(
              cell,
            )}</t></is></c>`,
        )
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rows}</sheetData>
</worksheet>`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;
}

function relsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function workbookXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Relatorio" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;
}

function workbookRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;
}

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  crcTable[index] = crc >>> 0;
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  data.forEach((byte) => {
    crc = (crc >>> 8) ^ (crcTable[(crc ^ byte) & 0xff] ?? 0);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value: number) {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function uint32(value: number) {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
}

function encode(value: string) {
  return new TextEncoder().encode(value);
}

function blobPart(part: Uint8Array) {
  return part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) as ArrayBuffer;
}

function buildZip(files: Array<{ name: string; content: string }>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const name = encode(file.name);
    const data = encode(file.content);
    const crc = crc32(data);
    const localHeader = new Uint8Array([
      ...uint32(0x04034b50),
      ...uint16(20),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(crc),
      ...uint32(data.length),
      ...uint32(data.length),
      ...uint16(name.length),
      ...uint16(0),
      ...name,
    ]);
    const centralHeader = new Uint8Array([
      ...uint32(0x02014b50),
      ...uint16(20),
      ...uint16(20),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(crc),
      ...uint32(data.length),
      ...uint32(data.length),
      ...uint16(name.length),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(0),
      ...uint32(offset),
      ...name,
    ]);

    localParts.push(localHeader, data);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  });

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end = new Uint8Array([
    ...uint32(0x06054b50),
    ...uint16(0),
    ...uint16(0),
    ...uint16(files.length),
    ...uint16(files.length),
    ...uint32(centralSize),
    ...uint32(offset),
    ...uint16(0),
  ]);

  return new Blob([...localParts, ...centralParts, end].map(blobPart), { type: mimeByFormat.XLSX });
}

function buildXlsx(report: ReportPayload, options: ExportOptions = {}) {
  return buildZip([
    { name: "[Content_Types].xml", content: contentTypesXml() },
    { name: "_rels/.rels", content: relsXml() },
    { name: "xl/workbook.xml", content: workbookXml() },
    { name: "xl/_rels/workbook.xml.rels", content: workbookRelsXml() },
    { name: "xl/worksheets/sheet1.xml", content: buildWorksheet(report, options) },
  ]);
}

function pdfSafe(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildPdf(report: ReportPayload, options: ExportOptions = {}) {
  const locale = resolveLocale(options.preferences);
  const headers = headersForRows(report.rows).slice(0, 6);
  const rows =
    report.rows.length > 0
      ? report.rows
          .slice(0, 60)
          .map((row) => headers.map((header) => formatValue(row[header], options)))
      : [["Sem registros"]];
  const lines = [
    report.title,
    `Gerado em ${formatDateTime(report.generatedAt, options.preferences)}`,
    `Periodo: ${report.period}`,
    `Locale: ${locale}`,
    "",
    headers.join(" | "),
    ...rows.map((row) => row.join(" | ")),
  ].map((line) => pdfSafe(line).slice(0, 118));

  const text = lines
    .map((line, index) => `BT /F1 9 Tf 40 ${780 - index * 14} Td (${line}) Tj ET`)
    .join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${text.length} >> stream\n${text}\nendstream endobj`,
  ];

  let body = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(body.length);
    body += `${object}\n`;
  });
  const xrefOffset = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([body], { type: mimeByFormat.PDF });
}

export function reportFilename(report: ReportPayload, format: ReportFormat) {
  const extension = format.toLowerCase();
  const date = new Date(report.generatedAt).toISOString().slice(0, 10);
  return `automy-${report.kind}-${report.period}-${date}.${extension}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadReport(
  report: ReportPayload,
  format: ReportFormat,
  options: ExportOptions = {},
) {
  const blob =
    format === "CSV"
      ? new Blob([buildCsv(report, options)], { type: mimeByFormat.CSV })
      : format === "XLSX"
        ? buildXlsx(report, options)
        : buildPdf(report, options);

  downloadBlob(blob, reportFilename(report, format));
}
