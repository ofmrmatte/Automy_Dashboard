import {
  lookupCompanyRegistry,
  CompanyRegistryError,
} from "@/features/clients/server/company-registry-provider";
import { jsonResponse, requireAuthenticatedUser, requirePermission } from "@/shared/server/authz";
import { getRailwayPostgresPool } from "@/shared/server/postgres";

const CNPJ_LOOKUP_PATH = "/api/company-lookup/cnpj";

function errorResponse(error: unknown) {
  if (error instanceof CompanyRegistryError) {
    return jsonResponse({ error: error.message }, { status: error.status });
  }

  return jsonResponse(
    { error: "Não foi possível consultar o CNPJ agora. O cadastro manual continua disponível." },
    { status: 502 },
  );
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
    const db = await getRailwayPostgresPool();
    const document = url.searchParams.get("document") ?? "";
    const company = await lookupCompanyRegistry(db, auth.context, document);
    return jsonResponse({ company });
  } catch (error) {
    return errorResponse(error);
  }
}
