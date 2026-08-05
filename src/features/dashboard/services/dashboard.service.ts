import { dashboardRepository } from "@/features/dashboard/repositories/dashboard.repository";

export const dashboardService = {
  getSummary: () => dashboardRepository.getSummary(),
  getCharts: () => dashboardRepository.getCharts(),
  getRecentClients: () => dashboardRepository.getRecentClients(),
  getRecentActivities: () => dashboardRepository.getRecentActivities(),
};
