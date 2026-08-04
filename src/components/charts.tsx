import {
  ClientChart as ClientChartBase,
  RevenueChart as RevenueChartBase,
} from "@/features/dashboard/components/dashboard-charts";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";

export function ClientChart() {
  return <ClientChartBase data={dashboardService.getClientGrowthSnapshot()} />;
}

export function RevenueChart() {
  return <RevenueChartBase data={dashboardService.getRevenueGrowthSnapshot()} />;
}
