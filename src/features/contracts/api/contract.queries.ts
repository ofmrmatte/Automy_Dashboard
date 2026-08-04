import { queryOptions } from "@tanstack/react-query";
import { contractService } from "@/features/contracts/services/contract.service";

export const contractQueryKeys = {
  all: ["contracts"] as const,
};

export function contractsQueryOptions() {
  return queryOptions({
    queryKey: contractQueryKeys.all,
    queryFn: () => contractService.listContracts(),
    enabled: typeof window !== "undefined",
  });
}
