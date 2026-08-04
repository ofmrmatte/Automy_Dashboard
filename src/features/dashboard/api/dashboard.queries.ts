import { queryOptions } from "@tanstack/react-query";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";

export const dashboardQueryKeys = {
  summary: ["dashboard", "summary"] as const,
  clientGrowth: ["dashboard", "client-growth"] as const,
  revenueGrowth: ["dashboard", "revenue-growth"] as const,
  recentActivities: ["dashboard", "recent-activities"] as const,
};

export function dashboardSummaryQueryOptions() {
  return queryOptions({
    queryKey: dashboardQueryKeys.summary,
    queryFn: () => dashboardService.getSummary(),
    enabled: typeof window !== "undefined",
  });
}

export function clientGrowthQueryOptions() {
  return queryOptions({
    queryKey: dashboardQueryKeys.clientGrowth,
    queryFn: () => dashboardService.getClientGrowth(),
    enabled: typeof window !== "undefined",
  });
}

export function revenueGrowthQueryOptions() {
  return queryOptions({
    queryKey: dashboardQueryKeys.revenueGrowth,
    queryFn: () => dashboardService.getRevenueGrowth(),
    enabled: typeof window !== "undefined",
  });
}

export function recentActivitiesQueryOptions() {
  return queryOptions({
    queryKey: dashboardQueryKeys.recentActivities,
    queryFn: () => dashboardService.getRecentActivities(),
    enabled: typeof window !== "undefined",
  });
}
