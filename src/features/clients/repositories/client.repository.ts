import type { Client, ClientStatus } from "@/features/clients/types";
import type { ClientFormData } from "@/features/clients/validation";
import type { Database } from "@/shared/types/database";
import { RepositoryError } from "@/shared/api/errors";
import { formatCpfCnpj, formatDate, getInitials } from "@/shared/utils/formatters";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"] & {
  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  plan_name?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  address_district?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_postal_code?: string | null;
  address_country?: string | null;
  portal_accesses?: unknown;
};

type PortalAccessAction = "resend" | "generate" | "disable";

function mapPortalAccesses(value: unknown): Client["portalAccesses"] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      id: String(item["id"] ?? ""),
      name: String(item["name"] ?? ""),
      email: String(item["email"] ?? ""),
      role: String(item["role"] ?? ""),
      status: String(item["status"] ?? ""),
      lastLogin: typeof item["lastLogin"] === "string" ? item["lastLogin"] : null,
      activatedAt: typeof item["activatedAt"] === "string" ? item["activatedAt"] : null,
      provisioningStatus:
        typeof item["provisioningStatus"] === "string" ? item["provisioningStatus"] : null,
      sentAt: typeof item["sentAt"] === "string" ? item["sentAt"] : null,
      failedAt: typeof item["failedAt"] === "string" ? item["failedAt"] : null,
      failureReason: typeof item["failureReason"] === "string" ? item["failureReason"] : null,
    }))
    .filter((item) => item.id);
}

function mapClientStatus(status: string): ClientStatus {
  if (status === "active" || status === "Ativo") return "Ativo";
  if (status === "onboarding" || status === "Implantação") return "Implantação";
  if (status === "inactive" || status === "Inativo") return "Inativo";
  if (status === "blocked" || status === "Bloqueado") return "Bloqueado";
  return "Pendente";
}

function mapClient(row: ClientRow): Client {
  const name = row.trade_name ?? row.legal_name;

  return {
    id: row.id,
    initials: getInitials(name),
    name,
    legal: row.legal_name,
    cnpj: row.document ? formatCpfCnpj(row.document) : "",
    stateRegistration: row.state_registration ?? "",
    municipalRegistration: row.municipal_registration ?? "",
    legalNature: row.legal_nature ?? "",
    cnae: row.cnae ?? "",
    registrationStatus: row.registration_status ?? "",
    openedAt: row.opened_at ?? "",
    segment: row.segment ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    website: row.website ?? "",
    notes: row.notes ?? "",
    logoUrl: row.logo_url ?? "",
    owner: row.owner_name ?? "",
    ownerEmail: row.owner_email ?? "",
    ownerPhone: row.owner_phone ?? "",
    plan: row.plan_name ?? "",
    status: mapClientStatus(row.status),
    joined: formatDate(row.created_at),
    address: {
      street: row.address_street ?? "",
      number: row.address_number ?? "",
      complement: row.address_complement ?? "",
      district: row.address_district ?? "",
      city: row.address_city ?? row.city ?? "",
      state: row.address_state ?? row.state ?? "",
      postalCode: row.address_postal_code ?? "",
      country: row.address_country ?? "BR",
    },
    portalAccesses: mapPortalAccesses(row.portal_accesses),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export const clientRepository = {
  list: async () => {
    const response = await fetch("/api/clients");
    if (!response.ok) {
      throw new RepositoryError("Não foi possível carregar clientes.");
    }

    const payload = (await response.json()) as { clients?: ClientRow[] };
    return (payload.clients ?? []).map(mapClient);
  },
  findById: async (clientId: string) => {
    const response = await fetch(`/api/clients?id=${encodeURIComponent(clientId)}`);
    if (!response.ok) {
      throw new RepositoryError("Não foi possível carregar o cliente.");
    }

    const payload = (await response.json()) as { client?: ClientRow | null };
    return payload.client ? mapClient(payload.client) : undefined;
  },
  create: async (payload: ClientFormData) => {
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível salvar o cliente.");
    }

    const result = (await response.json()) as { client: ClientRow | null };
    if (!result.client) throw new RepositoryError("Cliente criado, mas não retornado pela API.");
    return mapClient(result.client);
  },
  update: async (payload: ClientFormData) => {
    const response = await fetch("/api/clients", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível atualizar o cliente.");
    }

    const result = (await response.json()) as { client: ClientRow | null };
    if (!result.client)
      throw new RepositoryError("Cliente atualizado, mas não retornado pela API.");
    return mapClient(result.client);
  },
  remove: async (clientId: string) => {
    const response = await fetch(`/api/clients?id=${encodeURIComponent(clientId)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível excluir o cliente.");
    }

    return true;
  },
  portalAccessAction: async (portalUserId: string, action: PortalAccessAction) => {
    const response = await fetch("/api/portal-admin/access", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ portalUserId, action }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível atualizar o acesso.");
    }

    return response.json();
  },
};
