import { queryOptions } from "@tanstack/react-query";
import { leadService } from "@/features/leads/services/lead.service";
import type { LeadFilter } from "@/features/leads/types";

export const leadQueryKeys = {
  all: ["leads"] as const,
  list: (filter: LeadFilter) => ["leads", filter] as const,
};

export function leadsQueryOptions(filter: LeadFilter) {
  return queryOptions({
    queryKey: leadQueryKeys.list(filter),
    queryFn: () => leadService.listLeads(filter),
  });
}
