import type { Contract, ContractStatus } from "@/features/contracts/types";
import type { ContractFormData } from "@/features/contracts/validation";
import type { Database } from "@/shared/types/database";
import { RepositoryError } from "@/shared/api/errors";
import { formatCurrency, formatDate } from "@/shared/utils/formatters";
import type { ContractPaymentTerms, ContractNegotiatedTerms } from "@/features/contracts/types";

type ContractRow = Omit<Database["public"]["Tables"]["contracts"]["Row"], "client" | "product"> & {
  client_trade_name: string | null;
  client_legal_name: string | null;
  product_name: string | null;
  signer_name?: string | null;
  signer_document?: string | null;
  signer_email?: string | null;
  signer_phone?: string | null;
  portal_access_enabled?: boolean | null;
  portal_contact_name?: string | null;
  portal_contact_email?: string | null;
  automy_representative?: string | null;
  witness_name?: string | null;
  witness_document?: string | null;
  contract_text?: string | null;
  contract_version?: number | null;
  contract_hash?: string | null;
  signature_status?: Contract["signatureStatus"] | null;
  signed_document_path?: string | null;
  payment_terms?: ContractPaymentTerms | null;
  negotiated_terms?: ContractNegotiatedTerms | null;
  contract_snapshot?: unknown;
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
    plan: row.name ?? row.product_name ?? "",
    description: row.description ?? null,
    scope: row.scope ?? null,
    deliverables: row.deliverables ?? null,
    value: row.monthly_value ? formatCurrency(row.monthly_value) : "",
    basePriceReference: Number(row.base_price_reference ?? 0),
    monthlyValue: Number(row.monthly_value ?? 0),
    implementationValue: Number(row.implementation_value ?? 0),
    implementationDays: Number(row.implementation_days ?? 0),
    discountPercent: Number(row.discount_percent ?? 0),
    paymentMethod: row.payment_method ?? "Boleto",
    installmentsCount: Number(row.installments_count ?? 1),
    installmentDueDays: Array.isArray(row.installment_due_days) ? row.installment_due_days : [],
    paymentTerms: row.payment_terms ?? null,
    includedUsers: Number(row.included_users ?? 1),
    additionalUsers: Number(row.additional_users ?? 0),
    additionalUserAmount: Number(row.additional_user_amount ?? 0),
    hostedByAutomy: Boolean(row.hosted_by_automy ?? true),
    customUrlEnabled: Boolean(row.custom_url_enabled ?? false),
    databaseCost: Number(row.database_cost ?? 0),
    databaseQuantity: Number(row.database_quantity ?? 0),
    loyaltyMonths: Number(row.loyalty_months ?? 0),
    currency: row.currency ?? "BRL",
    start: row.starts_at ? formatDate(row.starts_at) : "",
    startsAt: row.starts_at ?? "",
    renewal: row.ends_at ? formatDate(row.ends_at) : "",
    endsAt: row.ends_at ?? "",
    renewalAt: row.renewal_at ?? "",
    billingPeriod: row.billing_period ?? "",
    status: mapContractStatus(row.status),
    signerName: row.signer_name ?? null,
    signerDocument: row.signer_document ?? null,
    signerEmail: row.signer_email ?? null,
    signerPhone: row.signer_phone ?? null,
    portalAccessEnabled: Boolean(row.portal_access_enabled ?? true),
    portalContactName: row.portal_contact_name ?? null,
    portalContactEmail: row.portal_contact_email ?? null,
    automyRepresentative: row.automy_representative ?? null,
    witnessName: row.witness_name ?? null,
    witnessDocument: row.witness_document ?? null,
    contractText: row.contract_text ?? null,
    contractVersion: Number(row.contract_version ?? 1),
    contractHash: row.contract_hash ?? null,
    signatureStatus: row.signature_status ?? "draft",
    signedDocumentPath: row.signed_document_path ?? null,
    notes: row.notes ?? null,
    operationalNotes: row.operational_notes ?? null,
    negotiatedTerms: row.negotiated_terms ?? null,
    contractSnapshot: row.contract_snapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function filenameFromDisposition(disposition: string | null) {
  const match = disposition?.match(/filename="([^"]+)"/i);
  return match?.[1] ?? "contrato-automy.pdf";
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
  markSigned: async (contractId: string) => {
    const response = await fetch("/api/contracts/signature", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: contractId, action: "mark-signed" }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível formalizar o contrato.");
    }

    return response.json() as Promise<{
      ok: boolean;
      provisioning?: { status?: string; error?: string };
      message?: string;
    }>;
  },
  getPdf: async (contractId: string, download = false) => {
    const params = new URLSearchParams({ id: contractId });
    if (download) params.set("download", "1");

    const response = await fetch(`/api/contracts/pdf?${params.toString()}`, {
      credentials: "include",
      headers: { accept: "application/pdf" },
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível gerar o contrato.");
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/pdf")) {
      throw new RepositoryError("Não foi possível gerar o contrato.");
    }

    return {
      blob: await response.blob(),
      filename: filenameFromDisposition(response.headers.get("content-disposition")),
    };
  },
};
