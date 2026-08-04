import {
  clientGrowthMock,
  recentActivitiesMock,
  revenueGrowthMock,
} from "@/features/dashboard/mocks/dashboard.mock";

export const dashboardRepository = {
  getClientGrowthSnapshot: () => clientGrowthMock,
  getRevenueGrowthSnapshot: () => revenueGrowthMock,
  getRecentActivitiesSnapshot: () => recentActivitiesMock,
  getClientGrowth: async () => clientGrowthMock,
  getRevenueGrowth: async () => revenueGrowthMock,
  getRecentActivities: async () => recentActivitiesMock,
};
