import assert from "node:assert/strict";
import {
  assertCompanyRegistryRateLimit,
  CompanyRegistryError,
  createCnpjWsProvider,
  mapCnpjWsPayload,
  normalizeCompanyRegistryDocument,
  readCompanyRegistryCache,
  writeCompanyRegistryCache,
} from "../../src/features/clients/server/company-registry-provider.ts";
import { contractPdfHeaders } from "../../src/features/contracts/server/contract-pdf-http.ts";
import {
  generateContractPdf,
  loadContractPdfBrandAssets,
} from "../../src/features/contracts/server/contract-pdf-service.ts";
import {
  buildContractDraft,
  buildPaymentTerms,
  stripDuplicatedSignatureSection,
} from "../../src/features/contracts/utils/contract-template.ts";
import {
  calculateInstallmentDueDays,
  formatPaymentTermsForContract,
  normalizeLegacyPaymentTerms,
} from "../../src/features/contracts/utils/payment-terms.ts";
import { contractFormSchema } from "../../src/features/contracts/validation.ts";
import { formatCpf, formatCnpj, isValidCpf, isValidCnpj } from "../../src/shared/utils/document.ts";
import {
  formatBrazilianCurrencyInput,
  parseBrazilianCurrency,
} from "../../src/shared/utils/formatters.ts";

const context = {
  authUserId: "00000000-0000-4000-8000-000000000001",
  companyId: "00000000-0000-4000-8000-000000000002",
  domainUserId: "00000000-0000-4000-8000-000000000003",
  role: "admin",
  status: "active",
};

class FakeDb {
  cache = new Map();
  rate = new Map();

  async query(sql, values = []) {
    if (sql.includes("from public.company_registry_cache")) {
      const key = `${values[0]}:${values[1]}`;
      const cached = this.cache.get(key);
      return { rows: cached ? [{ normalized_payload: cached }] : [] };
    }

    if (sql.includes("insert into public.company_registry_cache")) {
      const key = `${values[2]}:${values[1]}`;
      this.cache.set(key, JSON.parse(values[3]));
      return { rows: [] };
    }

    if (sql.includes("insert into public.company_registry_rate_limits")) {
      const key = `${values[0]}:${values[1]}:${values[2]}:${values[3]}`;
      const count = (this.rate.get(key) ?? 0) + 1;
      this.rate.set(key, count);
      return { rows: [{ count }] };
    }

    throw new Error(`Unexpected SQL in fake db: ${sql}`);
  }
}

const sampleCnpjWsPayload = {
  razao_social: "GLOBO COMUNICACAO E PARTICIPACOES S/A",
  capital_social: "6983568523.86",
  porte: { descricao: "Demais" },
  natureza_juridica: { descricao: "Sociedade Anônima Fechada" },
  estabelecimento: {
    cnpj: "27865757000102",
    nome_fantasia: "TV Globo",
    situacao_cadastral: "Ativa",
    data_inicio_atividade: "1986-01-31",
    logradouro: "R LOPES QUINTAS",
    numero: "303",
    complemento: "SALA 101",
    bairro: "JARDIM BOTANICO",
    cep: "22460901",
    ddd1: "21",
    telefone1: "25407070",
    email: "CONTATO@EXEMPLO.COM",
    atividade_principal: { id: "5911101", descricao: "Estúdios cinematográficos" },
    estado: { sigla: "RJ" },
    cidade: { nome: "Rio de Janeiro" },
    pais: { iso2: "BR" },
    inscricoes_estaduais: [{ inscricao_estadual: "12345678", ativo: true }],
  },
};

assert.equal(normalizeCompanyRegistryDocument("27.865.757/0001-02"), "27865757000102");
assert.throws(
  () => normalizeCompanyRegistryDocument("11.111.111/1111-11"),
  (error) => error instanceof CompanyRegistryError && error.status === 400,
);

const mapped = mapCnpjWsPayload(sampleCnpjWsPayload, "27865757000102", "2026-08-06T00:00:00.000Z");
assert.equal(mapped.legalName, "GLOBO COMUNICACAO E PARTICIPACOES S/A");
assert.equal(mapped.tradeName, "TV Globo");
assert.equal(mapped.stateRegistration, "12345678");
assert.equal(mapped.phone, "(21) 2540-7070");
assert.equal(mapped.postalCode, "22460-901");
assert.equal(mapped.cnae, "5911101 - Estúdios cinematográficos");
assert.equal(mapped.provider, "cnpj_ws");

assert.equal(formatBrazilianCurrencyInput(7000), "R$ 7.000,00");
assert.equal(formatBrazilianCurrencyInput(1234567.89), "R$ 1.234.567,89");
assert.equal(parseBrazilianCurrency("R$ 1.234.567,89"), 1234567.89);
assert.equal(parseBrazilianCurrency("7000"), 7000);
assert.equal(formatCpf("52998224725"), "529.982.247-25");
assert.equal(formatCnpj("27865757000102"), "27.865.757/0001-02");
assert.equal(isValidCpf("529.982.247-25"), true);
assert.equal(isValidCnpj("27.865.757/0001-02"), true);

