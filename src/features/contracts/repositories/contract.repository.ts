import type { Contract, ContractStatus } from "@/features/contracts/types";
import type { Database } from "@/shared/types/database";
import { RepositoryError } from "@/shared/api/errors";
import { formatCurrency, formatDate } from "@/shared/utils/formatters";

type ContractRow = Omit<Database["public"]["Tables"]["contracts"]["Row"], "client" | "product"> & {
  client_trade_name: string | null;
  client_legal_name: string | null;
  product_name: string | null;
  signer_name?: string | null;
  witness_name?: string | null;
  contract_text?: string | null;
};

function mapContractStatus(status: string): ContractStatus {
  if (status === "active" || status === "Ativo") return "Ativo";
  if (status === "onboarding" || status === "Implantação") return "Implantação";
  if (status === "renewal" || status === "Renovação") return "Renovação";
  return "Pendente";
}

function mapContract(row: ContractRow): Contract {
  return {
    id: row.id,
    client: row.client_trade_name ?? row.client_legal_name ?? row.client_id,
    plan: row.product_name ?? row.name ?? "",
    value: row.monthly_value ? formatCurrency(row.monthly_value) : "",
    start: row.starts_at ? formatDate(row.starts_at) : "",
    renewal: row.ends_at ? formatDate(row.ends_at) : "",
    status: mapContractStatus(row.status),
    signerName: row.signer_name ?? null,
    witnessName: row.witness_name ?? null,
    contractText: row.contract_text ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export const contractRepository = {
  list: async () => {
    const response = await fetch("/api/contracts");
    if (!response.ok) {
      throw new RepositoryError("Não foi possível carregar contratos.");
    }

    const payload = (await response.json()) as { contracts?: ContractRow[] };
    return (payload.contracts ?? []).map(mapContract);
  },
  create: async (payload: {
    productId: string;
    companyName: string;
    document: string;
    signerName: string;
    hasWitness: boolean;
    witnessName: string;
    contractText: string;
  }) => {
    const response = await fetch("/api/contracts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new RepositoryError("Não foi possível salvar o contrato.");
    }

    const result = (await response.json()) as { contract: ContractRow };
    return mapContract(result.contract);
  },
};
