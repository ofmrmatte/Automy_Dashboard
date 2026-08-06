import type { Charge, ChargeStatus, FinancePayload } from "@/features/finance/types";
import type { ChargeFormData, ChargePatchData } from "@/features/finance/validation";
import { RepositoryError } from "@/shared/api/errors";

async function readError(response: Response, fallback: string) {
  const result = (await response.json().catch(() => null)) as { error?: string } | null;
  return result?.error ?? fallback;
}

export const financeRepository = {
  listCharges: async (): Promise<FinancePayload> => {
    if (typeof window === "undefined") {
      return {
        charges: [],
        summary: {
          monthlyRevenue: 0,
          annualRevenue: 0,
          overdueAmount: 0,
          expectedReceipts: 0,
          paidAmount: 0,
          openAmount: 0,
          delinquentClients: 0,
        },
      };
    }

    const response = await fetch("/api/finance/charges");
    if (!response.ok) {
      throw new RepositoryError(
        await readError(response, "Não foi possível carregar as cobranças."),
      );
    }

    return (await response.json()) as FinancePayload;
  },
  createCharge: async (payload: ChargeFormData) => {
    const response = await fetch("/api/finance/charges", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new RepositoryError(await readError(response, "Não foi possível criar a cobrança."));
    }

    return ((await response.json()) as { charge: Charge | null }).charge;
  },
  updateCharge: async (payload: ChargePatchData) => {
    const response = await fetch("/api/finance/charges", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new RepositoryError(
        await readError(response, "Não foi possível atualizar a cobrança."),
      );
    }

    return ((await response.json()) as { charge: Charge | null }).charge;
  },
  updateStatus: async (chargeId: string, status: ChargeStatus) => {
    return financeRepository.updateCharge({ id: chargeId, status });
  },
  removeCharge: async (chargeId: string) => {
    const response = await fetch(`/api/finance/charges?id=${encodeURIComponent(chargeId)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new RepositoryError(await readError(response, "Não foi possível excluir a cobrança."));
    }
  },
};
