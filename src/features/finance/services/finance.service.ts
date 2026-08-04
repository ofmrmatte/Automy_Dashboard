import { financeRepository } from "@/features/finance/repositories/finance.repository";
import type { Charge, ChargeFilter } from "@/features/finance/types";
import { normalizeSearch } from "@/shared/utils/formatters";

export const financeService = {
  listCharges: () => financeRepository.listCharges(),
  filterCharges: (charges: Charge[], filter: ChargeFilter) => {
    const term = normalizeSearch(filter.search);
    return charges.filter(
      (charge) =>
        normalizeSearch(charge.client).includes(term) &&
        (filter.status === "Todos" || charge.status === filter.status),
    );
  },
};
