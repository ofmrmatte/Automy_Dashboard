import type { Client, ClientStatus } from "@/features/clients/types";
import type { Database } from "@/shared/types/database";
import { RepositoryError } from "@/shared/api/errors";
import { formatCnpj, formatDate, getInitials } from "@/shared/utils/formatters";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"] & {
  owner_name?: string | null;
  plan_name?: string | null;
};

function mapClientStatus(status: string): ClientStatus {
  if (status === "active" || status === "Ativo") return "Ativo";
  if (status === "onboarding" || status === "Implantação") return "Implantação";
  return "Pendente";
}

function mapClient(row: ClientRow): Client {
  const name = row.trade_name ?? row.legal_name;

  return {
    id: row.id,
    initials: getInitials(name),
    name,
    legal: row.legal_name,
    cnpj: row.document ? formatCnpj(row.document) : "",
    city: row.city ?? "",
    state: row.state ?? "",
    owner: row.owner_name ?? "",
    plan: row.plan_name ?? "",
    status: mapClientStatus(row.status),
    joined: formatDate(row.created_at),
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
  create: async (payload: {
    tradeName: string;
    legalName: string;
    document: string;
    city: string;
    state: string;
    owner: string;
    plan: string;
    status: ClientStatus;
  }) => {
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível salvar o cliente.");
    }

    const result = (await response.json()) as { client: ClientRow };
    return mapClient(result.client);
  },
};
