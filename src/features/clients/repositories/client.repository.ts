import type { Client, ClientStatus } from "@/features/clients/types";
import type { Database } from "@/shared/types/database";
import { RepositoryError } from "@/shared/api/errors";
import { getSupabaseClient } from "@/shared/lib/supabase/client";
import { formatCnpj, formatDate, getInitials } from "@/shared/utils/formatters";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

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
    owner: "",
    plan: "",
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
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new RepositoryError("Não foi possível carregar clientes.", { cause: error });
    }

    return (data ?? []).map(mapClient);
  },
  findById: async (clientId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new RepositoryError("Não foi possível carregar o cliente.", { cause: error });
    }

    return data ? mapClient(data) : undefined;
  },
};
