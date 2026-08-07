import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import SVGtoPDF from "svg-to-pdfkit";
import { formatCpfCnpj } from "@/shared/utils/document";

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
  description?: string | null;
  scope?: string | null;
  deliverables?: string | null;
  includedUsers?: number;
  hostedByAutomy?: boolean;
  customUrlEnabled?: boolean;
  implementationDays?: number;
  databaseCost?: number;
  databaseQuantity?: number;
  basePriceReference?: number;
  discountPercent?: number;
  paymentMethod?: string;
  installmentsCount?: number;
  installmentDueDays?: number[];
  paymentTermsDescription?: string;
  loyaltyMonths?: number;
  signerDocument?: string;
  signerEmail?: string;
  signerPhone?: string;
  automyRepresentative?: string;
  witnessDocument?: string;
  monthlyValue: number;
  implementationValue: number;
  startsAt: string;
  endsAt: string;
  signerName: string;
  witnessName: string;
  items: ContractPdfItem[];
  contractText: string;
  brandAssets?: ContractPdfBrandAssets;
};

type SvgAssetSource = "filesystem" | "embedded";

export type ContractPdfBrandAssets = {
  logoHorizontal: string;
  logoHorizontalSource: SvgAssetSource;
  symbol: string;
  symbolSource: SvgAssetSource;
};

const BRAND = {
  primary: "#2563EB",
  secondary: "#0F172A",
  accent: "#14B8A6",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  muted: "#64748B",
  body: "#111827",
  subtle: "#EEF4FF",
};

const PAGE = {
  marginLeft: 56,
  marginRight: 56,
  firstTop: 42,
  top: 58,
  bottom: 78,
  footerY: 770,
  width: 595.28,
  height: 841.89,
};

const CONTENT_WIDTH = PAGE.width - PAGE.marginLeft - PAGE.marginRight;
const SHORT_ID_LENGTH = 8;

const EMBEDDED_LOGO_HORIZONTAL = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="120" viewBox="20 34 540 104" role="img" aria-labelledby="title desc">
  <title id="title">Automy logo horizontal</title>
  <desc id="desc">Identidade vetorial da Automy com o slogan Tecnologia que simplifica operações.</desc>
  <defs>
    <linearGradient id="horizontal-blue" x1="48" y1="198" x2="132" y2="46" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#2563EB"/>
      <stop offset="1" stop-color="#60A5FA"/>
    </linearGradient>
    <linearGradient id="horizontal-teal" x1="104" y1="126" x2="170" y2="156" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#2563EB"/>
      <stop offset="0.48" stop-color="#14B8A6"/>
      <stop offset="1" stop-color="#5EEAD4"/>
    </linearGradient>
  </defs>
  <g id="logo-horizontal">
    <g transform="translate(28 22) scale(0.58)">
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M54 190 C70 150 88 98 110 52" stroke="url(#horizontal-blue)" stroke-width="30"/>
        <path d="M121 52 C142 99 162 150 180 190" stroke="url(#horizontal-blue)" stroke-width="30"/>
        <path d="M117 122 C128 122 140 122 151 122" stroke="#FFFFFF" stroke-width="30" opacity="0.98"/>
        <path d="M104 126 C124 135 147 146 170 156" stroke="url(#horizontal-teal)" stroke-width="26"/>
      </g>
    </g>
    <text x="166" y="93" fill="#0F172A" font-family="Geist, Inter, Arial, sans-serif" font-size="62" font-weight="700" letter-spacing="-0.4">Automy</text>
    <text x="169" y="128" fill="#64748B" font-family="Geist, Inter, Arial, sans-serif" font-size="13.2" font-weight="700" letter-spacing="0.28">TECNOLOGIA QUE SIMPLIFICA OPERAÇÕES</text>
  </g>
</svg>`;

const EMBEDDED_SYMBOL = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240" role="img" aria-labelledby="title desc">
  <title id="title">Automy symbol</title>
  <desc id="desc">Identidade vetorial da Automy, uma marca de tecnologia focada em simplificar operações.</desc>
  <defs>
    <linearGradient id="symbol-blue" x1="48" y1="198" x2="132" y2="46" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#2563EB"/>
      <stop offset="1" stop-color="#60A5FA"/>
    </linearGradient>
    <linearGradient id="symbol-teal" x1="104" y1="126" x2="170" y2="156" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#2563EB"/>
      <stop offset="0.48" stop-color="#14B8A6"/>
      <stop offset="1" stop-color="#5EEAD4"/>
    </linearGradient>
  </defs>
  <g id="automy-symbol" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M54 190 C70 150 88 98 110 52" stroke="url(#symbol-blue)" stroke-width="30"/>
    <path d="M121 52 C142 99 162 150 180 190" stroke="url(#symbol-blue)" stroke-width="30"/>
    <path d="M117 122 C128 122 140 122 151 122" stroke="#FFFFFF" stroke-width="30" opacity="0.98"/>
    <path d="M104 126 C124 135 147 146 170 156" stroke="url(#symbol-teal)" stroke-width="26"/>
  </g>
</svg>`;

function assetCandidates(fileName: string) {
  return [
    join(process.cwd(), "public", fileName),
    join(process.cwd(), ".output", "public", fileName),
    join(process.cwd(), "brand-kit", fileName),
  ];
}

function readSvgAsset(fileName: string, embedded: string) {
  const path = assetCandidates(fileName).find((candidate) => existsSync(candidate));
  if (!path) return { source: "embedded" as const, svg: embedded };

  try {
    return { source: "filesystem" as const, svg: readFileSync(path, "utf8") };
  } catch (error) {
    console.warn(
      `[ContractPdfService] Falha ao carregar SVG ${fileName}; usando asset embutido.`,
      error instanceof Error ? error.message : error,
    );
    return { source: "embedded" as const, svg: embedded };
  }
}

export function loadContractPdfBrandAssets(): ContractPdfBrandAssets {
  const logoHorizontal = readSvgAsset("automy-logo-horizontal.svg", EMBEDDED_LOGO_HORIZONTAL);
  const symbol = readSvgAsset("automy-symbol.svg", EMBEDDED_SYMBOL);

  return {
    logoHorizontal: logoHorizontal.svg,
    logoHorizontalSource: logoHorizontal.source,
    symbol: symbol.svg,
    symbolSource: symbol.source,
  };
}

function shortId(id: string) {
  return id.slice(0, SHORT_ID_LENGTH);
}

function safeText(value: string | number | null | undefined, fallback = "Não informado") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(
    Number.isFinite(value) ? value : 0,
  );
}

