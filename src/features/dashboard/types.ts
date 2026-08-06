import type { AuditableEntity } from "@/shared/types/entity";

export type DashboardSummary = {
  activeClients: number;
  onboardingClients: number;
  inactiveClients: number;
  activeContracts: number;
  expiringContracts30: number;
  expiringContracts60: number;
  monthlyRevenue: number;
  annualRevenue: number;
  pendingCharges: number;
  overdueCharges: number;
  openTickets: number;
  criticalTickets: number;
  futureScheduledCalls: number;
  activeUsers: number;
  expiringContracts: number;
};

export type ClientGrowthPoint = {
  month: string;
  active: number;
  onboarding: number;
};

export type RevenueGrowthPoint = {
  month: string;
  revenue: number;
};

export type StatusDistributionPoint = {
  name: string;
  value: number;
};

export type ProductUsagePoint = {
  name: string;
  clients: number;
};

export type Activity = AuditableEntity & {
  id: string;
  title: string;
  meta: string;
};

export type DashboardRecentClient = AuditableEntity & {
  id: string;
  initials: string;
  name: string;
  city: string;
  state: string;
  status: string;
};

export type DashboardCharts = {
  clientGrowth: ClientGrowthPoint[];
  revenueGrowth: RevenueGrowthPoint[];
  contractsByStatus: StatusDistributionPoint[];
  ticketsByPriority: StatusDistributionPoint[];
  productsByUsage: ProductUsagePoint[];
  chargesByStatus: StatusDistributionPoint[];
};
