import { queryOptions } from "@tanstack/react-query";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";

export const dashboardQueryKeys = {
  summary: ["dashboard", "summary"] as const,
  charts: ["dashboard", "charts"] as const,
  recentClients: ["dashboard", "recent-clients"] as const,
};

export function dashboardSummaryQueryOptions() {
  return queryOptions({
    queryKey: dashboardQueryKeys.summary,
    queryFn: () => dashboardService.getSummary(),
    enabled: typeof window !== "undefined",
  });
}

export function dashboardChartsQueryOptions() {
  return queryOptions({
    queryKey: dashboardQueryKeys.charts,
    queryFn: () => dashboardService.getCharts(),
    enabled: typeof window !== "undefined",
  });
}

export function dashboardRecentClientsQueryOptions() {
  return queryOptions({
    queryKey: dashboardQueryKeys.recentClients,
    queryFn: () => dashboardService.getRecentClients(),
    enabled: typeof window !== "undefined",
  });
}