function formatDocument(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? formatCpfCnpj(digits) : "Não informado";
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    active: "Ativo",
    onboarding: "Implantação",
    pending: "Pendente",
    renewal: "Renovação",
    suspended: "Suspenso",
    cancelled: "Cancelado",
    ended: "Encerrado",
    inactive: "Inativo",
  };
  return labels[value] ?? (value || "Pendente");
}

function yesNo(value: boolean | null | undefined) {
  return value ? "Sim" : "Não";
}

function formatDate(value: string) {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
}

function stripDuplicatedSignatureSection(contractText: string) {
  return contractText.replace(/\n+\s*ASSINATURAS\s*\n+[\s\S]*?(?=\n*$)/i, "").trim();
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function contentBottom(doc: PDFKit.PDFDocument) {
  return (doc.page?.height ?? PAGE.height) - PAGE.bottom;
}

function addContentPage(doc: PDFKit.PDFDocument, top = PAGE.top) {
  doc.addPage();
  doc.x = PAGE.marginLeft;
  doc.y = top;
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > contentBottom(doc)) addContentPage(doc);
}

function renderSvg(
  doc: PDFKit.PDFDocument,
  svg: string,
  x: number,
  y: number,
  options: { height: number; width: number },
  label: string,
) {
  try {
    SVGtoPDF(doc, svg, x, y, {
      height: options.height,
      preserveAspectRatio: "xMinYMid meet",
      width: options.width,
    });
    return true;
  } catch (error) {
    console.warn(
      `[ContractPdfService] Falha ao renderizar ${label}; tentando fallback visual.`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

function addHeader(
  doc: PDFKit.PDFDocument,
  input: ContractPdfInput,
  assets: ContractPdfBrandAssets,
) {
  doc.y = PAGE.firstTop;
  const logoRendered = renderSvg(
    doc,
    assets.logoHorizontal,
    PAGE.marginLeft,
    PAGE.firstTop - 2,
    { width: 156, height: 34 },
    "automy-logo-horizontal.svg",
  );

  if (!logoRendered) {
    const symbolRendered = renderSvg(
      doc,
      assets.symbol,
      PAGE.marginLeft,
      PAGE.firstTop - 4,
      { width: 28, height: 28 },
      "automy-symbol.svg",
    );

    if (symbolRendered) {
      doc
        .font("Helvetica-Bold")
        .fontSize(15)
        .fillColor(BRAND.secondary)
        .text("Automy", PAGE.marginLeft + 38, PAGE.firstTop + 2, { lineBreak: false });
    } else {
      doc
        .font("Helvetica-Bold")
        .fontSize(15)
        .fillColor(BRAND.secondary)
        .text("Automy", PAGE.marginLeft, PAGE.firstTop + 2, { lineBreak: false });
    }
  }

  const rightX = 300;
  const rightWidth = PAGE.width - PAGE.marginRight - rightX;
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(BRAND.secondary)
    .text("Contrato de Prestação de Serviços", rightX, PAGE.firstTop, {
      align: "right",
      lineGap: 2,
      width: rightWidth,
    });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(BRAND.muted)
    .text(`Contrato ${shortId(input.id)} • Versão ${input.version}`, rightX, doc.y + 4, {
      align: "right",
      width: rightWidth,
    })
    .text(`Gerado em ${formatDateTime(input.generatedAt)}`, rightX, doc.y + 2, {
      align: "right",
      width: rightWidth,
    });

  doc
    .moveTo(PAGE.marginLeft, 92)
    .lineTo(PAGE.width - PAGE.marginRight, 92)
    .strokeColor(BRAND.primary)
    .lineWidth(1.4)
    .stroke();
  doc
    .moveTo(PAGE.width - PAGE.marginRight - 76, 92)
    .lineTo(PAGE.width - PAGE.marginRight, 92)
    .strokeColor(BRAND.accent)
    .lineWidth(1.4)
    .stroke();

  doc.y = 116;
}

function addTitleBlock(doc: PDFKit.PDFDocument, input: ContractPdfInput) {
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(BRAND.secondary)
    .text(safeText(input.plan, "Contrato Automy"), PAGE.marginLeft, doc.y, {
      lineGap: 3,
      width: CONTENT_WIDTH,
    });

  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(BRAND.muted)
    .text(
      "Instrumento gerado pela Automy para formalização das condições comerciais e operacionais contratadas.",
      PAGE.marginLeft,
      doc.y + 8,
      { lineGap: 3, width: CONTENT_WIDTH },
    );
  doc.y += 16;
}

function addInfoGrid(doc: PDFKit.PDFDocument, input: ContractPdfInput) {
  const rows: Array<Array<[string, string]>> = [
    [
      ["Contratada", safeText(input.companyName, "Automy")],
      ["Contratante", safeText(input.clientName, "Cliente")],
    ],
    [
      ["Documento", formatDocument(input.clientDocument)],
      ["Produto", safeText(input.productName)],
    ],
    [
      ["Status", statusLabel(input.status)],
      ["Identificador", input.id],
    ],
    [
      ["Versão", String(input.version)],
      ["Hash", safeText(input.hash)],
    ],
  ];
  const gap = 12;
  const columnWidth = (CONTENT_WIDTH - gap) / 2;
  const rowHeight = 42;
  const top = doc.y;
  const height = rows.length * rowHeight + 20;

  ensureSpace(doc, height);
  doc
    .roundedRect(PAGE.marginLeft, doc.y, CONTENT_WIDTH, height, 12)
    .fillAndStroke(BRAND.background, BRAND.border);

  rows.forEach((row, rowIndex) => {
    row.forEach(([label, value], columnIndex) => {
      const x = PAGE.marginLeft + 18 + columnIndex * (columnWidth + gap);
      const y = top + 16 + rowIndex * rowHeight;
      doc.font("Helvetica").fontSize(7.8).fillColor(BRAND.muted).text(label, x, y, {
        width: columnWidth,
      });
      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(BRAND.secondary)
        .text(value, x, y + 12, { ellipsis: true, width: columnWidth });
    });
  });
  doc.y = top + height + 20;
}

function addCommercialBox(doc: PDFKit.PDFDocument, input: ContractPdfInput) {
  const metrics: Array<[string, string]> = [
    ["Valor mensal", formatCurrency(input.monthlyValue)],
    ["Implantação", formatCurrency(input.implementationValue)],
    ["Início", formatDate(input.startsAt)],
    ["Vencimento", formatDate(input.endsAt)],
  ];
  const gap = 10;
  const cardWidth = (CONTENT_WIDTH - gap * 3) / 4;
  const cardHeight = 62;

  ensureSpace(doc, cardHeight + 28);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(BRAND.secondary)
    .text("Condições comerciais", PAGE.marginLeft, doc.y, {
      width: CONTENT_WIDTH,
    });
  doc.y += 8;

  const top = doc.y;
  metrics.forEach(([label, value], index) => {
    const x = PAGE.marginLeft + index * (cardWidth + gap);
    doc.roundedRect(x, top, cardWidth, cardHeight, 10).fillAndStroke(BRAND.surface, BRAND.border);
    doc
      .font("Helvetica")
      .fontSize(7.6)
      .fillColor(BRAND.muted)
      .text(label, x + 12, top + 13, {
        width: cardWidth - 24,
      });
    doc
      .font("Helvetica-Bold")
      .fontSize(10.6)
      .fillColor(BRAND.secondary)
      .text(value, x + 12, top + 30, {
        width: cardWidth - 24,
      });
  });

  doc.y = top + cardHeight + 20;
}

function addItems(doc: PDFKit.PDFDocument, input: ContractPdfInput) {
  if (!input.items.length) return;

  const rowHeight = 22;
  ensureSpace(doc, 36 + input.items.length * rowHeight);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(BRAND.secondary)
    .text("Itens contratados", PAGE.marginLeft, doc.y, {
      width: CONTENT_WIDTH,
    });
  doc.y += 8;

  input.items.forEach((item, index) => {
    ensureSpace(doc, rowHeight + 4);
    const top = doc.y;
    if (index % 2 === 0) {
      doc
        .roundedRect(PAGE.marginLeft, top - 3, CONTENT_WIDTH, rowHeight + 2, 6)
        .fill(BRAND.background);
    }
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(BRAND.body)
      .text(`${item.quantity}x ${item.name}`, PAGE.marginLeft + 10, top, {
        ellipsis: true,
        width: CONTENT_WIDTH - 170,
      });
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(BRAND.secondary)
      .text(
        `${formatCurrency(item.monthlyValue)}/mês`,
        PAGE.marginLeft + CONTENT_WIDTH - 150,
        top,
        {
          align: "right",
          width: 140,
        },
      );
    doc.y = top + rowHeight;
  });
  doc.y += 8;
}

function addKeyValueCard(doc: PDFKit.PDFDocument, title: string, rows: Array<[string, string]>) {
  const padding = 14;
  const rowGap = 9;
  const labelWidth = 112;
  const valueWidth = CONTENT_WIDTH - padding * 2 - labelWidth - 10;
  const contentHeight = rows.reduce((height, [label, value]) => {
    doc.font("Helvetica").fontSize(8);
    const labelHeight = doc.heightOfString(label, { width: labelWidth });
    doc.font("Helvetica").fontSize(8.6);
    const valueHeight = doc.heightOfString(value, { width: valueWidth });
    return height + Math.max(labelHeight, valueHeight) + rowGap;
  }, 24);
  const height = contentHeight + padding * 2;

  ensureSpace(doc, height + 10);
  const top = doc.y;
  doc
    .roundedRect(PAGE.marginLeft, top, CONTENT_WIDTH, height, 12)
    .fillAndStroke(BRAND.surface, BRAND.border);
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(BRAND.secondary)
    .text(title, PAGE.marginLeft + padding, top + padding, { width: CONTENT_WIDTH - padding * 2 });

  let y = top + padding + 24;
  rows.forEach(([label, value]) => {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(BRAND.muted)
      .text(label, PAGE.marginLeft + padding, y, { width: labelWidth });
    doc
      .font("Helvetica")
      .fontSize(8.6)
      .fillColor(BRAND.body)
      .text(value, PAGE.marginLeft + padding + labelWidth + 10, y, {
        lineGap: 2,
        width: valueWidth,
      });
    const labelHeight = doc.heightOfString(label, { width: labelWidth });
    const valueHeight = doc.heightOfString(value, { width: valueWidth });
    y += Math.max(labelHeight, valueHeight) + rowGap;
  });

  doc.y = top + height + 12;
}

function addHiringSummary(doc: PDFKit.PDFDocument, input: ContractPdfInput) {
  ensureSpace(doc, 56);
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(BRAND.secondary)
    .text("Quadro de contratação", PAGE.marginLeft, doc.y, { width: CONTENT_WIDTH });
  doc.y += 10;

  addKeyValueCard(doc, "Contratante", [
    ["Razão social / nome", safeText(input.clientName)],
    ["CPF/CNPJ", formatDocument(input.clientDocument)],
    ["Responsável", safeText(input.signerName)],
    ["Documento do responsável", formatDocument(input.signerDocument ?? "")],
    ["E-mail", safeText(input.signerEmail)],
    ["Telefone", safeText(input.signerPhone)],
  ]);

  addKeyValueCard(doc, "Contratada", [
    ["Empresa", safeText(input.companyName, "Automy")],
    ["Representante", safeText(input.automyRepresentative, "Representante Automy")],
    ["Contato", "Automy - Plataforma inteligente para controle e gestão operacional."],
  ]);

  addKeyValueCard(doc, "Serviço contratado", [
    ["Produto", safeText(input.productName)],
    ["Plano", safeText(input.plan)],
    ["Escopo", safeText(input.scope ?? input.description)],
    ["Entregáveis", safeText(input.deliverables)],
    ["Usuários incluídos", String(input.includedUsers ?? 1)],
    ["Hospedagem", yesNo(input.hostedByAutomy)],
    ["URL personalizada", yesNo(input.customUrlEnabled)],
    [
      "Implantação",
      `${input.implementationDays ?? 0} dias - ${formatCurrency(input.implementationValue)}`,
    ],
    ["Mensalidade", formatCurrency(input.monthlyValue)],
    ["Forma de pagamento", safeText(input.paymentTermsDescription ?? input.paymentMethod)],
    [
      "Parcelas",
      `${input.installmentsCount ?? 1}${input.installmentDueDays?.length ? ` (${input.installmentDueDays.join(", ")} dias)` : ""}`,
    ],
    ["Fidelidade", `${input.loyaltyMonths ?? 0} meses`],
    ["Início", formatDate(input.startsAt)],
    ["Renovação", formatDate(input.endsAt)],
  ]);
}

function isHeading(text: string) {
  const normalized = text.trim();
  if (!normalized) return false;
  if (/^(ASSINATURAS|QUADRO|CONDIÇÕES|CONTRATAD[AO]|TESTEMUNHA|RESPONSÁVEL)/i.test(normalized)) {
    return true;
  }
  if (/^\d+(\.\d+)*\.\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\s,;:()/-]+$/.test(normalized)) return true;
  return normalized.length <= 80 && normalized === normalized.toLocaleUpperCase("pt-BR");
}

function normalizedContractLines(contractText: string) {
  return stripDuplicatedSignatureSection(contractText)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .reduce<string[]>((lines, line) => {
      if (!line) {
        if (lines.at(-1) !== "") lines.push("");
        return lines;
      }
      lines.push(line);
      return lines;
    }, [])
    .filter((line, index, lines) => line || lines[index - 1]);
}

function addTextLine(doc: PDFKit.PDFDocument, line: string, nextLine?: string) {
  if (!line) {
    doc.y += 5;
    return;
  }

  const heading = isHeading(line);
  const font = heading ? "Helvetica-Bold" : "Helvetica";
  const fontSize = heading ? 10.2 : 9.4;
  const lineGap = heading ? 1.5 : 3.2;
  const afterGap = heading ? 5 : 6.5;
  const minHeight = heading && nextLine ? 44 : 18;
  const height = doc.heightOfString(line, {
    align: heading ? "left" : "justify",
    lineGap,
    width: CONTENT_WIDTH,
  });

  ensureSpace(doc, Math.min(Math.max(height + afterGap, minHeight), contentBottom(doc) - PAGE.top));
  doc
    .font(font)
    .fontSize(fontSize)
    .fillColor(heading ? BRAND.secondary : BRAND.body)
    .text(line, PAGE.marginLeft, doc.y, {
      align: heading ? "left" : "justify",
      lineGap,
      width: CONTENT_WIDTH,
    });
  doc.y += afterGap;
}

function addClauses(doc: PDFKit.PDFDocument, input: ContractPdfInput) {
  ensureSpace(doc, 56);
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(BRAND.secondary)
    .text("Cláusulas contratuais", PAGE.marginLeft, doc.y, { width: CONTENT_WIDTH });
  doc
    .moveTo(PAGE.marginLeft, doc.y + 6)
    .lineTo(PAGE.width - PAGE.marginRight, doc.y + 6)
    .strokeColor(BRAND.border)
    .lineWidth(0.8)
    .stroke();
  doc.y += 18;

  const lines = normalizedContractLines(input.contractText);
  lines.forEach((line, index) => addTextLine(doc, line, lines[index + 1]));
}

function addSignatureBlock(doc: PDFKit.PDFDocument, input: ContractPdfInput) {
  const hasWitness = Boolean(input.witnessName.trim());
  const blockHeight = hasWitness ? 190 : 138;
  ensureSpace(doc, blockHeight);

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(BRAND.secondary)
    .text("Assinaturas", PAGE.marginLeft, doc.y, { width: CONTENT_WIDTH });
  doc.y += 18;

  const top = doc.y;
  const gap = 22;
  const columnWidth = (CONTENT_WIDTH - gap) / 2;
  const parties = [
    {
      label: "Contratante",
      name: safeText(input.clientName, "Cliente"),
      person: safeText(input.signerName),
      document: input.signerDocument ? formatDocument(input.signerDocument) : "",
    },
    {
      label: "Contratada",
      name: safeText(input.companyName, "Automy"),
      person: safeText(input.automyRepresentative, "Representante Automy"),
      document: "",
    },
  ];

  parties.forEach((party, index) => {
    const x = PAGE.marginLeft + index * (columnWidth + gap);
    doc
      .moveTo(x, top + 48)
      .lineTo(x + columnWidth, top + 48)
      .strokeColor(BRAND.border)
      .lineWidth(0.9)
      .stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(BRAND.secondary)
      .text(party.label, x, top + 58, {
        width: columnWidth,
      });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(BRAND.muted)
      .text(party.name, x, top + 72, {
        ellipsis: true,
        height: 20,
        width: columnWidth,
      });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(BRAND.muted)
      .text(`Responsável: ${party.person}`, x, top + 96, {
        ellipsis: true,
        height: 12,
        width: columnWidth,
      });
    if (party.document) {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(BRAND.muted)
        .text(`Documento: ${party.document}`, x, top + 110, {
          ellipsis: true,
          height: 12,
          width: columnWidth,
        });
    }
  });

  doc.y = top + 126;
  if (hasWitness) {
    const witnessTop = doc.y;
    doc
      .moveTo(PAGE.marginLeft, witnessTop + 34)
      .lineTo(PAGE.marginLeft + columnWidth, witnessTop + 34)
      .strokeColor(BRAND.border)
      .stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(BRAND.secondary)
      .text("Testemunha", PAGE.marginLeft, witnessTop + 44, {
        width: columnWidth,
      });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(BRAND.muted)
      .text(input.witnessName, PAGE.marginLeft, witnessTop + 58, {
        ellipsis: true,
        height: 12,
        width: columnWidth,
      });
    if (input.witnessDocument) {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(BRAND.muted)
        .text(
          `Documento: ${formatDocument(input.witnessDocument)}`,
          PAGE.marginLeft,
          witnessTop + 72,
          {
            ellipsis: true,
            height: 12,
            width: columnWidth,
          },
        );
    }
    doc.y = witnessTop + 88;
  } else {
    doc.y = top + 126;
  }
}

function addFooter(
  doc: PDFKit.PDFDocument,
  input: ContractPdfInput,
  pageNumber: number,
  totalPages: number,
) {
  const footerText = `Automy • Contrato ${shortId(input.id)} • Versão ${input.version} • Página ${pageNumber} de ${totalPages} • Hash ${input.hash.slice(0, 16)} • ${formatDateTime(input.generatedAt)}`;

  doc
    .moveTo(PAGE.marginLeft, PAGE.footerY - 10)
    .lineTo(PAGE.width - PAGE.marginRight, PAGE.footerY - 10)
    .strokeColor(BRAND.border)
    .lineWidth(0.7)
    .stroke();
  doc
    .font("Helvetica")
    .fontSize(7.2)
    .fillColor(BRAND.muted)
    .text(footerText, PAGE.marginLeft, PAGE.footerY, {
      align: "center",
      ellipsis: true,
      height: 10,
      width: CONTENT_WIDTH,
    });
}

export async function generateContractPdf(input: ContractPdfInput) {
  const doc = new PDFDocument({
    autoFirstPage: false,
    bufferPages: true,
    margins: {
      bottom: PAGE.bottom,
      left: PAGE.marginLeft,
      right: PAGE.marginRight,
      top: PAGE.top,
    },
    size: "A4",
  });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const assets = input.brandAssets ?? loadContractPdfBrandAssets();
  addContentPage(doc, PAGE.firstTop);
  addHeader(doc, input, assets);
  addTitleBlock(doc, input);
  addInfoGrid(doc, input);
  addCommercialBox(doc, input);
  addItems(doc, input);
  addHiringSummary(doc, input);
  addClauses(doc, input);
  addSignatureBlock(doc, input);

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    addFooter(doc, input, index - range.start + 1, range.count);
  }

  doc.end();
  return finished;
}
