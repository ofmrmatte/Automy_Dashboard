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
import { generateContractPdf } from "../../src/features/contracts/server/contract-pdf-service.ts";

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

const pdf = await generateContractPdf({
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
  monthlyValue: 1000,
  implementationValue: 500,
  startsAt: "2026-08-06",
  endsAt: "2027-08-06",
  signerName: "Responsável Teste",
  witnessName: "",
  items: [{ name: "Licença Automy", quantity: 1, monthlyValue: 1000 }],
  contractText: "Cláusula primeira: prestação de serviços Automy.\n\nCláusula segunda: vigência.",
});
assert.equal(pdf.subarray(0, 4).toString("utf8"), "%PDF");
assert.ok(pdf.byteLength > 1_000);

console.log(
  JSON.stringify({
    cnpjNormalization: "ok",
    cnpjMapping: "ok",
    cnpjRateLimit: "ok",
    cnpjCache: "ok",
    pdfHeaders: "ok",
    pdfGeneration: "ok",
  }),
);
