import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import SVGtoPDF from "svg-to-pdfkit";

export type ContractPdfItem = {
  name: string;
  quantity: number;
  monthlyValue: number;
};

export type ContractPdfInput = {
  id: string;
  version: number;
  hash: string;
  generatedAt: string;
  companyName: string;
  clientName: string;
  clientDocument: string;
  productName: string;
  plan: string;
  status: string;
  monthlyValue: number;
  implementationValue: number;
  startsAt: string;
  endsAt: string;
  signerName: string;
  witnessName: string;
  items: ContractPdfItem[];
  contractText: string;
};

function logoSvg() {
  const candidates = [
    join(process.cwd(), "public", "automy-logo-horizontal.svg"),
    join(process.cwd(), ".output", "public", "automy-logo-horizontal.svg"),
  ];
  const path = candidates.find((candidate) => existsSync(candidate));
  return path ? readFileSync(path, "utf8") : null;
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(value);
}

function formatDate(value: string) {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
}

function addCommercialBox(doc: PDFKit.PDFDocument, input: ContractPdfInput) {
  const top = doc.y + 14;
  const left = 56;
  const width = doc.page.width - 112;
  const rows: Array<[string, string]> = [
    ["Valor mensal", formatCurrency(input.monthlyValue)],
    ["Implantação", formatCurrency(input.implementationValue)],
    ["Início", formatDate(input.startsAt)],
    ["Vencimento", formatDate(input.endsAt)],
  ];

  doc.roundedRect(left, top, width, 88, 8).fillAndStroke("#F8FAFC", "#E2E8F0");
  rows.forEach(([label, value], index) => {
    const x = left + 18 + (index % 2) * 250;
    const y = top + 18 + Math.floor(index / 2) * 34;
    doc.font("Helvetica").fontSize(8).fillColor("#64748B").text(label, x, y);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#0F172A")
      .text(value, x, y + 12);
  });
  doc.y = top + 108;
}

function addItems(doc: PDFKit.PDFDocument, input: ContractPdfInput) {
  if (!input.items.length) return;

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0F172A").text("Itens contratados");
  doc.moveDown(0.4);
  input.items.forEach((item) => {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#0F172A")
      .text(`${item.quantity}x ${item.name} - ${formatCurrency(item.monthlyValue)}/mês`, {
        lineGap: 2,
      });
  });
  doc.moveDown();
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
    try {
      SVGtoPDF(doc, svg, 56, 42, { width: 128, assumePt: true });
    } catch {
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#0F172A").text("Automy", 56, 46);
    }
  } else {
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#0F172A").text("Automy", 56, 46);
  }

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#64748B")
    .text("Contrato de prestação de serviços", 330, 44, { align: "right" })
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
    .text(`Empresa: ${input.companyName}`, 56, 144)
    .text(`Contratante: ${input.clientName}`)
    .text(`Documento: ${input.clientDocument || "Não informado"}`)
    .text(`Produto: ${input.productName || "Não informado"}`)
    .text(`Status: ${input.status}`)
    .text(`Identificador: ${input.id}`)
    .text(`Versão: ${input.version}`)
    .text(`Hash: ${input.hash}`);

  addCommercialBox(doc, input);
  addItems(doc, input);

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0F172A").text("Cláusulas");
  doc.moveDown(0.4);
  doc.font("Helvetica").fontSize(10).fillColor("#0F172A").text(input.contractText, {
    align: "left",
    lineGap: 4,
  });

  doc.moveDown(2);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#64748B")
    .text(`Assinante: ${input.signerName || "Não informado"}`)
    .text(`Testemunha: ${input.witnessName || "Não informado"}`);

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    addFooter(doc, input);
  }

  doc.end();
  return finished;
}