const paymentTerms = buildPaymentTerms({
  paymentMethod: "Boleto parcelado",
  installmentsCount: 3,
  firstDueInDays: 30,
});
assert.deepEqual(paymentTerms.dueDays, [30, 60, 90]);
assert.match(paymentTerms.description, /30, 60 e 90 dias/);
assert.deepEqual(calculateInstallmentDueDays(4, 30), [30, 60, 90, 120]);
assert.deepEqual(calculateInstallmentDueDays(3, 15), [15, 45, 75]);

const downPaymentTerms = buildPaymentTerms({
  paymentMethod: "Entrada + parcelamento",
  implementationValue: 10000,
  downPaymentAmount: 2000,
  installmentsCount: 4,
  firstDueInDays: 30,
});
assert.deepEqual(downPaymentTerms.calculatedDueDays, [30, 60, 90, 120]);
assert.equal(downPaymentTerms.remainingAmount, 8000);
assert.equal(downPaymentTerms.installmentAmount, 2000);
assert.match(formatPaymentTermsForContract(downPaymentTerms), /entrada de R\$ 2\.000,00/);
assert.match(formatPaymentTermsForContract(downPaymentTerms), /30, 60, 90 e 120 dias/);

const legacyPaymentTerms = normalizeLegacyPaymentTerms(
  {
    method: "Boleto parcelado",
    installments: 3,
    firstDueInDays: 30,
    intervalDays: 30,
  },
  { totalAmount: 1000 },
);
assert.deepEqual(legacyPaymentTerms.calculatedDueDays, [30, 60, 90]);

const baseContractPayload = {
  clientId: "00000000-0000-4000-8000-000000000010",
  productId: "00000000-0000-4000-8000-000000000011",
  name: "Plano Teste",
  startsAt: "2026-08-06",
  endsAt: "2027-08-06",
  signerName: "Responsável Teste",
};
assert.equal(
  contractFormSchema.safeParse({
    ...baseContractPayload,
    paymentMethod: "Entrada + parcelamento",
    implementationValue: 10000,
    downPaymentAmount: 12000,
    installmentsCount: 4,
    firstDueInDays: 30,
  }).success,
  false,
);
assert.equal(
  contractFormSchema.safeParse({
    ...baseContractPayload,
    paymentMethod: "Cartão",
    gatewayInstallments: 12,
  }).success,
  true,
);

assert.equal(
  stripDuplicatedSignatureSection(
    "1. CLÁUSULA\nTexto válido.\n\nASSINATURAS\nCONTRATANTE: Cliente\nAssinatura: ___",
  ),
  "1. CLÁUSULA\nTexto válido.",
);

const draftFromProduct = buildContractDraft(
  {
    id: "product-id",
    name: "Automy ERP",
    category: "Logística",
    version: "1.0",
    clients: 0,
    contracts: 0,
    status: "Ativo",
    basePrice: 7000,
    billingMode: "Mensal",
    description: "Gestão operacional",
    commercialTerms: null,
    contractTemplate: "1. OBJETO\nContrato-base do produto.",
    createdAt: "2026-08-06T00:00:00.000Z",
    updatedAt: "2026-08-06T00:00:00.000Z",
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  },
  {
    companyName: "Cliente Teste",
    document: "27865757000102",
    signerName: "Responsável Teste",
  },
  {
    monthlyValue: 9100,
    implementationValue: 3000,
    paymentMethod: "Boleto parcelado",
    installmentsCount: 3,
    firstDueInDays: 30,
  },
);
assert.match(draftFromProduct, /Mensalidade contratada: R\$ 9\.100,00/);
assert.match(draftFromProduct, /30, 60 e 90 dias/);
assert.doesNotMatch(draftFromProduct, /ASSINATURAS/);

const db = new FakeDb();
assert.equal(await readCompanyRegistryCache(db, "cnpj_ws", mapped.document), null);
await writeCompanyRegistryCache(db, context, mapped, 86_400_000);
const cached = await readCompanyRegistryCache(db, "cnpj_ws", mapped.document);
assert.equal(cached?.cached, true);
assert.equal(cached?.legalName, mapped.legalName);

process.env.CNPJ_LOOKUP_RATE_LIMIT = "1";
await assertCompanyRegistryRateLimit(db, context, "cnpj_ws", mapped.document);
await assert.rejects(
  () => assertCompanyRegistryRateLimit(db, context, "cnpj_ws", mapped.document),
  (error) => error instanceof CompanyRegistryError && error.status === 429,
);

const originalFetch = globalThis.fetch;
globalThis.fetch = async () =>
  new Response(JSON.stringify({ erro: "rate limit" }), { status: 429 });
