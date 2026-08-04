import type { Activity, ClientGrowthPoint, RevenueGrowthPoint } from "@/features/dashboard/types";

export const clientGrowthMock: ClientGrowthPoint[] = [
  { month: "Fev", active: 72, onboarding: 8 },
  { month: "Mar", active: 78, onboarding: 6 },
  { month: "Abr", active: 84, onboarding: 9 },
  { month: "Mai", active: 91, onboarding: 7 },
  { month: "Jun", active: 99, onboarding: 11 },
  { month: "Jul", active: 108, onboarding: 12 },
];

export const revenueGrowthMock: RevenueGrowthPoint[] = [
  { month: "Fev", revenue: 312 },
  { month: "Mar", revenue: 338 },
  { month: "Abr", revenue: 351 },
  { month: "Mai", revenue: 379 },
  { month: "Jun", revenue: 402 },
  { month: "Jul", revenue: 428 },
];

export const recentActivitiesMock: Activity[] = [
  { title: "Contrato renovado", meta: "Atlas Saúde · há 18 min" },
  { title: "Novo chamado crítico", meta: "SUP-1842 · há 42 min" },
  { title: "Pagamento confirmado", meta: "Verdi Energia · há 1h" },
  { title: "Cliente adicionado", meta: "Orbe Logística · há 2h" },
];
