import { dashboardRepository } from "@/features/dashboard/repositories/dashboard.repository";

export const dashboardService = {
  getClientGrowthSnapshot: () => dashboardRepository.getClientGrowthSnapshot(),
  getRevenueGrowthSnapshot: () => dashboardRepository.getRevenueGrowthSnapshot(),
  getRecentActivitiesSnapshot: () => dashboardRepository.getRecentActivitiesSnapshot(),
  getClientGrowth: () => dashboardRepository.getClientGrowth(),
  getRevenueGrowth: () => dashboardRepository.getRevenueGrowth(),
  getRecentActivities: () => dashboardRepository.getRecentActivities(),
};
