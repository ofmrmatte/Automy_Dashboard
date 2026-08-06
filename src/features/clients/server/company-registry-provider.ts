import { z } from "zod";
import type { AuthenticatedUserContext } from "@/shared/server/authz";
import { isValidCnpj, onlyDigits } from "@/shared/utils/document";

type QueryableConnection = {
  query: (sql: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
};

export type CompanyRegistryPayload = {
  document: string;
  legalName: string;
  tradeName: string;
  email: string;
  phone: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  country: string;
  stateRegistration: string;
  legalNature: string;
  cnae: string;
  registrationStatus: string;
  openedAt: string;
  size: string;
  capitalSocial: string;
  source: string;
  provider: string;
  fetchedAt: string;
  cached: boolean;
};

export type CompanyRegistryProvider = {
  key: string;
  lookup: (document: string, signal: AbortSignal) => Promise<CompanyRegistryPayload>;
};

type CompanyRegistryErrorCode =
  "invalid_document" | "not_found" | "rate_limited" | "timeout" | "unavailable";

export class CompanyRegistryError extends Error {
  public readonly code: CompanyRegistryErrorCode;
  public readonly status: number;

  constructor(code: CompanyRegistryErrorCode, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const cnpjWsSchema = z.object({
  razao_social: z.string().nullable().optional(),
  capital_social: z.string().nullable().optional(),
  atualizado_em: z.string().nullable().optional(),
  porte: z
    .object({
      descricao: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  natureza_juridica: z
    .object({
      descricao: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  estabelecimento: z
    .object({
      cnpj: z.string().nullable().optional(),
      nome_fantasia: z.string().nullable().optional(),
      situacao_cadastral: z.string().nullable().optional(),
      data_inicio_atividade: z.string().nullable().optional(),
      logradouro: z.string().nullable().optional(),
      numero: z.string().nullable().optional(),
      complemento: z.string().nullable().optional(),
      bairro: z.string().nullable().optional(),
      cep: z.string().nullable().optional(),
      ddd1: z.string().nullable().optional(),
      telefone1: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
      atividade_principal: z
        .object({
          id: z.string().nullable().optional(),
          descricao: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
      estado: z
        .object({
          sigla: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
      cidade: z
        .object({
          nome: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
      pais: z
        .object({
          iso2: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
      inscricoes_estaduais: z
        .array(
          z.object({
            inscricao_estadual: z.string().nullable().optional(),
            ativo: z.boolean().nullable().optional(),
          }),
        )
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
});

export function normalizeCompanyRegistryDocument(value: string) {
  const document = onlyDigits(value);
  if (!document || document.length !== 14 || !isValidCnpj(document)) {
    throw new CompanyRegistryError("invalid_document", "Informe um CNPJ válido.", 400);
  }

  return document;
}

function optionalText(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function normalizeDate(value: string | null | undefined) {
  const text = optionalText(value);
  if (!text) return "";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toISOString().slice(0, 10);
}

function normalizePhone(ddd: string | null | undefined, phone: string | null | undefined) {
  const value = onlyDigits(`${ddd ?? ""}${phone ?? ""}`);
  if (!value) return "";
  if (value.length === 10) return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
  if (value.length === 11) return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
  return value;
}

function normalizePostalCode(value: string | null | undefined) {
  const digits = onlyDigits(value ?? "");
  if (digits.length !== 8) return optionalText(value);
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function mapCnpjWsPayload(
  payload: unknown,
  document: string,
  fetchedAt = new Date().toISOString(),
): CompanyRegistryPayload {
  const parsed = cnpjWsSchema.safeParse(payload);
  if (!parsed.success) {
    throw new CompanyRegistryError(
      "unavailable",
      "Não foi possível consultar o CNPJ agora. O cadastro manual continua disponível.",
      502,
    );
  }

  const company = parsed.data;
  const establishment = company.estabelecimento;
  const mainActivity = establishment?.atividade_principal;
  const activeStateRegistration =
    establishment?.inscricoes_estaduais?.find((item) => item.ativo)?.inscricao_estadual ??
    establishment?.inscricoes_estaduais?.[0]?.inscricao_estadual;
  const country = optionalText(establishment?.pais?.iso2).toUpperCase() || "BR";
  const cnae = [optionalText(mainActivity?.id), optionalText(mainActivity?.descricao)]
    .filter(Boolean)
    .join(" - ");

  return {
    document,
    legalName: optionalText(company.razao_social),
    tradeName: optionalText(establishment?.nome_fantasia) || optionalText(company.razao_social),
    email: optionalText(establishment?.email).toLowerCase(),
    phone: normalizePhone(establishment?.ddd1, establishment?.telefone1),
    postalCode: normalizePostalCode(establishment?.cep),
    street: optionalText(establishment?.logradouro),
    number: optionalText(establishment?.numero),
    complement: optionalText(establishment?.complemento),
    district: optionalText(establishment?.bairro),
    city: optionalText(establishment?.cidade?.nome),
    state: optionalText(establishment?.estado?.sigla).toUpperCase(),
    country,
    stateRegistration: optionalText(activeStateRegistration),
    legalNature: optionalText(company.natureza_juridica?.descricao),
    cnae,
    registrationStatus: optionalText(establishment?.situacao_cadastral),
    openedAt: normalizeDate(establishment?.data_inicio_atividade),
    size: optionalText(company.porte?.descricao),
    capitalSocial: optionalText(company.capital_social),
    source: "cnpj_ws",
    provider: "cnpj_ws",
    fetchedAt,
    cached: false,
  };
}

function resolveCnpjWsUrl(document: string) {
  const mode = process.env["CNPJ_WS_MODE"] === "commercial" ? "commercial" : "public";
  const defaultBaseUrl =
    mode === "commercial" ? "https://comercial.cnpj.ws" : "https://publica.cnpj.ws";
  const configuredBaseUrl = process.env["CNPJ_WS_API_URL"] || defaultBaseUrl;
  return {
    mode,
    url: `${configuredBaseUrl.replace(/\/+$/, "")}/cnpj/${document}`,
  };
}

export function createCnpjWsProvider(): CompanyRegistryProvider {
  return {
    key: "cnpj_ws",
    lookup: async (document, signal) => {
      const { mode, url } = resolveCnpjWsUrl(document);
      const headers: HeadersInit = { accept: "application/json" };
      const token = process.env["CNPJ_WS_API_TOKEN"];
      if (mode === "commercial" && token) {
        headers["x_api_token"] = token;
      }

      const response = await fetch(url, { headers, signal });
      if (response.status === 404) {
        throw new CompanyRegistryError("not_found", "CNPJ não encontrado.", 404);
      }
      if (response.status === 429) {
        throw new CompanyRegistryError(
          "rate_limited",
          "Limite de consultas atingido. Aguarde um momento e tente novamente.",
          429,
        );
      }
      if (!response.ok) {
        throw new CompanyRegistryError(
          "unavailable",
          "Não foi possível consultar o CNPJ agora. O cadastro manual continua disponível.",
          502,
        );
      }

      return mapCnpjWsPayload(await response.json(), document);
    },
  };
}

export function resolveCompanyRegistryProvider() {
  const configuredProvider =
    process.env["CNPJ_PROVIDER"] ?? process.env["AUTOMY_CNPJ_PROVIDER"] ?? "cnpj_ws";

  if (configuredProvider !== "cnpj_ws") {
    throw new CompanyRegistryError(
      "unavailable",
      "Não foi possível consultar o CNPJ agora. O cadastro manual continua disponível.",
      503,
    );
  }

  return createCnpjWsProvider();
}

export async function readCompanyRegistryCache(
  db: QueryableConnection,
  provider: string,
  document: string,
) {
  const result = await db.query(
    `
      select normalized_payload
      from public.company_registry_cache
      where provider = $1
        and document = $2
        and status = 'found'
        and expires_at > now()
        and deleted_at is null
      order by fetched_at desc
      limit 1
    `,
    [provider, document],
  );
  const payload = result.rows[0]?.["normalized_payload"] as CompanyRegistryPayload | undefined;
  return payload ? { ...payload, cached: true } : null;
}

export async function writeCompanyRegistryCache(
  db: QueryableConnection,
  context: AuthenticatedUserContext,
  payload: CompanyRegistryPayload,
  ttlMs = Number(process.env["CNPJ_LOOKUP_CACHE_MS"] ?? 86_400_000),
) {
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  await db.query(
    `
      insert into public.company_registry_cache (
        company_id,
        document,
        provider,
        normalized_payload,
        status,
        fetched_at,
        expires_at,
        created_by,
        updated_by
      )
      values ($1, $2, $3, $4, 'found', $5, $6, $7, $7)
      on conflict (provider, document)
      where deleted_at is null
      do update set
        company_id = excluded.company_id,
        normalized_payload = excluded.normalized_payload,
        status = 'found',
        fetched_at = excluded.fetched_at,
        expires_at = excluded.expires_at,
        updated_at = now(),
        updated_by = excluded.updated_by
    `,
    [
      context.companyId,
      payload.document,
      payload.provider,
      JSON.stringify(payload),
      payload.fetchedAt,
      expiresAt,
      context.authUserId,
    ],
  );
}

export async function assertCompanyRegistryRateLimit(
  db: QueryableConnection,
  context: AuthenticatedUserContext,
  provider: string,
  document: string,
) {
  const limit = Number(process.env["CNPJ_LOOKUP_RATE_LIMIT"] ?? 3);
  const result = await db.query(
    `
      insert into public.company_registry_rate_limits (
        company_id,
        auth_user_id,
        document,
        provider,
        window_start,
        count,
        created_by,
        updated_by
      )
      values (
        $1,
        $2,
        $3,
        $4,
        date_trunc('minute', now()),
        1,
        $2,
        $2
      )
      on conflict (company_id, auth_user_id, document, provider, window_start)
      do update set count = company_registry_rate_limits.count + 1,
                    updated_at = now(),
                    updated_by = excluded.updated_by
      returning count
    `,
    [context.companyId, context.authUserId, document, provider],
  );

  if (Number(result.rows[0]?.["count"] ?? 0) > limit) {
    throw new CompanyRegistryError(
      "rate_limited",
      "Limite de consultas atingido. Aguarde um momento e tente novamente.",
      429,
    );
  }
}

export async function lookupCompanyRegistry(
  db: QueryableConnection,
  context: AuthenticatedUserContext,
  documentValue: string,
) {
  const document = normalizeCompanyRegistryDocument(documentValue);
  const provider = resolveCompanyRegistryProvider();
  const cached = await readCompanyRegistryCache(db, provider.key, document);
  if (cached) return cached;

  await assertCompanyRegistryRateLimit(db, context, provider.key, document);

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env["CNPJ_LOOKUP_TIMEOUT_MS"] ?? 8_000),
  );

  try {
    const payload = await provider.lookup(document, controller.signal);
    await writeCompanyRegistryCache(db, context, payload);
    return payload;
  } catch (error) {
    if (error instanceof CompanyRegistryError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new CompanyRegistryError(
        "timeout",
        "O serviço de consulta demorou para responder. Você pode preencher os dados manualmente.",
        504,
      );
    }
    throw new CompanyRegistryError(
      "unavailable",
      "Não foi possível consultar o CNPJ agora. O cadastro manual continua disponível.",
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
