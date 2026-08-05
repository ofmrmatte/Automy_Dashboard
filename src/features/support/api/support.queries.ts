import { queryOptions } from "@tanstack/react-query";
import { supportService } from "@/features/support/services/support.service";

export const supportQueryKeys = {
  all: ["support"] as const,
  tickets: ["support", "tickets"] as const,
};

export function ticketsQueryOptions() {
  return queryOptions({
    queryKey: supportQueryKeys.tickets,
    queryFn: () => supportService.listTickets(),
    enabled: typeof window !== "undefined",
  });
}
