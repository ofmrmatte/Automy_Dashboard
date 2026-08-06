import { contractRepository } from "@/features/contracts/repositories/contract.repository";
import type { Contract, ContractFilter } from "@/features/contracts/types";
import { normalizeSearch } from "@/shared/utils/formatters";

export const contractService = {
  listContracts: () => contractRepository.list(),
  createContract: (payload: Parameters<typeof contractRepository.create>[0]) =>
    contractRepository.create(payload),
  updateContract: (payload: Parameters<typeof contractRepository.update>[0]) =>
    contractRepository.update(payload),
  updateContractStatus: (contractId: string, status: Contract["status"]) =>
    contractRepository.updateStatus(contractId, status),
  deleteContract: (contractId: string) => contractRepository.remove(contractId),
  generateContractVersion: (contractId: string) => contractRepository.generateVersion(contractId),
  sendContractToSignature: (contractId: string) => contractRepository.sendToSignature(contractId),
  getContractPdf: (contractId: string, download = false) =>
    contractRepository.getPdf(contractId, download),
  filterContracts: (contracts: Contract[], filter: ContractFilter) => {
    const term = normalizeSearch(filter.search);
    return contracts.filter(
      (contract) =>
        [
          contract.client,
          contract.product,
          contract.plan,
          contract.signerName,
          contract.notes,
        ].some((value) => normalizeSearch(value ?? "").includes(term)) &&
        (filter.status === "Todos" || contract.status === filter.status),
    );
  },
};
