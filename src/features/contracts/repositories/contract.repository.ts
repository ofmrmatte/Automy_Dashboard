import type { Contract, ContractStatus } from "@/features/contracts/types";
import type { ContractFormData } from "@/features/contracts/validation";
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
  contract_version?: number | null;
  contract_hash?: string | null;
  signature_status?: Contract["signatureStatus"] | null;
  signed_document_path?: string | null;
};

function mapContractStatus(status: string): ContractStatus {
  if (status === "active" || status === "Ativo") return "Ativo";
  if (status === "onboarding" || status === "Implantação") return "Implantação";
  if (status === "renewal" || status === "Renovação") return "Renovação";
  if (status === "suspended" || status === "Suspenso") return "Suspenso";
  if (status === "cancelled" || status === "Cancelado") return "Cancelado";
  if (status === "ended" || status === "Encerrado") return "Encerrado";
  return "Pendente";
}

function mapContract(row: ContractRow): Contract {
  return {
    id: row.id,
    clientId: row.client_id,
    productId: row.product_id ?? "",
    client: row.client_trade_name ?? row.client_legal_name ?? row.client_id,
    product: row.product_name ?? "",
    plan: row.product_name ?? row.name ?? "",
    value: row.monthly_value ? formatCurrency(row.monthly_value) : "",
    monthlyValue: Number(row.monthly_value ?? 0),
    implementationValue: Number(row.implementation_value ?? 0),
    start: row.starts_at ? formatDate(row.starts_at) : "",
    startsAt: row.starts_at ?? "",
    renewal: row.ends_at ? formatDate(row.ends_at) : "",
    endsAt: row.ends_at ?? "",
    renewalAt: row.renewal_at ?? "",
    billingPeriod: row.billing_period ?? "",
    status: mapContractStatus(row.status),
    signerName: row.signer_name ?? null,
    witnessName: row.witness_name ?? null,
    contractText: row.contract_text ?? null,
    contractVersion: Number(row.contract_version ?? 1),
    contractHash: row.contract_hash ?? null,
    signatureStatus: row.signature_status ?? "draft",
    signedDocumentPath: row.signed_document_path ?? null,
    notes: row.notes ?? null,
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
  create: async (payload: ContractFormData) => {
    const response = await fetch("/api/contracts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível salvar o contrato.");
    }

    const result = (await response.json()) as { contract: ContractRow };
    return mapContract(result.contract);
  },
  update: async (payload: ContractFormData & { id: string }) => {
    const response = await fetch("/api/contracts", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível atualizar o contrato.");
    }

    const result = (await response.json()) as { contract: ContractRow };
    return mapContract(result.contract);
  },
  updateStatus: async (contractId: string, status: ContractStatus) => {
    const response = await fetch("/api/contracts", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: contractId, status }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível atualizar o status.");
    }
  },
  remove: async (contractId: string) => {
    const response = await fetch(`/api/contracts?id=${encodeURIComponent(contractId)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível excluir o contrato.");
    }
  },
  generateVersion: async (contractId: string) => {
    const response = await fetch("/api/contracts/versions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: contractId }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível gerar nova versão.");
    }

    const result = (await response.json()) as { contract: ContractRow };
    return mapContract(result.contract);
  },
  sendToSignature: async (contractId: string) => {
    const response = await fetch("/api/contracts/signature", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: contractId, action: "send" }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível enviar para assinatura.");
    }
  },
};
