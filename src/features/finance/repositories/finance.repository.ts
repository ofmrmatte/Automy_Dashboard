import type { Charge } from "@/features/finance/types";

export const financeRepository = {
  listCharges: async (): Promise<Charge[]> => {
    if (typeof window === "undefined") return [];

    const response = await fetch("/api/finance/charges");
    if (!response.ok) {
      throw new Error("Não foi possível carregar as cobranças.");
    }

    const payload = (await response.json()) as { charges?: Charge[] };
    return payload.charges ?? [];
  },
};
