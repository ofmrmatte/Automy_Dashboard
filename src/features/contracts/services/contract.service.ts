import { contractRepository } from "@/features/contracts/repositories/contract.repository";
import type { Contract, ContractFilter } from "@/features/contracts/types";
import { normalizeSearch } from "@/shared/utils/formatters";

export const contractService = {
  listContracts: () => contractRepository.list(),
  createContract: (payload: Parameters<typeof contractRepository.create>[0]) =>
    contractRepository.create(payload),
  filterContracts: (contracts: Contract[], filter: ContractFilter) => {
    const term = normalizeSearch(filter.search);
    return contracts.filter(
      (contract) =>
        normalizeSearch(contract.client).includes(term) &&
        (filter.status === "Todos" || contract.status === filter.status),
    );
  },
};
