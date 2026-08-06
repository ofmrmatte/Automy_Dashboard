import { financeRepository } from "@/features/finance/repositories/finance.repository";
import type { Charge, ChargeFilter, ChargeStatus } from "@/features/finance/types";
import { normalizeSearch } from "@/shared/utils/formatters";

export const financeService = {
  listCharges: () => financeRepository.listCharges(),
  createCharge: (payload: Parameters<typeof financeRepository.createCharge>[0]) =>
    financeRepository.createCharge(payload),
  updateCharge: (payload: Parameters<typeof financeRepository.updateCharge>[0]) =>
    financeRepository.updateCharge(payload),
  markChargePaid: (chargeId: string) => financeRepository.updateStatus(chargeId, "paid"),
  cancelCharge: (chargeId: string) => financeRepository.updateStatus(chargeId, "canceled"),
  updateChargeStatus: (chargeId: string, status: ChargeStatus) =>
    financeRepository.updateStatus(chargeId, status),
  removeCharge: (chargeId: string) => financeRepository.removeCharge(chargeId),
  filterCharges: (charges: Charge[], filter: ChargeFilter) => {
    const term = normalizeSearch(filter.search);
    return charges.filter((charge) => {
      const matchesSearch = [
        charge.invoice,
        charge.reference,
        charge.client,
        charge.contract,
        charge.method,
        charge.description,
        charge.notes,
      ].some((value) => normalizeSearch(value ?? "").includes(term));
      const matchesStatus = filter.status === "all" || charge.status === filter.status;

      return matchesSearch && matchesStatus;
    });
  },
};
