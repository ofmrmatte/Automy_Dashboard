import { queryOptions } from "@tanstack/react-query";
import { financeService } from "@/features/finance/services/finance.service";

export const financeQueryKeys = {
  all: ["finance"] as const,
  charges: ["finance", "charges"] as const,
};

export function chargesQueryOptions() {
  return queryOptions({
    queryKey: financeQueryKeys.charges,
    queryFn: () => financeService.listCharges(),
    enabled: typeof window !== "undefined",
  });
}
