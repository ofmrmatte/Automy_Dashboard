import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";

export type ContractPdfInput = {
  id: string;
  version: number;
  hash: string;
  generatedAt: string;
  clientName: string;
  productName: string;
  plan: string;
  status: string;
  contractText: string;
};

function logoSvg() {
  const path = join(process.cwd(), "public", "automy-logo-horizontal.svg");
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

function addFooter(doc: PDFKit.PDFDocument, input: ContractPdfInput) {
  const bottom = doc.page.height - 42;
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#64748B")
    .text(`Pagina ${doc.bufferedPageRange().count || 1}`, 50, bottom, { continued: true })
    .text(`Versao ${input.version}`, { continued: true, align: "center" })
    .text(`Hash ${input.hash.slice(0, 16)}`, { align: "right" });
  doc
    .moveTo(50, bottom - 10)
    .lineTo(doc.page.width - 50, bottom - 10)
    .strokeColor("#E2E8F0")
    .lineWidth(1)
    .stroke();
}

export async function generateContractPdf(input: ContractPdfInput) {
  const doc = new PDFDocument({
    autoFirstPage: false,
    bufferPages: true,
    margins: { top: 68, right: 56, bottom: 72, left: 56 },
    size: "A4",
  });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.addPage();
  const svg = logoSvg();
  if (svg) {
    SVGtoPDF(doc, svg, 56, 42, { width: 128, assumePt: true });
  } else {
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#0F172A").text("Automy", 56, 46);
  }

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#64748B")
    .text("Contrato de prestacao de servicos", 330, 44, { align: "right" })
    .text(`Gerado em ${new Date(input.generatedAt).toLocaleString("pt-BR")}`, {
      align: "right",
    });

  doc
    .moveTo(56, 92)
    .lineTo(doc.page.width - 56, 92)
    .strokeColor("#2563EB")
    .lineWidth(2)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#0F172A")
    .text(input.plan || "Contrato Automy", 56, 116);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#64748B")
    .text(`Contratante: ${input.clientName}`, 56, 144)
    .text(`Produto: ${input.productName}`)
    .text(`Status: ${input.status}`)
    .text(`Identificador: ${input.id}`)
    .text(`Versao: ${input.version}`)
    .text(`Hash: ${input.hash}`);

  doc.moveDown(1.5);
  doc.font("Helvetica").fontSize(10).fillColor("#0F172A").text(input.contractText, {
    align: "left",
    lineGap: 4,
  });

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    addFooter(doc, input);
  }

  doc.end();
  return finished;
}
