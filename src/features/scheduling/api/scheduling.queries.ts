import { queryOptions } from "@tanstack/react-query";
import { schedulingService } from "@/features/scheduling/services/scheduling.service";

export const schedulingQueryKeys = {
  all: ["scheduling"] as const,
  calls: ["scheduling", "calls"] as const,
};

export function scheduledCallsQueryOptions() {
  return queryOptions({
    queryKey: schedulingQueryKeys.calls,
    queryFn: () => schedulingService.listCalls(),
    enabled: typeof window !== "undefined",
  });
}