await assert.rejects(
  () => createCnpjWsProvider().lookup(mapped.document, new AbortController().signal),
  (error) => error instanceof CompanyRegistryError && error.status === 429,
);
globalThis.fetch = originalFetch;

const headers = contractPdfHeaders("00000000-0000-4000-8000-000000000004", "inline");
assert.equal(headers["content-type"], "application/pdf");
assert.match(headers["content-disposition"], /^inline; filename="contrato-/);
assert.equal(headers["x-content-type-options"], "nosniff");

const downloadHeaders = contractPdfHeaders("00000000-0000-4000-8000-000000000004", "attachment");
assert.match(downloadHeaders["content-disposition"], /^attachment; filename="contrato-/);

const brandAssets = loadContractPdfBrandAssets();
assert.match(brandAssets.logoHorizontal, /<svg[\s>]/);
assert.match(brandAssets.symbol, /<svg[\s>]/);
assert.ok(["filesystem", "embedded"].includes(brandAssets.logoHorizontalSource));
assert.ok(["filesystem", "embedded"].includes(brandAssets.symbolSource));

function countPdfPages(buffer) {
  return (buffer.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;
}

const minimalPdfInput = {
  id: "00000000-0000-4000-8000-000000000004",
  version: 1,
  hash: "abcdef1234567890abcdef1234567890",
  generatedAt: "2026-08-06T00:00:00.000Z",
  companyName: "Automy",
  clientName: "Cliente Teste",
  clientDocument: "27.865.757/0001-02",
  productName: "Automy ERP",
  plan: "Plano Teste",
  status: "pending",
  scope: "Escopo operacional com nomes longos e acentuação.",
  deliverables: "Implantação, treinamento e suporte.",
  includedUsers: 10,
  hostedByAutomy: true,
  customUrlEnabled: false,
  implementationDays: 30,
  paymentMethod: "Boleto parcelado",
  installmentsCount: 3,
  installmentDueDays: [30, 60, 90],
  paymentTerms,
  paymentTermsDescription: paymentTerms.description,
  loyaltyMonths: 12,
  signerDocument: "52998224725",
  signerEmail: "responsavel@cliente.com",
  signerPhone: "(11) 99999-9999",
  monthlyValue: 1000,
  implementationValue: 500,
  startsAt: "2026-08-06",
  endsAt: "2027-08-06",
  signerName: "Responsável Teste",
  witnessName: "",
  items: [{ name: "Licença Automy", quantity: 1, monthlyValue: 1000 }],
  contractText: "Cláusula primeira: prestação de serviços Automy.\n\nCláusula segunda: vigência.",
};

const pdf = await generateContractPdf(minimalPdfInput);
assert.equal(pdf.subarray(0, 4).toString("utf8"), "%PDF");
assert.ok(pdf.byteLength > 1_000);
assert.ok(countPdfPages(pdf) >= 1);

const noWitnessPdf = await generateContractPdf({
  ...minimalPdfInput,
  signerName: "Responsável Teste",
  witnessName: "",
});
assert.ok(countPdfPages(noWitnessPdf) <= 3);

const originalConsoleWarn = console.warn;
console.warn = () => {};
let fallbackPdf;
try {
  fallbackPdf = await generateContractPdf({
    ...minimalPdfInput,
    brandAssets: {
      ...brandAssets,
      logoHorizontal: "<svg>",
      logoHorizontalSource: "embedded",
    },
  });
} finally {
  console.warn = originalConsoleWarn;
}
assert.equal(fallbackPdf.subarray(0, 4).toString("utf8"), "%PDF");
assert.ok(fallbackPdf.byteLength > 1_000);

const longClause = Array.from(
  { length: 8 },
  (_, index) =>
    `${index + 1}. CLÁUSULA OPERACIONAL\n${minimalPdfInput.contractText}\nA presente cláusula adicional valida acentuação, largura útil do texto, paginação previsível e ausência de páginas finais vazias.`,
).join("\n\n");
const longPdf = await generateContractPdf({
  ...minimalPdfInput,
  witnessName: "Testemunha Teste",
  contractText: longClause,
});
const longPageCount = countPdfPages(longPdf);
assert.ok(longPageCount > 1);
assert.ok(longPageCount <= 6);

console.log(
  JSON.stringify({
    cnpjNormalization: "ok",
    cnpjMapping: "ok",
    cnpjRateLimit: "ok",
    cnpjCache: "ok",
    pdfAssets: "ok",
    pdfFallback: "ok",
    pdfHeaders: "ok",
    pdfGeneration: "ok",
    pdfNoWitness: "ok",
    pdfPagination: "ok",
    currencyFormatting: "ok",
    documentFormatting: "ok",
    paymentTerms: "ok",
    paymentConditionals: "ok",
    paymentSchedule: "ok",
    contractDraftSnapshot: "ok",
  }),
);
