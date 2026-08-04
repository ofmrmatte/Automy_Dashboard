import { contractRepository } from "@/features/contracts/repositories/contract.repository";
import type { Contract, ContractFilter } from "@/features/contracts/types";
import { normalizeSearch } from "@/shared/utils/formatters";

export const contractService = {
  getContractsSnapshot: () => contractRepository.listSnapshot(),
  listContracts: () => contractRepository.list(),
  filterContracts: (contracts: Contract[], filter: ContractFilter) => {
    const term = normalizeSearch(filter.search);
    return contracts.filter(
      (contract) =>
        normalizeSearch(contract.client).includes(term) &&
        (filter.status === "Todos" || contract.status === filter.status),
    );
  },
};
