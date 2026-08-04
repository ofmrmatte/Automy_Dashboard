import { queryOptions } from "@tanstack/react-query";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";

export const dashboardQueryKeys = {
  clientGrowth: ["dashboard", "client-growth"] as const,
  revenueGrowth: ["dashboard", "revenue-growth"] as const,
  recentActivities: ["dashboard", "recent-activities"] as const,
};

export function clientGrowthQueryOptions() {
  return queryOptions({
    queryKey: dashboardQueryKeys.clientGrowth,
    queryFn: () => dashboardService.getClientGrowth(),
  });
}

export function revenueGrowthQueryOptions() {
  return queryOptions({
    queryKey: dashboardQueryKeys.revenueGrowth,
    queryFn: () => dashboardService.getRevenueGrowth(),
  });
}

export function recentActivitiesQueryOptions() {
  return queryOptions({
    queryKey: dashboardQueryKeys.recentActivities,
    queryFn: () => dashboardService.getRecentActivities(),
  });
}
