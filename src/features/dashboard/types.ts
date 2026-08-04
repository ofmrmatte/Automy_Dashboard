import type { AuditableEntity } from "@/shared/types/entity";

export type DashboardSummary = {
  activeClients: number;
  onboardingClients: number;
  monthlyRevenue: number;
  annualRevenue: number;
  openTickets: number;
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

export type Activity = AuditableEntity & {
  id: string;
  title: string;
  meta: string;
};
