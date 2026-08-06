import { queryOptions } from "@tanstack/react-query";
import { searchService } from "@/features/search/services/search.service";

export const searchQueryKeys = {
  all: ["search"] as const,
  global: (query: string) => ["search", "global", query] as const,
};

export function globalSearchQueryOptions(query: string) {
  return queryOptions({
    queryKey: searchQueryKeys.global(query),
    queryFn: () => searchService.global(query),
    enabled: typeof window !== "undefined" && query.trim().length >= 2,
  });
}
