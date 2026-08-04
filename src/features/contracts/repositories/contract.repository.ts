import type { Contract, ContractStatus } from "@/features/contracts/types";
import type { Database } from "@/shared/types/database";
import { RepositoryError } from "@/shared/api/errors";
import { getSupabaseClient } from "@/shared/lib/supabase/client";
import { formatCurrency, formatDate } from "@/shared/utils/formatters";

type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];

function mapContractStatus(status: string): ContractStatus {
  if (status === "active" || status === "Ativo") return "Ativo";
  if (status === "onboarding" || status === "Implantação") return "Implantação";
  if (status === "renewal" || status === "Renovação") return "Renovação";
  return "Pendente";
}

function mapContract(row: ContractRow): Contract {
  return {
    id: row.id,
    client: row.client?.trade_name ?? row.client?.legal_name ?? row.client_id,
    plan: row.product?.name ?? row.name ?? "",
    value: row.monthly_value ? formatCurrency(row.monthly_value) : "",
    start: row.starts_at ? formatDate(row.starts_at) : "",
    renewal: row.ends_at ? formatDate(row.ends_at) : "",
    status: mapContractStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export const contractRepository = {
  list: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("contracts")
      .select("*, client:clients(trade_name, legal_name), product:products(name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new RepositoryError("Não foi possível carregar contratos.", { cause: error });
    }

    return ((data ?? []) as ContractRow[]).map(mapContract);
  },
};
