import { dashboardRepository } from "@/features/dashboard/repositories/dashboard.repository";

export const dashboardService = {
  getSummary: () => dashboardRepository.getSummary(),
  getClientGrowth: () => dashboardRepository.getClientGrowth(),
  getRevenueGrowth: () => dashboardRepository.getRevenueGrowth(),
  getRecentActivities: () => dashboardRepository.getRecentActivities(),
};
