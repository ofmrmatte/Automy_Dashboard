import { z } from "zod";
import { isValidCnpj, onlyDigits } from "@/shared/utils/document";
import { jsonResponse, requireAuthenticatedUser, requirePermission } from "@/shared/server/authz";

const CNPJ_LOOKUP_PATH = "/api/company-lookup/cnpj";
const cache = new Map<string, { expiresAt: number; payload: CompanyLookupPayload }>();
const rateLimit = new Map<string, { resetAt: number; count: number }>();

const brasilApiSchema = z.object({
  cnpj: z.string().optional(),
  razao_social: z.string().nullable().optional(),
  nome_fantasia: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  ddd_telefone_1: z.string().nullable().optional(),
  cep: z.string().nullable().optional(),
  logradouro: z.string().nullable().optional(),
  numero: z.string().nullable().optional(),
  complemento: z.string().nullable().optional(),
  bairro: z.string().nullable().optional(),
  municipio: z.string().nullable().optional(),
  uf: z.string().nullable().optional(),
  natureza_juridica: z.string().nullable().optional(),
  cnae_fiscal_descricao: z.string().nullable().optional(),
  descricao_situacao_cadastral: z.string().nullable().optional(),
  data_inicio_atividade: z.string().nullable().optional(),
});

type CompanyLookupPayload = {
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
  legalNature: string;
  cnae: string;
  registrationStatus: string;
  openedAt: string;
  source: string;
  cached: boolean;
};

function assertRateLimit(authUserId: string) {
  const now = Date.now();
  const current = rateLimit.get(authUserId);
  if (!current || current.resetAt < now) {
    rateLimit.set(authUserId, { resetAt: now + 60_000, count: 1 });
    return;
  }

  if (current.count >= Number(process.env["AUTOMY_CNPJ_LOOKUP_RATE_LIMIT"] ?? 20)) {
    throw new Error("Limite de consultas por minuto atingido. Tente novamente em instantes.");
  }

  current.count += 1;
}

function mapBrasilApi(
  payload: z.infer<typeof brasilApiSchema>,
  document: string,
): CompanyLookupPayload {
  return {
    document,
    legalName: payload.razao_social ?? "",
    tradeName: payload.nome_fantasia || payload.razao_social || "",
    email: payload.email ?? "",
    phone: payload.ddd_telefone_1 ?? "",
    postalCode: payload.cep ?? "",
    street: payload.logradouro ?? "",
    number: payload.numero ?? "",
    complement: payload.complemento ?? "",
    district: payload.bairro ?? "",
    city: payload.municipio ?? "",
    state: payload.uf ?? "",
    country: "BR",
    legalNature: payload.natureza_juridica ?? "",
    cnae: payload.cnae_fiscal_descricao ?? "",
    registrationStatus: payload.descricao_situacao_cadastral ?? "",
    openedAt: payload.data_inicio_atividade ?? "",
    source: "brasilapi",
    cached: false,
  };
}

async function lookupCnpj(document: string) {
  const cached = cache.get(document);
  if (cached && cached.expiresAt > Date.now()) return { ...cached.payload, cached: true };

  const provider = process.env["AUTOMY_CNPJ_PROVIDER"] ?? "brasilapi";
  if (provider !== "brasilapi") {
    throw new Error(`Provider de CNPJ '${provider}' ainda não possui adapter configurado.`);
  }

  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${document}`, {
    headers: { accept: "application/json" },
  });
  if (response.status === 404) throw new Error("CNPJ não encontrado no provider configurado.");
  if (!response.ok) throw new Error("Provider de CNPJ indisponível no momento.");

  const parsed = brasilApiSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Resposta inválida do provider de CNPJ.");

  const payload = mapBrasilApi(parsed.data, document);
  cache.set(document, {
    payload,
    expiresAt: Date.now() + Number(process.env["AUTOMY_CNPJ_LOOKUP_CACHE_MS"] ?? 86_400_000),
  });
  return payload;
}

export async function handleCompanyLookupApiRequest(request: Request) {
  const url = new URL(request.url);
  if (url.pathname !== CNPJ_LOOKUP_PATH) return null;
  if (request.method !== "GET") {
    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth.error) return auth.error;
  const permission = requirePermission(auth.context, "clients.manage");
  if (permission) return permission;

  try {
    assertRateLimit(auth.context.authUserId);
    const document = onlyDigits(url.searchParams.get("document") ?? "");
    if (!isValidCnpj(document)) {
      return jsonResponse({ error: "Informe um CNPJ válido." }, { status: 400 });
    }

    return jsonResponse({ company: await lookupCnpj(document) });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Não foi possível consultar o CNPJ." },
      { status: 400 },
    );
  }
}
